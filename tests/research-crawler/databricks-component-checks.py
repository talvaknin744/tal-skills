"""Databricks ordered article component contracts, without network requests."""
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
URL = "https://www.databricks.com/blog/component-fixture"
TITLE = "Ordered article components"
FIRST = " ".join("first" + str(i) for i in range(150))
SECOND = " ".join("second" + str(i) for i in range(40))
ROOT_CLASS = "blog-detail-blog-component-fixture"


def block(text, extra=""):
    return '<div class="article--content rich-text-blog"><p>' + text + '</p>' + extra + '</div>'


def page(components=None, canonical=URL, schema=None, title=TITLE):
    if schema is None:
        schema = {"@type": "BlogPosting", "headline": title, "datePublished": "2026-10-14"}
    return '<html><head><link rel="canonical" href="' + canonical + '"><script type="application/ld+json">' + json.dumps(schema) + '</script></head><body><div class="' + ROOT_CLASS + '"><h1>' + title + '</h1><div class="body-region">' + (components if components is not None else block(FIRST) + block(SECOND)) + '</div></div></body></html>'


def recover(html, publisher="databricks", requested=URL, final=URL):
    return c.extract_publisher_article(html, publisher, requested, final)


class OrderedArticleComponents(unittest.TestCase):
    def reject_union(self, html, **kwargs):
        result = recover(html, **kwargs)
        self.assertNotEqual(result.get("method"), "databricks.article-content.union")
        self.assertEqual(result, c.extract_article(html))

    def test_split_body_recovers_exact_dom_order_and_component_hashes(self):
        result = recover(page())
        self.assertEqual(result["text"], FIRST + "\n\n" + SECOND)
        self.assertEqual(result["method"], "databricks.article-content.union")
        self.assertEqual(result["component_word_counts"], [150, 40])
        self.assertEqual(result["component_sha256"], [c.digest(FIRST.encode()), c.digest(SECOND.encode())])
        self.assertEqual(result["article_content_containers"], 2)
        self.assertFalse(result["body_read"])
        self.assertEqual(result["published_at"], "2026-10-14")

    def test_reversed_component_order_is_retained_without_length_sorting(self):
        result = recover(page(block(SECOND) + block(FIRST)))
        self.assertEqual(result["text"], SECOND + "\n\n" + FIRST)
        self.assertEqual(result["component_word_counts"], [40, 150])

    def test_short_second_component_and_code_are_retained(self):
        html = page(block(FIRST) + block("Additional source detail.", '<pre>select 1;</pre>'))
        result = recover(html)
        self.assertTrue(result["text"].endswith("Additional source detail.\nselect 1;"))
        self.assertEqual(result["method"], "databricks.article-content.union")

    def test_controls_and_unrelated_cards_outside_components_are_not_union_text(self):
        html = page(block(FIRST, '<button>Copy code</button><script>track()</script>') + '<div class="blog-card"><p>Unrelated card text</p></div>' + block(SECOND))
        result = recover(html)
        self.assertEqual(result["text"], FIRST + "\n\n" + SECOND)

    def test_current_canonical_alias_is_explicit_and_history_is_unresolved(self):
        canonical = "https://www.databricks.com/blog/current-canonical-fixture"
        result = recover(page(canonical=canonical))
        self.assertEqual(result["declared_canonical_url"], canonical)
        self.assertFalse(result["exact_requested_canonical_identity"])
        self.assertEqual(result["canonical_alias"]["historical_equivalence"], "unresolved")
        self.assertEqual(result["canonical_alias"]["requested_url"], URL)
        self.assertEqual(result["canonical_alias"]["canonical_url"], canonical)

    def test_embedded_media_is_recorded_without_claiming_media_or_source_reading(self):
        html = page(block(FIRST, '<iframe src="https://video.example/watch"></iframe><img src="diagram.png" alt="Diagram">') + block(SECOND))
        result = recover(html)
        self.assertEqual(result["text"], FIRST + "\n\n" + SECOND)
        self.assertEqual(result["embedded_media_count"], 1)
        self.assertEqual(result["embedded_media_references"][0]["src"], "https://video.example/watch")
        self.assertEqual(len(result["image_references"]), 1)
        self.assertFalse(result["media_content_reviewed"])
        self.assertFalse(result["body_read"])

    def test_generic_and_other_publisher_behavior_are_unchanged(self):
        html = page()
        self.assertEqual(c.extract_article(html)["text"], FIRST)
        self.assertEqual(recover(html, publisher="other"), c.extract_article(html))
        self.assertEqual(recover(html, publisher="vercel"), c.extract_article(html))

    def test_single_and_three_components_do_not_trigger(self):
        self.reject_union(page(block(FIRST)))
        self.reject_union(page(block(FIRST) + block(SECOND) + block("Third component")))

    def test_nested_and_duplicate_components_do_not_trigger(self):
        self.reject_union(page(block(FIRST, block(SECOND))))
        self.reject_union(page(block(FIRST) + block(FIRST)))

    def test_different_parents_and_competing_detail_regions_do_not_trigger(self):
        self.reject_union(page('<section>' + block(FIRST) + '</section><section>' + block(SECOND) + '</section>'))
        self.reject_union(page().replace('</body>', '<div class="' + ROOT_CLASS + '"></div></body>'))

    def test_unrelated_card_component_and_missing_publisher_marker_do_not_trigger(self):
        self.reject_union(page(block(FIRST) + '<div class="blog-card">' + block(SECOND) + '</div>'))
        self.reject_union(page().replace('rich-text-blog', 'generic-prose'))
        self.reject_union(page().replace(ROOT_CLASS, 'generic-blog-region'))

    def test_ambiguous_main_regions_and_external_components_do_not_trigger(self):
        self.reject_union(page().replace('<body>', '<body><main></main>'))
        self.reject_union(page().replace('<body>', '<body><main>').replace('</body>', '</main><main></main></body>'))
        self.reject_union(page(block(FIRST)).replace('</body>', block(SECOND) + '</body>'))

    def test_missing_duplicate_or_wrong_headline_schema_do_not_trigger(self):
        self.reject_union(page(schema={"@type": "BlogPosting", "headline": "Another headline"}))
        self.reject_union(page(schema={"@graph": [{"@type": "BlogPosting", "headline": TITLE}, {"@type": "Article", "headline": TITLE}]}))
        self.reject_union(page().replace('application/ld+json', 'application/json'))
        self.reject_union(page().replace('<h1>' + TITLE + '</h1>', '<h1>' + TITLE + '</h1><h1>Another headline</h1>'))

    def test_collection_schema_and_collection_canonical_do_not_trigger(self):
        self.reject_union(page(schema={"@graph": [{"@type": "BlogPosting", "headline": TITLE}, {"@type": "CollectionPage"}]}))
        self.reject_union(page(canonical="https://www.databricks.com/blog"))
        self.reject_union(page(canonical="https://www.databricks.com/blog/category"))
        self.reject_union(page(canonical="https://www.databricks.com/blog/2026"))

    def test_missing_duplicate_and_cross_host_canonical_do_not_trigger(self):
        html = page()
        self.reject_union(html.replace('<link rel="canonical" href="' + URL + '">', ''))
        self.reject_union(html.replace('</head>', '<link rel="canonical" href="' + URL + '"></head>'))
        self.reject_union(page(canonical="https://other.example/blog/current"))

    def test_request_final_mismatch_and_wrong_route_marker_do_not_trigger(self):
        self.reject_union(page(), requested="https://www.databricks.com/blog/old-fixture")
        self.reject_union(page(), final="https://www.databricks.com/blog/another-fixture")
        self.reject_union(page().replace(ROOT_CLASS, 'blog-detail-blog-another-fixture'))
        self.reject_union(page(), requested="https://other.example/blog/component-fixture", final="https://other.example/blog/component-fixture")

    def test_empty_excerpt_only_or_small_components_do_not_trigger(self):
        self.reject_union(page(block(FIRST) + block("")))
        self.reject_union(page(block("Brief description.") + block("Another brief description.")))
        self.reject_union(page(block(FIRST) + block("Read more")))

    def test_cache_reextract_preserves_prior_event_and_exact_raw_binding_without_network(self):
        with tempfile.TemporaryDirectory(prefix="tal-skills-databricks-union-") as temporary:
            root = Path(temporary)
            archive = c.Archive(root, "databricks")
            raw = page().encode()
            relative, sha = archive.save_raw(URL, raw, "article")
            archive.article(URL, {})
            receipt = {"url": URL, "final_url": URL, "http_status": 200, "status": "fetched", "content_type": "text/html", "object_path": relative, "sha256": sha, "bytes": len(raw)}
            prior = c.extract_article(raw)
            prior["text_sha256"] = c.digest(prior["text"].encode())
            archive.body_result(URL, receipt, prior)
            archive.db.close()
            archive.lock_handle.close()
            args = c.parser().parse_args(['--publisher', 'databricks', '--archive-root', str(root), '--baseline-root', str(root), '--reextract'])
            baseline = ({"surveyed_index_url": "https://www.databricks.com/blog", "inventory_sha256": "a" * 64, "coverage_sha256": "b" * 64, "record_count": 1, "scope": "fixture"}, [{"url": URL}], {})
            with patch.object(c, "load_baseline", return_value=baseline), patch.object(c.requests, "get", side_effect=AssertionError("Offline extraction attempted network")), contextlib.redirect_stdout(io.StringIO()):
                c.run(args)
            with (root/'publishers/databricks/body-events.jsonl').open() as handle:
                events = [json.loads(line) for line in handle]
            self.assertEqual(len(events), 2)
            self.assertEqual(events[0]['extraction']['text_sha256'], c.digest(FIRST.encode()))
            self.assertEqual(events[1]['extraction']['text_sha256'], c.digest((FIRST + "\n\n" + SECOND).encode()))
            self.assertEqual(events[1]['receipt']['sha256'], sha)
            self.assertFalse(events[1]['extraction']['body_read'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
