"""Deterministic collector contracts, no publisher network requests."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.robotparser import RobotFileParser

spec = importlib.util.spec_from_file_location("collector", Path(__file__).resolve().parents[2] / "scripts/research/blog-crawler.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


class Response:
    def __init__(self, status=200, text="", headers=None):
        self.status_code = status
        self.headers = {"Content-Type": "text/html; charset=utf-8", **(headers or {})}
        self.is_redirect = status in {301, 302, 303, 307, 308}
        self.encoding = "utf-8"
        self.text = text

    def iter_content(self, chunk_size):
        yield self.text.encode()

    def close(self):
        pass


def words(n=160):
    return " ".join("substantive" + str(i) for i in range(n))


class Contracts(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="tal-skills-collector-test-")
        self.root = Path(self.temp.name)
        self.archive = c.Archive(self.root, "fixture")

    def tearDown(self):
        self.archive.db.close()
        self.archive.lock_handle.close()
        self.temp.cleanup()

    def fetcher(self):
        return c.Fetcher(self.archive, timeout=1, retries=0, interval=0)

    def test_url_dedupe_retains_semantic_query_and_transport_slash(self):
        self.assertEqual(c.canonical_url("https://EXAMPLE.org/post/?utm_source=a#section"), "https://example.org/post")
        self.assertEqual(c.canonical_url("https://example.org/post?version=2"), "https://example.org/post?version=2")
        self.assertEqual(c.canonical_url("/post/", "https://example.org", source=True), "https://example.org/post/")
        self.assertIsNone(c.canonical_url("https://user:password@example.org/post"))

    def test_article_extraction_and_error_boundaries(self):
        result = c.extract_article("<title>Post</title><article><h1>Real title</h1><p>" + words() + "</p></article>")
        self.assertEqual(result["status"], "body_extracted")
        self.assertEqual(result["title"], "Real title")
        self.assertFalse(result["body_read"])
        self.assertEqual(c.extract_article("<title>Page not found</title><main><p>" + words() + "</p></main>")["status"], "nonarticle")
        self.assertEqual(c.extract_article("<main>Navigation</main>")["status"], "body_fetched_unextracted")

    def test_split_article_containers_are_joined(self):
        html = "".join('<div class="snowflake-blog-text"><p>' + words(80) + "</p></div>" for i in range(3))
        result = c.extract_article(html)
        self.assertEqual(result["word_count"], 240)
        self.assertEqual(result["method"], ".snowflake-blog-text.union")

    def test_next_payload_is_substantive_source(self):
        payload = {"props": {"pageProps": {"postData": {"content": words(400), "title": "Payload"}}}}
        html = '<script id="__NEXT_DATA__" type="application/json">' + json.dumps(payload) + "</script><main>cards</main>"
        self.assertEqual(c.extract_article(html)["method"], "next.postData.content")

    def test_blocked_pending_and_prose_error_word_classification(self):
        self.assertEqual(c.classify_response(403, "text/html", "real body", True), "blocked")
        self.assertEqual(c.classify_response(202, "text/html", "challenge", True), "pending_response")
        self.assertEqual(c.classify_response(200, "text/html", "verify you are human", True), "bot_challenge")
        self.assertEqual(c.classify_response(200, "text/html", "The DACL access denied entry", True), "fetched")

    def test_cached_robots_prevents_article_transport(self):
        f = self.fetcher()
        robots = RobotFileParser()
        robots.parse(["User-agent: *", "Disallow: /private/"])
        f.robots["example.org"] = robots
        with patch.object(c.requests, "get", side_effect=AssertionError("Forbidden article GET")):
            receipt, text, attempts = f.fetch("https://example.org/private/post")
        self.assertEqual(receipt["status"], "robots_disallowed")
        self.assertFalse(receipt["transport_attempted"])

    def test_unavailable_robots_does_not_fetch_article(self):
        calls = []
        def get(url, **kwargs):
            calls.append(url)
            return Response(403, "blocked")
        with patch.object(c.requests, "get", side_effect=get):
            receipt, _, _ = self.fetcher().fetch("https://example.org/post")
        self.assertEqual(calls, ["https://example.org/robots.txt"])
        self.assertEqual(receipt["status"], "robots_unavailable")

    def test_missing_robots_allows_and_redirect_slash_is_preserved(self):
        calls = []
        def get(url, **kwargs):
            calls.append(url)
            if url.endswith("robots.txt"):
                return Response(404)
            if url.endswith("/post"):
                return Response(301, headers={"Location": "/post/"})
            return Response(200, "<article>" + words() + "</article>")
        with patch.object(c.requests, "get", side_effect=get):
            receipt, _, _ = self.fetcher().fetch("https://example.org/post")
        self.assertEqual(calls, ["https://example.org/robots.txt", "https://example.org/post", "https://example.org/post/"])
        self.assertEqual(receipt["http_status"], 200)

    def test_redirect_target_robots_guard(self):
        f = self.fetcher()
        f.robots["example.org"] = False
        robots = RobotFileParser()
        robots.parse(["User-agent: *", "Disallow: /"])
        f.robots["blocked.org"] = robots
        with patch.object(c.requests, "get", return_value=Response(302, headers={"Location": "https://blocked.org/post/"})) as get:
            receipt, _, attempts = f.fetch("https://example.org/post")
        self.assertEqual(get.call_count, 1)
        self.assertEqual(receipt["status"], "robots_disallowed")
        self.assertEqual(len(attempts), 2)

    def test_blocked_host_circuit_defers_new_requests(self):
        f = self.fetcher()
        f.robots["example.org"] = False
        with patch.object(c.requests, "get", return_value=Response(429, "slow down")) as get:
            for i in range(3):
                f.fetch("https://example.org/post" + str(i))
            receipt, _, _ = f.fetch("https://example.org/post4")
        self.assertEqual(get.call_count, 3)
        self.assertEqual(receipt["status"], "host_blocked_deferred")

    def test_discovery_wp_body_and_next_page(self):
        url = "https://example.org/wp-json/wp/v2/posts?per_page=100&page=1"
        data = [{"link": "https://example.org/blog/post/", "title": {"rendered": "Post"}, "content": {"rendered": "<p>" + words() + "</p>"}}]
        rows, more, embedded, terminal = c.discover_document(json.dumps(data), url, "application/json", {"https://example.org/blog/"}, set(), {"X-WP-TotalPages": "2"})
        self.assertEqual(len(rows), 1)
        self.assertEqual(len(embedded), 1)
        self.assertIn("page=2", next(iter(more)))

    def test_feed_full_content_and_numeric_next_navigation(self):
        xml = '<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Post</title><link>https://example.org/blog/post</link><content:encoded><![CDATA[<p>' + words() + '</p>]]></content:encoded></item></channel></rss>'
        rows, _, embedded, _ = c.discover_document(xml, "https://example.org/feed", "application/xml", {"https://example.org/blog/"}, set())
        self.assertEqual(len(embedded), 1)
        html = '<a href="/blog/2/">Next Page →</a><a href="/blog/post/">Post</a>'
        rows, more, _, _ = c.discover_document(html, "https://example.org/blog/", "text/html", {"https://example.org/blog/"}, set())
        self.assertNotIn("https://example.org/blog/2", rows)
        self.assertIn("https://example.org/blog/2/", more)

    def test_resume_requeues_cached_frontier_and_filters_foreign_host(self):
        parent = "https://example.org/blog"
        child = "https://example.org/blog?page=2"
        event = {"continuations": [child, "https://other.org/foreign"]}
        self.archive.db.execute("INSERT INTO sources VALUES(?,?,?)", (parent, "fetched", json.dumps(event)))
        self.archive.db.commit()
        self.archive.db.close()
        self.archive.lock_handle.close()
        args = c.parser().parse_args(["--publisher", "fixture", "--archive-root", str(self.root), "--baseline-root", str(self.root),
            "--source-url", parent, "--no-default-sources", "--discover-only"])
        baseline = ({"surveyed_index_url": parent, "inventory_sha256": "a" * 64, "coverage_sha256": "b" * 64,
                     "record_count": 0, "scope": "fixture"}, [], {})
        calls = []
        def fetch(self, url, kind):
            calls.append(url)
            return {"url": url, "status": "fetched", "content_type": "text/html"}, "<div>Terminal</div>", []
        with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.Fetcher, "fetch", new=fetch), contextlib.redirect_stdout(io.StringIO()):
            c.run(args)
        self.assertEqual(calls, [child])
        self.archive = c.Archive(self.root, "fixture")

    def test_failure_preserved_when_success_replaces_current_state(self):
        url = "https://example.org/post"
        self.archive.article(url, {})
        self.archive.body_result(url, {"status": "blocked"}, {"status": "blocked", "body_read": False})
        self.archive.body_result(url, {"status": "fetched"}, {"status": "body_extracted", "body_read": False})
        events = [json.loads(line) for line in (self.archive.root / "body-events.jsonl").read_text().splitlines()]
        self.assertEqual([event["extraction"]["status"] for event in events], ["blocked", "body_extracted"])
        summary = self.archive.summary("fixture", {})
        self.assertEqual(summary["article_status_counts"], {"body_extracted": 1})
        self.assertFalse(summary["all_article_bodies_read"])
        self.assertFalse(summary["discovery_complete"])
        self.assertTrue((self.archive.root / "article-state.jsonl").exists())

    def test_body_only_run_refreshes_robots_without_article_get(self):
        url = "https://example.org/private/post"
        self.archive.db.close()
        self.archive.lock_handle.close()
        args = c.parser().parse_args(["--publisher", "fixture", "--archive-root", str(self.root), "--baseline-root", str(self.root), "--bodies-only"])
        baseline = ({"surveyed_index_url": "https://example.org/blog", "inventory_sha256": "a" * 64,
                     "coverage_sha256": "b" * 64, "record_count": 1, "scope": "fixture"}, [{"url": url}], {})
        calls = []
        def get(url, **kwargs):
            calls.append(url)
            if not url.endswith("robots.txt"):
                raise AssertionError("Disallowed article GET")
            return Response(200, "User-agent: *\nDisallow: /private/\n")
        with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.requests, "get", side_effect=get), contextlib.redirect_stdout(io.StringIO()):
            c.run(args)
        self.assertEqual(calls, ["https://example.org/robots.txt"])
        self.archive = c.Archive(self.root, "fixture")
        self.assertEqual(self.archive.summary("fixture", {})["article_status_counts"], {"robots_disallowed": 1})

    def test_immediate_attempt_survives_without_future_collection(self):
        f = self.fetcher()
        f.robots["example.org"] = False
        with patch.object(c.requests, "get", return_value=Response(200, "<article>" + words() + "</article>")):
            receipt, _, _ = f.fetch("https://example.org/post")
        rows = [json.loads(line) for line in (self.archive.root / "attempts.jsonl").read_text().splitlines()]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["sha256"], receipt["sha256"])
        self.assertTrue(rows[0]["persisted_immediately"])

    def test_atom_xhtml_body_is_serialized(self):
        xml = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Post</title><link href="https://example.org/blog/post"/><content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>' + words() + '</p></div></content></entry></feed>'
        _, _, embedded, _ = c.discover_document(xml, "https://example.org/atom", "application/xml", {"https://example.org/blog/"}, set())
        self.assertEqual(len(embedded), 1)
        self.assertIn("substantive159", embedded[0][1])
        self.assertEqual(c.extract_article("<article>" + embedded[0][1] + "</article>")["status"], "body_extracted")

    def test_collection_redirect_boundary_accepts_renamed_post(self):
        prefixes = {"https://example.org/blog/"}
        self.assertTrue(c.redirected_to_collection("https://example.org/blog/old", "https://example.org/blog/", "https://example.org/blog", prefixes))
        self.assertFalse(c.redirected_to_collection("https://example.org/blog/old", "https://example.org/blog/renamed", "https://example.org/blog", prefixes))

    def test_legacy_byte_binding_is_append_only_and_hash_verified(self):
        url = "https://example.org/blog/post"
        raw = ("<p>" + words() + "</p>").encode()
        relative, sha = self.archive.save_raw(url, raw, "embedded")
        self.archive.article(url, {})
        receipt = {"url": url, "status": "embedded_imported_body", "object_path": relative, "sha256": sha}
        self.archive.body_result(url, receipt, {"status": "body_extracted", "body_read": False})
        before = (self.archive.root / "body-events.jsonl").read_bytes()
        self.assertEqual(self.archive.repair_bindings(), 1)
        self.assertEqual((self.archive.root / "body-events.jsonl").read_bytes(), before)
        binding = json.loads((self.archive.root / "receipt-bindings.jsonl").read_text())
        self.assertEqual(binding["bytes"], len(raw))
        self.assertEqual(binding["sha256"], sha)

    def test_alternate_source_requires_exact_bytes_and_attribution(self):
        source = self.root / "published.md"
        raw = words().encode()
        source.write_bytes(raw)
        mapping = self.root / "mapping.jsonl"
        row = {"url": "https://example.org/blog/post", "source_path": str(source),
               "source_url": "https://github.com/publisher/blog/blob/commit/post.md", "sha256": c.digest(raw)}
        mapping.write_text(json.dumps(row) + "\n")
        c.import_body_records(self.archive, mapping)
        summary = self.archive.summary("fixture", {})
        self.assertEqual(summary["alternate_source_body_retrieved_urls"], 1)
        row["sha256"] = "0" * 64
        mapping.write_text(json.dumps(row) + "\n")
        with self.assertRaises(ValueError):
            c.import_body_records(self.archive, mapping)

    def test_weaker_embedded_field_cannot_replace_substantive_body(self):
        url = "https://example.org/blog/post"
        self.archive.article(url, {})
        self.archive.embedded_body(url, "<p>" + words() + "</p>", {}, "embedded_imported_body")
        self.archive.embedded_body(url, "<p>Short summary</p>", {}, "embedded_imported_body")
        self.assertEqual(self.archive.summary("fixture", {})["article_status_counts"], {"body_extracted": 1})
        events = (self.archive.root / "body-events.jsonl").read_text().splitlines()
        self.assertEqual(len(events), 1)
        self.assertIn("embedded_field_not_applied", (self.archive.root / "discovery-events.jsonl").read_text())

    def test_local_reextract_preserves_embedded_semantics_and_prior_status(self):
        embedded_url = "https://example.org/blog/embedded"
        normal_url = "https://example.org/blog/tutorial"
        for url, kind, raw in [(embedded_url, "embedded_imported_body", "<p>" + words() + "</p>"),
                               (normal_url, "bot_challenge", "<title>Error Monitoring Guide</title><article><p>access denied " + words() + "</p></article>")]:
            relative, sha = self.archive.save_raw(url, raw.encode(), "fixture")
            self.archive.article(url, {})
            receipt = {"url": url, "status": kind, "object_path": relative, "sha256": sha, "http_status": 200, "content_type": "text/html"}
            self.archive.body_result(url, receipt, {"status": "body_fetched_unextracted", "body_read": False})
        self.archive.db.close()
        self.archive.lock_handle.close()
        args = c.parser().parse_args(["--publisher", "fixture", "--archive-root", str(self.root), "--baseline-root", str(self.root), "--bodies-only", "--reextract"])
        baseline = ({"surveyed_index_url": "https://example.org/blog", "inventory_sha256": "a" * 64,
                     "coverage_sha256": "b" * 64, "record_count": 2, "scope": "fixture"}, [{"url": embedded_url}, {"url": normal_url}], {})
        with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.requests, "get", side_effect=AssertionError("Local extraction performed network GET")), contextlib.redirect_stdout(io.StringIO()):
            c.run(args)
        self.archive = c.Archive(self.root, "fixture")
        summary = self.archive.summary("fixture", {})
        self.assertEqual(summary["article_status_counts"], {"body_extracted": 2})
        self.assertEqual(summary["http_article_attempted_urls"], 0)
        receipts = {url: json.loads(receipt) for url, receipt in self.archive.db.execute("SELECT url,receipt FROM articles")}
        self.assertEqual(receipts[embedded_url]["status"], "embedded_imported_body")
        self.assertEqual(receipts[normal_url]["status"], "fetched")
        self.assertEqual(receipts[normal_url]["original_receipt"]["status"], "bot_challenge")
        self.assertNotIn("bytes", receipts[embedded_url]["original_receipt"])
        self.assertGreater(receipts[embedded_url]["bytes"], 0)

    def test_reextract_keeps_unavailable_and_mismatch_evidence_visible(self):
        missing = "https://example.org/blog/missing"
        mismatch = "https://example.org/blog/mismatch"
        good = "https://example.org/blog/good"
        raw = ("<article><p>" + words() + "</p></article>").encode()
        relative, sha = self.archive.save_raw(good, raw, "fixture")
        for url, path, expected in [(missing, "objects/fixture/missing.bin", sha), (mismatch, relative, "0" * 64), (good, relative, sha)]:
            self.archive.article(url, {})
            self.archive.body_result(url, {"url": url, "status": "fetched", "http_status": 200,
                "object_path": path, "sha256": expected, "bytes": len(raw), "content_type": "text/html"},
                {"status": "body_extracted", "body_read": False})
        self.archive.db.close()
        self.archive.lock_handle.close()
        args = c.parser().parse_args(["--publisher", "fixture", "--archive-root", str(self.root), "--baseline-root", str(self.root), "--reextract"])
        baseline = ({"surveyed_index_url": "https://example.org/blog", "inventory_sha256": "a" * 64,
                     "coverage_sha256": "b" * 64, "record_count": 3, "scope": "fixture"}, [{"url": u} for u in [missing, mismatch, good]], {})
        with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.requests, "get", side_effect=AssertionError("Local extraction fetched")), contextlib.redirect_stdout(io.StringIO()):
            c.run(args)
        self.archive = c.Archive(self.root, "fixture")
        summary = self.archive.summary("fixture", {})
        self.assertEqual(summary["article_status_counts"], {"body_extracted": 1, "evidence_integrity_failure": 1, "evidence_unavailable": 1})
        self.assertEqual(summary["body_retrieved_urls"], 1)
        self.assertEqual(summary["unresolved_article_urls"], 2)

    def test_year_archive_article_is_distinct_from_archive_collection(self):
        prefixes = {"https://www.twilio.com/en-us/blog/"}
        article = "https://www.twilio.com/en-us/blog/archive/2018/verification-webhooks"
        year = "https://www.twilio.com/en-us/blog/archive/2018"
        archive = "https://www.twilio.com/en-us/blog/archive"
        requested = "https://www.twilio.com/en-us/blog/verification-webhooks"
        self.assertTrue(c.is_article_url(article, prefixes, set()))
        self.assertFalse(c.is_article_url(year, prefixes, set()))
        self.assertFalse(c.is_article_url(archive, prefixes, set()))
        self.assertFalse(c.redirected_to_collection(requested, article, "https://www.twilio.com/en-us/blog/developers", prefixes))
        self.assertTrue(c.redirected_to_collection(requested, year, "https://www.twilio.com/en-us/blog/developers", prefixes))
        self.assertTrue(c.redirected_to_collection(requested, archive, "https://www.twilio.com/en-us/blog/developers", prefixes))
        rows, _, _, _ = c.discover_document('<a href="' + article + '">Post</a><a href="' + year + '">Year</a>',
            "https://www.twilio.com/en-us/blog/", "text/html", prefixes, set())
        self.assertIn(article, rows)
        self.assertNotIn(year, rows)

    def test_state_export_unicode_separators_roundtrip_one_lf_record(self):
        title = "Engineering\u2028archive\u2029repair"
        self.archive.article("https://example.org/blog/post", {"title": title})
        self.archive.summary("fixture", {})
        text = (self.archive.root / "article-state.jsonl").read_text()
        self.assertEqual(len(text.splitlines()), 1)
        self.assertEqual(text.count("\n"), 1)
        self.assertEqual(json.loads(text)["metadata"]["title"], title)

    def test_archive_rejects_checkout_output(self):
        with self.assertRaises(ValueError):
            c.Archive(c.REPOSITORY / "research/raw-fixture", "fixture")


if __name__ == "__main__":
    unittest.main(verbosity=2)
