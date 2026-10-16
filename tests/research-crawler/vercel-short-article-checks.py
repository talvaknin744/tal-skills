"""Vercel marked short prose recovery contracts, without network requests."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("collector", Path(__file__).resolve().parents[2] / "scripts/research/blog-crawler.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
URL = "https://vercel.com/changelog/fixture-notice"
PROSE = "Teams can retain their existing deployment configuration while enabling the new cache behavior. Confirm the option in project settings and verify the next deployment before updating other projects."


def page(body=None, canonical=URL, heading="A cache configuration notice", schema=None):
    schema_html = '<script type="application/ld+json">' + json.dumps(schema) + "</script>" if schema else ""
    return '<html><head><link rel="canonical" href="' + canonical + '">' + schema_html + '</head><body><h1>' + heading + '</h1><article><div data-blog-body="true">' + (body if body is not None else '<p>' + PROSE + '</p>') + '</div></article></body></html>'


def recover(html, publisher="vercel", requested=URL, final=URL):
    if hasattr(c, "extract_publisher_article"):
        return c.extract_publisher_article(html, publisher, requested, final)
    return c.extract_article(html)


class MarkedShortProse(unittest.TestCase):
    def test_positive_short_marked_notice_has_exact_prose_and_identity(self):
        result = recover(page('<p>' + PROSE + '</p><img src="notice.png" alt="Settings illustration">'))
        self.assertEqual(result["status"], "body_extracted")
        self.assertEqual(result["text"], PROSE)
        self.assertLess(result["word_count"], 120)
        self.assertEqual(result["method"], "vercel.marked-short-prose")
        self.assertFalse(result["body_read"])
        self.assertFalse(result["media_content_reviewed"])
        self.assertEqual(result["canonical_url"], URL)
        self.assertEqual(len(result["image_references"]), 1)

    def test_recovery_retains_existing_publication_metadata(self):
        html = page().replace('</head>', '<meta property="article:published_time" content="2026-10-14T12:00:00Z"></head>')
        result = recover(html)
        self.assertEqual(result["status"], "body_extracted")
        self.assertEqual(result.get("published_at"), "2026-10-14T12:00:00Z")

    def test_marked_list_and_code_retain_substantive_content(self):
        body = '<button>Copy link to heading</button><h2>Enable the cache</h2><ul><li>' + PROSE + '</li></ul><pre>PROJECT_CACHE_ENABLED=true</pre>'
        result = recover(page(body))
        self.assertEqual(result["status"], "body_extracted")
        self.assertIn("PROJECT_CACHE_ENABLED=true", result["text"])
        self.assertIn("Enable the cache", result["text"])
        self.assertNotIn("Copy link to heading", result["text"])

    def test_related_promotional_card_is_separate_from_body(self):
        body = '<p>' + PROSE + '</p><a href="https://vercel.com/blog/other"><p>Another publication has separate release information.</p><p>Read more</p></a>'
        result = recover(page(body))
        self.assertEqual(result["status"], "body_extracted")
        self.assertEqual(result["text"], PROSE)
        self.assertEqual(len(result["removed_ancillary_cards"]), 1)

    def test_other_publishers_and_generic_cutoff_are_unchanged(self):
        self.assertEqual(c.extract_article(page())["status"], "body_fetched_unextracted")
        self.assertEqual(recover(page(), publisher="other")["status"], "body_fetched_unextracted")
        long = '<p>' + ' '.join("evidence" + str(i) for i in range(140)) + '</p>'
        result = recover(page(long))
        self.assertEqual(result["status"], "body_extracted")
        self.assertNotEqual(result["method"], "vercel.marked-short-prose")

    def test_wrong_canonical_and_changed_requested_identity_are_rejected(self):
        self.assertEqual(recover(page(canonical="https://vercel.com/changelog/other"))["status"], "body_fetched_unextracted")
        self.assertEqual(recover(page(), requested="https://vercel.com/blog/old-location")["status"], "body_fetched_unextracted")
        self.assertEqual(recover(page(), final="https://vercel.com/changelog/other")["status"], "body_fetched_unextracted")

    def test_missing_or_duplicate_canonical_is_rejected(self):
        html = page()
        self.assertEqual(recover(html.replace('<link rel="canonical" href="' + URL + '">', ''))["status"], "body_fetched_unextracted")
        self.assertEqual(recover(html.replace('</head>', '<link rel="canonical" href="' + URL + '"></head>'))["status"], "body_fetched_unextracted")

    def test_collection_schema_and_numeric_archive_routes_are_rejected(self):
        for schema in [{"@type": "CollectionPage"}, {"@graph": [{"@type": "CollectionPage"}]}]:
            with self.subTest(schema=schema):
                self.assertEqual(recover(page(schema=schema))["status"], "body_fetched_unextracted")
        collection = "https://vercel.com/changelog/page/10"
        self.assertEqual(recover(page(canonical=collection), requested=collection, final=collection)["status"], "body_fetched_unextracted")

    def test_multiple_article_or_body_markers_are_rejected(self):
        html = page()
        self.assertEqual(recover(html.replace('</body>', '<article><p>Other card</p></article></body>'))["status"], "body_fetched_unextracted")
        self.assertEqual(recover(html.replace('</article>', '<div data-blog-body="true"><p>Other body</p></div></article>'))["status"], "body_fetched_unextracted")

    def test_unmarked_or_external_body_marker_is_rejected(self):
        self.assertEqual(recover(page().replace('data-blog-body="true"', 'data-blog-body="false"'))["status"], "body_fetched_unextracted")
        html = page().replace('data-blog-body="true"', 'data-blog-body="false"').replace('</body>', '<div data-blog-body="true"><p>' + PROSE + '</p></div></body>')
        self.assertEqual(recover(html)["status"], "body_fetched_unextracted")

    def test_non_specific_or_multiple_headlines_are_rejected(self):
        self.assertEqual(recover(page(heading="Changelog"))["status"], "body_fetched_unextracted")
        self.assertEqual(recover(page().replace('</body>', '<h1>Another headline</h1></body>'))["status"], "body_fetched_unextracted")

    def test_dynamic_embeds_do_not_become_complete_prose_recovery(self):
        for tag in ['<iframe src="movie"></iframe>', '<video src="movie"></video>', '<audio src="audio"></audio>',
                    '<object data="dynamic"></object>', '<embed src="dynamic">', '<script src="dynamic"></script>', '<script>renderChart()</script>']:
            with self.subTest(tag=tag):
                self.assertEqual(recover(page('<p>' + PROSE + '</p>' + tag))["status"], "body_fetched_unextracted")

    def test_empty_image_only_and_excerpt_ambiguity_remain_unextracted(self):
        for body in ['', '<img src="diagram.png" alt="Diagram">', '<p>' + PROSE + '</p><p>Read more</p>']:
            with self.subTest(body=body):
                self.assertEqual(recover(page(body))["status"], "body_fetched_unextracted")

    def test_code_without_paragraph_or_list_corroboration_is_not_recovered(self):
        self.assertEqual(recover(page('<pre>' + PROSE + '</pre>'))["status"], "body_fetched_unextracted")

    def test_wrong_host_and_customer_relocation_require_separate_review(self):
        for url in ['https://other.example/changelog/fixture-notice', 'https://vercel.com/customers/fixture-notice']:
            with self.subTest(url=url):
                self.assertEqual(recover(page(canonical=url), requested=url, final=url)["status"], "body_fetched_unextracted")

    def test_cache_reextract_records_recovery_without_network_or_old_event_loss(self):
        with tempfile.TemporaryDirectory(prefix="tal-skills-vercel-recovery-") as temporary:
            root = Path(temporary)
            archive = c.Archive(root, "vercel")
            raw = page().encode()
            relative, sha = archive.save_raw(URL, raw, "article")
            archive.article(URL, {})
            receipt = {"url": URL, "http_status": 200, "status": "fetched", "content_type": "text/html",
                       "object_path": relative, "sha256": sha, "bytes": len(raw)}
            archive.body_result(URL, receipt, {"status": "body_fetched_unextracted", "body_read": False})
            archive.db.close()
            archive.lock_handle.close()
            args = c.parser().parse_args(['--publisher', 'vercel', '--archive-root', str(root), '--baseline-root', str(root), '--reextract'])
            baseline = ({"surveyed_index_url": "https://vercel.com/blog", "inventory_sha256": "a" * 64,
                         "coverage_sha256": "b" * 64, "record_count": 1, "scope": "fixture"}, [{"url": URL}], {})
            with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.requests, "get", side_effect=AssertionError("Offline recovery attempted network")), contextlib.redirect_stdout(io.StringIO()):
                c.run(args)
            with (root/'publishers/vercel/body-events.jsonl').open() as handle:
                events = [json.loads(line) for line in handle]
            self.assertEqual([row['extraction']['status'] for row in events], ['body_fetched_unextracted', 'body_extracted'])
            self.assertEqual(events[-1]['receipt']['sha256'], sha)
            self.assertFalse(events[-1]['extraction']['body_read'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
