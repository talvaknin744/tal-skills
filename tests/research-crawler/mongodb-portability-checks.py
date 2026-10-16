"""Small synthetic MongoDB publication boundaries, without archived bodies or HTTP."""
import importlib.util
import json
from pathlib import Path
import socket
import unittest
from unittest.mock import patch
from bs4 import BeautifulSoup

spec = importlib.util.spec_from_file_location("portable_mongodb", Path(__file__).resolve().parents[2] / "scripts/research/blog-crawler.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
URL = "https://www.mongodb.com/company/blog/synthetic-prose-boundary"
TITLE = "合成正文提取边界"
PARAGRAPHS = [
    "这一段介绍合成文章的证据边界，并说明段落顺序与页面身份需要同时核对。",
    "页面地址、规范链接与公开元数据应保持一致，只有同一篇文章才可进入提取。",
    "正文组件按照页面中的先后顺序排列，段落之间的关系不会依据文本长短重新排序。",
    "提取后的内容只代表保存下来的文字，图片与视频仍需要独立的证据和阅读记录。",
    "遇到不完整的页面或无法确定的正文区域时，应继续保留原始材料并记录未解决的缺口。",
]
FIRST, SECOND = "保留来源与身份", "核对正文与局限"
BODY = "<p>" + PARAGRAPHS[0] + "</p><h2>" + FIRST + "</h2>" + "".join("<p>" + text + "</p>" for text in PARAGRAPHS[1:3]) + "<h2>" + SECOND + "</h2>" + "".join("<p>" + text + "</p>" for text in PARAGRAPHS[3:])
EXPECTED = "\n\n".join([PARAGRAPHS[0], FIRST, *PARAGRAPHS[1:3], SECOND, *PARAGRAPHS[3:]])


def page(body=BODY, editorial=TITLE):
    schema = {"@type": "Article", "headline": TITLE, "mainEntityOfPage": URL.replace("www.mongodb.com", "mongodb.com"), "datePublished": "2026-10-15"}
    return '<html lang="en"><head><title>' + editorial + ' | MongoDB</title><link rel="canonical" href="' + URL + '"><meta property="og:title" content="' + editorial + '"><meta name="twitter:title" content="' + editorial + '"><meta property="og:url" content="' + URL + '"><script type="application/ld+json">' + json.dumps(schema) + '</script></head><body><main><h1>' + TITLE + '</h1><article>' + body + '</article></main></body></html>'


def changed(action, html=None):
    soup = BeautifulSoup(page() if html is None else html, "html.parser")
    action(soup)
    return str(soup)


def schema_change(soup, key, value):
    script = soup.find("script", type="application/ld+json")
    data = json.loads(script.string)
    data[key] = value
    script.string = json.dumps(data)


class PortableMongoDB(unittest.TestCase):
    def setUp(self):
        for target, attribute in [(c.requests.sessions.Session, "request"), (socket, "create_connection"), (socket.socket, "connect")]:
            guard = patch.object(target, attribute, side_effect=AssertionError("Portable check attempted network"))
            guard.start()
            self.addCleanup(guard.stop)

    def recover(self, html=None, requested=URL, final=URL, publisher="mongodb"):
        return c.extract_publisher_article(page() if html is None else html, publisher, requested, final)

    def refuse(self, html=None, requested=URL, final=URL):
        html = page() if html is None else html
        self.assertIsNone(c.extract_mongodb_han_article(html, requested, final))
        self.assertEqual(self.recover(html, requested, final), c.extract_article(html))
        self.assertEqual(self.recover(html, requested, final)["status"], "body_fetched_unextracted")

    def test_ordered_han_source_is_extracted_without_reading_or_availability_credit(self):
        result = self.recover()
        self.assertEqual(result["status"], "body_extracted")
        self.assertEqual(result["text"], EXPECTED)
        self.assertFalse(result["body_read"])
        self.assertFalse(result["body_availability_gain"])
        self.assertFalse(result["new_deliberate_reading_credit"])
        self.assertEqual(result["declared_html_language"], "en")
        self.assertFalse(result["source_language_from_html_metadata"])

    def test_editorial_title_can_differ_from_schema_bound_headline(self):
        result = self.recover(page(editorial="元数据中的合成标题"))
        self.assertEqual(result["text"], EXPECTED)
        self.assertEqual(result["title"], TITLE)
        self.assertFalse(result["headline_matches_editorial_title"])

    def test_svg_accessibility_title_is_distinct_from_html_document_title(self):
        html = changed(lambda s: s.body.append(BeautifulSoup("<svg><title>Icon description</title></svg>", "html.parser").svg))
        self.assertEqual(self.recover(html)["text"], EXPECTED)

    def test_short_intro_does_not_qualify(self):
        self.refuse(page("<p>" + PARAGRAPHS[0] + "</p>"))

    def test_article_metadata_without_body_does_not_qualify(self):
        self.refuse(changed(lambda s: s.article.decompose()))

    def test_video_shell_and_embedded_video_remain_unresolved(self):
        for body in ['<iframe src="https://video.example/watch"></iframe>', BODY + '<video src="clip.mp4"></video>']:
            with self.subTest(body=body[:20]):
                self.refuse(page(body))

    def test_duplicate_and_nested_article_frames_decline(self):
        for action in [lambda s: s.main.append(BeautifulSoup("<article><p>Other source</p></article>", "html.parser").article), lambda s: s.article.append(s.new_tag("article"))]:
            with self.subTest(action=action):
                self.refuse(changed(action))

    def test_changed_requested_final_canonical_and_schema_identity_decline(self):
        self.refuse(requested=URL + "-other")
        self.refuse(final=URL + "-other")
        self.refuse(changed(lambda s: s.link.__setitem__("href", URL + "-other")))
        self.refuse(changed(lambda s: schema_change(s, "mainEntityOfPage", URL + "-other")))

    def test_denied_identities_are_not_normalized_into_eligibility(self):
        for value in [" " + URL, URL + "?locale=en", URL + "#part", URL.replace("https:", "HTTPS:"), URL.replace("www.mongodb.com", "www.mongodb.com:443"), URL.replace("/company/", "/company//"), URL.replace("www.mongodb.com", "other.example")]:
            with self.subTest(value=value):
                self.refuse(requested=value)

    def test_nonstring_requested_identity_declines_without_throwing(self):
        for value in [None, 7, [], {}]:
            with self.subTest(value=value):
                self.refuse(requested=value)

    def test_malformed_url_authorities_decline_without_throwing(self):
        invalid = "https://[not-an-ip]/company/blog/article"
        self.refuse(requested=invalid)
        self.refuse(final="https://www.mongodb.com\uff0f.example/company/blog/article")
        self.refuse(changed(lambda s: s.link.__setitem__("href", invalid)))
        self.refuse(changed(lambda s: schema_change(s, "mainEntityOfPage", invalid)))

    def test_lone_surrogate_source_declines_without_throwing(self):
        self.refuse(page().replace(PARAGRAPHS[0], PARAGRAPHS[0] + "\ud800"))

    def test_main_in_navigation_or_cookie_ancestry_declines(self):
        for attrs in [{"role": "navigation"}, {"role": "dialog"}, {"class": "cookie-dialog"}]:
            with self.subTest(attrs=attrs):
                self.refuse(changed(lambda s, a=attrs: s.main.wrap(s.new_tag("div", attrs=a))))
        self.refuse(changed(lambda s: s.main.wrap(s.new_tag("aside"))))

    def test_article_in_forbidden_semantic_ancestry_declines(self):
        self.refuse(changed(lambda s: s.article.wrap(s.new_tag("div", attrs={"role": "navigation"}))))
        self.refuse(changed(lambda s: s.article.wrap(s.new_tag("footer"))))

    def test_headline_in_navigation_declines(self):
        self.refuse(changed(lambda s: s.h1.wrap(s.new_tag("nav"))))

    def test_retained_paragraph_with_cookie_or_dialog_role_declines(self):
        for attrs in [{"role": "dialog"}, {"role": "alertdialog"}, {"class": "cookie-consent"}]:
            with self.subTest(attrs=attrs):
                self.refuse(changed(lambda s, a=attrs: s.article.p.attrs.update(a)))

    def test_duplicate_html_document_title_declines(self):
        for parent in ["head", "body"]:
            with self.subTest(parent=parent):
                self.refuse(changed(lambda s, p=parent: s.find(p).append(BeautifulSoup("<title>Conflicting document</title>", "html.parser").title)))

    def test_conflicting_or_duplicate_document_metadata_declines(self):
        self.refuse(changed(lambda s: setattr(s.title, "string", "Conflicting title | MongoDB")))
        self.refuse(changed(lambda s: s.select_one('meta[property="og:title"]').__setitem__("content", "Another title")))
        self.refuse(changed(lambda s: s.head.append(BeautifulSoup('<meta name="twitter:title" content="Another title">', "html.parser").meta)))
        self.refuse(changed(lambda s: s.select_one('meta[property="og:url"]').__setitem__("content", URL + "-other")))

    def test_collection_schema_does_not_qualify_as_article(self):
        self.refuse(changed(lambda s: s.head.append(BeautifulSoup('<script type="application/ld+json">{"@type":"CollectionPage"}</script>', "html.parser").script)))

    def test_length_without_distinct_ordered_sections_does_not_qualify(self):
        self.refuse(page("<p>" + PARAGRAPHS[0] * 100 + "</p>"))
        self.refuse(changed(lambda s: [node.decompose() for node in s.article.find_all("h2")]))
        self.refuse(page("<p>" + PARAGRAPHS[0] + "</p><h2>" + FIRST + "</h2>" + ("<p>" + PARAGRAPHS[0] + "</p>") * 2 + "<h2>" + SECOND + "</h2>" + ("<p>" + PARAGRAPHS[0] + "</p>") * 2))

    def test_other_publishers_and_generic_cutoff_remain_unchanged(self):
        html = page()
        self.assertEqual(c.extract_article(html)["status"], "body_fetched_unextracted")
        self.assertEqual(self.recover(html, publisher="other"), c.extract_article(html))
        long_html = "<article><h1>Long generic source</h1><p>" + " ".join("source" + str(i) for i in range(140)) + "</p></article>"
        self.assertEqual(self.recover(long_html), c.extract_article(long_html))
        self.assertEqual(self.recover(long_html)["status"], "body_extracted")


if __name__ == "__main__":
    unittest.main(verbosity=2)
