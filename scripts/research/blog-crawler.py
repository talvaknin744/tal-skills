#!/usr/bin/env python3
"""Collect public article evidence externally, preserving every attempt and gap."""
import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import threading
import time
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

REPOSITORY = Path(__file__).resolve().parents[2]
HISTORICAL = "docs/research/engineering-toolkit/2026-10-01"
USER_AGENT = "tal-skills-research/1.0 (+https://github.com/talvaknin744/tal-skills)"
SUCCESS = {"body_extracted", "body_fetched_unextracted"}
TRACKING = {"fbclid", "gclid", "ref", "source", "ref_src"}


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical_url(raw, base=None, source=False):
    if not isinstance(raw, str):
        return None
    raw = urljoin(base or "", raw.strip())
    try:
        p = urlsplit(raw)
        if p.scheme not in {"http", "https"} or not p.hostname or p.username or p.password:
            return None
        query = p.query if source else urlencode(sorted((k, v) for k, v in parse_qsl(p.query)
            if not k.lower().startswith("utm_") and k.lower() not in TRACKING))
        host = p.hostname.lower()
        port = p.port
        if port and not (p.scheme == "https" and port == 443 or p.scheme == "http" and port == 80):
            host += ":" + str(port)
        return urlunsplit((p.scheme.lower(), host, (re.sub(r"/+", "/", p.path) if source else re.sub(r"/+", "/", p.path).rstrip("/")) or "/", query, ""))
    except (ValueError, UnicodeError):
        return None


def classify_response(status, content_type, text, article=False):
    if status == 202:
        return "pending_response"
    if status in {401, 403, 407, 429, 451}:
        return "blocked"
    if status in {404, 410}:
        return "not_found"
    if status is None or status >= 500 or status >= 400:
        return "failed"
    lower = text[:30000].lower()
    challenge = ("cf-chl-", "checking your browser", "just a moment...", "verify you are human",
                 "enable javascript and cookies to continue", "captcha challenge")
    if any(token in lower for token in challenge):
        return "bot_challenge"
    if article and not any(t in content_type.lower() for t in ("html", "text/plain", "json")):
        return "unsupported_media"
    return "fetched"


def extract_article(html):
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else None
    if title and re.fullmatch(r"(?:404|page not found|not found|access denied|error(?: [45]\d{2})?)(?:\s*[|:]\s*[^|]*)?", title, re.I):
        return {"title": title, "text": "", "word_count": 0, "method": None,
                "status": "nonarticle", "body_read": False, "extraction_limit": "Error page title"}
    h1 = soup.find("h1")
    if h1:
        title = h1.get_text(" ", strip=True)
    published = None
    for tag in soup.find_all("meta"):
        if tag.get("property") in {"article:published_time", "og:published_time"}:
            published = tag.get("content")
    article_body = None
    next_data = soup.find("script", id="__NEXT_DATA__")
    if next_data:
        try:
            next_post = json.loads(next_data.string or next_data.get_text()).get("props", {}).get("pageProps", {}).get("postData", {})
            markdown = next_post.get("content")
            if isinstance(markdown, str) and len(markdown.split()) >= 120:
                return {"title": next_post.get("title") or title, "published_at": next_post.get("publishedAt") or published,
                        "text": markdown, "word_count": len(markdown.split()), "method": "next.postData.content",
                        "status": "body_extracted", "body_read": False,
                        "extraction_limit": "Published content payload extracted as source Markdown; rendered media not independently inspected."}
        except (ValueError, AttributeError, TypeError):
            pass
    article_schema = False
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            payload = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            continue
        nodes = payload if isinstance(payload, list) else [payload]
        for node in list(nodes):
            if isinstance(node, dict):
                nodes.extend(node.get("@graph", []))
        for node in nodes:
            if not isinstance(node, dict):
                continue
            types = node.get("@type", [])
            types = types if isinstance(types, list) else [types]
            if any(t in {"Article", "BlogPosting", "NewsArticle", "TechArticle"} for t in types):
                article_schema = True
                title = node.get("headline") or title
                published = node.get("datePublished") or published
                if isinstance(node.get("articleBody"), str):
                    article_body = node["articleBody"]
    for tag in soup.select("script,style,noscript,nav,footer,header,aside,form,button,svg"):
        tag.decompose()
    selectors = ["[itemprop='articleBody']", "article", ".entry-content", ".post-content", ".article-content",
                 ".blog-content", ".blog-post-content", ".article--content", ".snowflake-blog-text",
                 ".blog-post-body_content-wrapper", ".text-rich-text.w-richtext",
                 ".single-post__content .html-content", ".single-post__content", ".dr-article-content__content", ".ts-single-post.ts-wysiwyg", ".blog-prose",
                 "[class*='--blogContent--']", "[class*='--legacyContent--']", ".content .body", ".prose", "main"]
    candidates = []
    for selector in [".snowflake-blog-text", "article.article_rich-text-2"]:
        nodes = soup.select(selector)
        if len(nodes) > 1:
            candidates.append((selector + ".union", "\n\n".join(node.get_text("\n", strip=True) for node in nodes), True))
    if article_body:
        candidates.append(("jsonld.articleBody", article_body, True))
    for selector in selectors:
        for node in soup.select(selector):
            text = node.get_text("\n", strip=True)
            paragraphs = len(node.find_all(["p", "pre", "h2", "h3", "li"]))
            cards = len(node.select("article, .blog-card, .post-card"))
            credible = selector != "main" or (article_schema or paragraphs >= 5 and cards <= 1)
            candidates.append((selector, text, credible))
    candidates.sort(key=lambda entry: (entry[0] != "main", len(entry[1])), reverse=True)
    for method, text, credible in candidates:
        words = len(text.split())
        if credible and words >= 120:
            return {"title": title, "published_at": published, "text": text, "word_count": words,
                    "method": method, "status": "body_extracted", "body_read": False,
                    "extraction_limit": "Automatic extraction can include ancillary prose and omit client rendered content."}
    return {"title": title, "published_at": published, "text": "", "word_count": 0,
            "method": None, "status": "body_fetched_unextracted", "body_read": False,
            "extraction_limit": "No substantive article container passed the extraction threshold."}



def extract_vercel_short_article(html, requested_url, final_url):
    requested = canonical_url(requested_url)
    final = canonical_url(final_url)
    if not requested or requested != final:
        return None
    parts = urlsplit(final)
    if parts.scheme != "https" or parts.netloc != "vercel.com" or not parts.path.startswith(("/blog/", "/changelog/")):
        return None
    if archive_collection_path(parts.path) or re.search(r"/(?:page|category|categories|topic|topics|tag|tags)(?:/|$)", parts.path):
        return None
    soup = BeautifulSoup(html, "html.parser")
    canonical_links = soup.select('link[rel~="canonical"]')
    if len(canonical_links) != 1 or canonical_url(canonical_links[0].get("href")) != final:
        return None
    headlines = soup.find_all("h1")
    if len(headlines) != 1:
        return None
    title = headlines[0].get_text(" ", strip=True)
    if not title or title.lower() in {"blog", "changelog", "customers", "news", "updates"}:
        return None
    def schema_nodes(node):
        if isinstance(node, list):
            for child in node:
                yield from schema_nodes(child)
        elif isinstance(node, dict):
            yield node
            yield from schema_nodes(node.get("@graph", []))
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            payload = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            continue
        for node in schema_nodes(payload):
            types = node.get("@type", [])
            types = types if isinstance(types, list) else [types]
            if any(kind in {"CollectionPage", "ItemList", "VideoObject", "AudioObject"} for kind in types):
                return None
    articles = soup.find_all("article")
    if len(articles) != 1:
        return None
    article = articles[0]
    markers = soup.select('[data-blog-body="true"]')
    if len(markers) != 1 or article not in markers[0].parents:
        return None
    body = markers[0]
    if article.select("iframe,video,audio,object,embed,script[src]"):
        return None
    if any(script.get("type", "").lower() not in {"application/ld+json", "application/json"} for script in article.find_all("script")):
        return None
    images = [{"src": image.get("src"), "alt": image.get("alt")} for image in article.find_all("img")]
    for node in article.select("script,style,nav,header,footer,aside,form,button,svg,noscript"):
        node.decompose()
    removed = []
    for link in body.select("a[href]"):
        paragraphs = link.find_all("p")
        if len(paragraphs) >= 2 and paragraphs[-1].get_text(" ", strip=True).lower() == "read more" and canonical_url(link.get("href"), final) != final:
            removed.append({"href": link.get("href"), "text": link.get_text(" ", strip=True)})
            link.decompose()
    text = body.get_text("\n", strip=True)
    text = re.sub(r"(?m)^Copy link to heading\s*\n?", "", text).strip()
    words = len(text.split())
    if not text or words >= 120 or re.search(r"\bread more\s*$", text, re.I):
        return None
    if not any(node.get_text(" ", strip=True) for node in body.find_all(["p", "li"])):
        return None
    if text.lower() in {"loading", "loading...", "coming soon", "learn more"}:
        return None
    return {"title": title, "text": text, "word_count": words, "method": "vercel.marked-short-prose",
            "status": "body_extracted", "body_read": False, "canonical_url": final,
            "requested_identity": requested, "final_identity": final,
            "article_element_count": 1, "publisher_body_marker_count": 1,
            "image_references": images, "media_content_reviewed": False, "embedded_media_count": 0,
            "removed_ancillary_cards": removed,
            "extraction_limit": "Exact publication identity and publisher marked prose recovered; image content was not independently inspected, and extraction is not source reading."}


def extract_databricks_components(html, requested_url, final_url):
    requested = canonical_url(requested_url)
    final = canonical_url(final_url)
    if not requested or requested != final:
        return None
    def article_route(url):
        parts = urlsplit(url)
        return (parts.scheme == "https" and parts.netloc == "www.databricks.com"
                and re.fullmatch(r"/blog/[^/]+", parts.path) is not None
                and not re.fullmatch(r"(?:[0-9]+|archive|archives|category|categories|tag|tags|topic|topics|author|authors|page|search|feed)", parts.path.rsplit("/", 1)[-1], re.I))
    if not article_route(final):
        return None
    soup = BeautifulSoup(html, "html.parser")
    canonical_links = soup.select('link[rel~="canonical"]')
    if len(canonical_links) != 1:
        return None
    canonical = canonical_url(canonical_links[0].get("href"))
    if not canonical or not article_route(canonical):
        return None
    headlines = soup.find_all("h1")
    if len(headlines) != 1:
        return None
    title = headlines[0].get_text(" ", strip=True)
    if not title or title.lower() in {"blog", "news", "articles", "resources"}:
        return None
    def schema_nodes(node):
        if isinstance(node, list):
            for child in node:
                yield from schema_nodes(child)
        elif isinstance(node, dict):
            yield node
            yield from schema_nodes(node.get("@graph", []))
    article_schemas = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            payload = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            return None
        for node in schema_nodes(payload):
            types = node.get("@type", [])
            types = types if isinstance(types, list) else [types]
            if any(kind in {"CollectionPage", "ItemList"} for kind in types):
                return None
            if any(kind in {"Article", "BlogPosting", "NewsArticle", "TechArticle"} for kind in types):
                article_schemas.append(node)
    if len(article_schemas) != 1 or article_schemas[0].get("@type") != "BlogPosting" or article_schemas[0].get("headline") != title:
        return None
    route_class = "blog-detail-" + urlsplit(final).path.strip("/").replace("/", "-")
    regions = soup.find_all(class_=lambda value: value and route_class in value.split())
    if len(regions) != 1:
        return None
    region = regions[0]
    if not any(parent is region for parent in headlines[0].parents):
        return None
    mains = soup.find_all("main")
    if len(mains) > 1 or mains and region is not mains[0] and not any(parent is mains[0] for parent in region.parents):
        return None
    nodes = soup.select(".article--content")
    if len(nodes) != 2 or nodes[0].parent is not nodes[1].parent:
        return None
    forbidden = "article,.blog-card,.post-card,.related-posts,.related-content,[data-component='blog-card']"
    for node in nodes:
        if "rich-text-blog" not in node.get("class", []) or not any(parent is region for parent in node.parents):
            return None
        if node.select(forbidden) or any(parent.name in {"a", "nav", "aside", "footer", "header"}
                or any(kind in parent.get("class", []) for kind in {"blog-card", "post-card", "related-posts", "related-content"})
                for parent in node.parents if parent is not region):
            return None
        if not any(tag.get_text(" ", strip=True) for tag in node.find_all(["p", "li"])):
            return None
    images = [{"src": image.get("src"), "alt": image.get("alt")} for node in nodes for image in node.find_all("img")]
    media = [{"tag": tag.name, "src": tag.get("src"), "data": tag.get("data")}
             for node in nodes for tag in node.select("iframe,video,audio,object,embed")]
    for tag in soup.select("script,style,noscript,nav,footer,header,aside,form,button,svg"):
        tag.decompose()
    components = [node.get_text("\n", strip=True) for node in nodes]
    if any(not text or text.lower() in {"read more", "loading", "loading...", "coming soon"} for text in components) or len(set(components)) != len(components):
        return None
    text = "\n\n".join(components)
    if len(text.split()) < 120:
        return None
    return {"title": title, "text": text, "word_count": len(text.split()),
            "method": "databricks.article-content.union", "status": "body_extracted", "body_read": False,
            "requested_identity": requested, "final_identity": final, "declared_canonical_url": canonical,
            "exact_requested_canonical_identity": requested == canonical,
            "canonical_alias": {"requested_url": requested, "canonical_url": canonical,
                                "historical_equivalence": "unresolved"} if requested != canonical else None,
            "article_content_containers": len(nodes), "component_word_counts": [len(part.split()) for part in components],
            "component_sha256": [digest(part.encode()) for part in components], "image_references": images,
            "embedded_media_references": media, "embedded_media_count": len(media), "media_content_reviewed": False,
            "extraction_limit": "Two sibling publisher article components recovered in source order; current canonical aliases are explicit, historical equivalence is unresolved, and media and source reading remain unverified."}


"""Narrow cached Meta prose prototype, with explicit current identity limits."""
import copy
import hashlib
import json
import re
from urllib.parse import urlsplit
from bs4 import BeautifulSoup


def _meta_sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _meta_words(text):
    return re.sub(r'[\W_]+', ' ', text.casefold()).strip()


def _meta_identity(url):
    if not isinstance(url, str) or url.strip() != url:
        return None
    try:
        p = urlsplit(url)
        invalid_authority = p.username or p.password or p.port
    except ValueError:
        return None
    if p.scheme != 'https' or p.query or p.fragment or invalid_authority:
        return None
    if p.netloc != p.hostname or '//' in p.path or re.search(r'%2f|%5c', p.path, re.I):
        return None
    return p.hostname, p.path.rstrip('/')


def _meta_route(requested, final, canonical):
    req, end, can = map(_meta_identity, (requested, final, canonical))
    if not all((req, end, can)):
        return None
    rh, rp = req; fh, fp = end; ch, cp = can
    alias = None
    excluded_slugs = {'blog', 'news', 'research', 'category', 'categories', 'tags', 'tag', 'author', 'authors', 'page', 'archive', 'archives', 'feed', 'search'}
    if fh == 'ai.meta.com' and rh in {'ai.meta.com', 'ai.facebook.com'}:
        if ch != fh or rp != fp or cp != fp or not re.fullmatch(r'/blog/[^/]+', fp):
            return None
        family = 'AI'
    elif fh == 'research.facebook.com' and rh in {'research.facebook.com', 'research.fb.com'}:
        if ch != fh or rp != fp:
            return None
        fm = re.fullmatch(r'/blog/([0-9]{4})/([0-9]{1,2})/([^/]+)', fp)
        cm = re.fullmatch(r'/blog/([0-9]{4})/([0-9]{1,2})/([^/]+)', cp)
        if not fm or not cm or not 1 <= int(fm[2]) <= 12 or (fm[1], int(fm[2]), fm[3]) != (cm[1], int(cm[2]), cm[3]):
            return None
        if fp != cp:
            alias = {'kind': 'declared_calendar_padding', 'requested_url': requested, 'final_url': final,
                     'canonical_url': canonical, 'historical_equivalence': 'unresolved'}
        family = 'research'
    elif fh == 'tech.facebook.com' and rh in {'tech.facebook.com', 'tech.fb.com'}:
        if ch != fh or cp != fp:
            return None
        fm = re.fullmatch(r'/engineering/([0-9]{4})/([0-9]{1,2})/([^/]+)', fp)
        if not fm or not 1 <= int(fm[2]) <= 12:
            return None
        if rp != fp:
            if not re.fullmatch(r'/[^/]+', rp) or rp[1:] != fm[3]:
                return None
            alias = {'kind': 'retained_current_dated_route', 'requested_url': requested, 'final_url': final,
                     'canonical_url': canonical, 'historical_equivalence': 'unresolved'}
        family = 'tech'
    else:
        return None
    slug = fp.rsplit('/', 1)[-1]
    if slug.casefold() in excluded_slugs or slug.isdigit():
        return None
    return {'family': family, 'requested': req, 'final': end, 'canonical': can,
            'identity_alias': alias, 'publisher_host_migration': rh != fh,
            'requested_final_same_path': rp == fp, 'final_canonical_same_path': fp == cp}


def _meta_single_meta(soup, name):
    nodes = [n for n in soup.find_all('meta') if n.get('name') == name or n.get('property') == name]
    return nodes[0].get('content') if len(nodes) == 1 else None


def _meta_in(node, region):
    return node is region or any(p is region for p in node.parents)


def _meta_valid_nodes(nodes, region):
    forbidden_classes = {'blog-card', 'post-card', 'related-posts', 'related-content', 'cookie-banner', 'cookie-consent', 'cookie-dialog'}
    forbidden_roles = {'navigation', 'dialog', 'banner', 'contentinfo'}
    for n in nodes:
        if not _meta_in(n, region) or any(n is not m and _meta_in(n, m) for m in nodes):
            return False
        for p in [n, *list(n.parents)]:
            if p.name in {'a', 'nav', 'aside', 'footer', 'header', 'form'} or p.get('role') in forbidden_roles or forbidden_classes.intersection(p.get('class', [])):
                return False
        if n.select('nav,aside,footer,form,[role="navigation"],[role="dialog"],.blog-card,.post-card,.related-posts,.related-content,.cookie-banner,.cookie-consent,.cookie-dialog'):
            return False
        if len([p for p in n.find_all('p') if p.get_text(' ', strip=True)]) < 3:
            return False
    return True


def extract_meta_article(html, requested_url, final_url):
    soup = BeautifulSoup(html, 'html.parser')
    canonicals = soup.select('link[rel~="canonical"]')
    if len(canonicals) != 1:
        return None
    canonical = canonicals[0].get('href')
    route = _meta_route(requested_url, final_url, canonical)
    document_titles = soup.find_all('title')
    if not route or len(document_titles) != 1:
        return None
    document_title = document_titles[0].get_text(' ', strip=True)
    if not document_title or re.match(r'(?:404|page not found|access denied|error|challenge|just a moment)\b', document_title, re.I):
        return None
    metadata_url = _meta_single_meta(soup, 'og:url')
    if _meta_identity(metadata_url) != _meta_identity(final_url):
        return None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            return None
        pending = data if isinstance(data, list) else [data]
        for node in pending:
            if isinstance(node, dict):
                pending.extend(node.get('@graph', []))
                types = node.get('@type', [])
                if isinstance(types, str):
                    types = [types]
                elif not isinstance(types, list) or any(not isinstance(value, str) for value in types):
                    return None
                if any(t in {'CollectionPage', 'ItemList'} for t in types):
                    return None
    if len(soup.find_all('main')) > 1:
        return None
    selected = []; excluded = []; removed_cards = []; selector = None
    title = None; headline_node = None; region = None; allnodes = []; indices = []
    if route['family'] == 'AI':
        regions = soup.select('div._8xs5')
        if len(regions) != 1:
            return None
        region = regions[0]
        title_metadata = _meta_single_meta(soup, 'title')
        if not title_metadata or _meta_words(title_metadata) != _meta_words(document_title):
            return None
        legacy = soup.select('div._8zna'); code = soup.select('div._amgj')
        if legacy and code:
            return None
        headlines = soup.find_all('h1')
        if legacy:
            contexts = soup.select('div._8znh')
            if len(legacy) != 1 or len(contexts) != 1 or len(headlines) != 1:
                return None
            headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
            if not _meta_in(headline_node, contexts[0]) or not _meta_in(legacy[0], contexts[0]) or not {'_8zn9', '_99tb'}.issubset(legacy[0].parent.get('class', [])):
                return None
            if _meta_words(title) != _meta_words(title_metadata) and _meta_words(title) != _meta_words(route['final'][1].rsplit('/', 1)[-1]):
                return None
            selector = 'div._8zna'; allnodes = legacy; indices = [0]
        elif code:
            if len(code) != 1 or len(headlines) != 1 or not _meta_in(code[0], region):
                return None
            headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
            if not _meta_in(headline_node, region) or _meta_words(title) != _meta_words(title_metadata):
                return None
            allnodes = code[0].find_all('div', recursive=False)
            if len(allnodes) != 5 or any(not {'_9bhp', '_9bhq', '_9bg-'}.issubset(n.get('class', [])) for n in allnodes[:2]):
                return None
            if allnodes[2].get_text(' ', strip=True) or allnodes[3].get_text(' ', strip=True) != 'Share:' or '_9bhs' not in allnodes[4].get('class', []) or not allnodes[4].select('div._amh_') or 'Subscribe' not in allnodes[4].get_text(' ', strip=True):
                return None
            if len(allnodes[4].get_text(' ', strip=True).split()) > 50 or allnodes[4].find(['h1', 'h2', 'h3']):
                return None
            if not allnodes[0].find('h2') or allnodes[0].find('h2').get_text(' ', strip=True) != 'Takeaways':
                return None
            selector = 'div._amgj > div'; indices = [0, 1]
            excluded = [(2, 'empty_structural_spacer'), (3, 'share_control'), (4, 'newsletter_signup')]
        else:
            allnodes = soup.select('div._a5x4')
            if headlines or len(allnodes) not in {3, 8} or len({id(n.parent) for n in allnodes}) != 1 or '_7h8s' not in allnodes[0].parent.get('class', []):
                return None
            if any(not _meta_in(n, region) for n in allnodes):
                return None
            hero = allnodes[0]
            if len(allnodes) == 3:
                hero_headlines = hero.find_all('h2')
                if len(hero_headlines) != 1 or not re.search(r'[A-Z][a-z]+ [0-9]{1,2}, [0-9]{4}.*min read', hero.get_text(' ', strip=True)):
                    return None
                headline_node = hero_headlines[0]
                tail = allnodes[2]
                if tail.find('p') or 'Watch the film' not in tail.get_text(' ', strip=True) or len(tail.find_all('h2')) != 1:
                    return None
                indices = [1]; excluded = [(0, 'hero_title_and_date'), (2, 'separate_film_CTA')]
            else:
                hero_headlines = hero.select('p._am_4')
                if len(hero_headlines) != 1 or len(hero.find_all('p')) != 2 or not re.search(r'[A-Z][a-z]+ [0-9]{1,2}, [0-9]{4}.*min read', hero.get_text(' ', strip=True)):
                    return None
                headline_node = hero_headlines[0]
                tail = allnodes[7]
                if tail.find(['p', 'h1', 'h2', 'h3']) or not tail.get_text(' ', strip=True).startswith('Written by:'):
                    return None
                indices = list(range(1, 7)); excluded = [(0, 'hero_title_and_date'), (7, 'author_credit')]
            title = headline_node.get_text(' ', strip=True)
            if _meta_words(title) != _meta_words(title_metadata) or _meta_words(_meta_single_meta(soup, 'og:title') or '') != _meta_words(title_metadata):
                return None
            selector = 'div._a5x4'
    elif route['family'] == 'research':
        regions = soup.select('div.mc-research-blog'); allnodes = soup.select('div._9so9._9vv4')
        if len(regions) != 1 or len(allnodes) != 3 or len({id(n.parent) for n in allnodes}) != 1 or not {'_9ye5', '_9vu-', '_9s5f'}.issubset(allnodes[0].parent.get('class', [])):
            return None
        region = regions[0]; headlines = allnodes[0].select('h1._9v6_')
        if len(headlines) != 1 or any(not _meta_in(n, region) for n in allnodes):
            return None
        headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
        if len([h for h in soup.find_all('h1') if h.get_text(' ', strip=True) not in {'', 'Research'}]) != 1 or not _meta_words(document_title).startswith(_meta_words(title)) or _meta_single_meta(soup, 'og:title') != document_title:
            return None
        if allnodes[2].find('p') or not allnodes[2].select('div._9v8g') or not allnodes[2].get_text(' ', strip=True).startswith('Areas') or 'Copy URL' not in allnodes[2].get_text(' ', strip=True):
            return None
        selector = 'div._9so9._9vv4'; indices = [1]; excluded = [(0, 'publication_date_headline_and_author'), (2, 'areas_and_share_controls')]
    else:
        regions = soup.select('div._a6r4'); allnodes = soup.select('div._a78m')
        if len(regions) != 1 or len(allnodes) != 1 or not {'_acex', '_ainz'}.issubset(allnodes[0].get('class', [])) or '_a78k' not in allnodes[0].parent.get('class', []):
            return None
        region = regions[0]
        layout = soup.select('div._techLayout__root')
        if len(layout) != 1 or not _meta_in(region, layout[0]) or not {'_a5t8', '_a5wp'}.issubset(region.parent.get('class', [])):
            return None
        headlines = region.select('h1._a7y_')
        if len(headlines) != 1 or len([h for h in soup.find_all('h1') if h.get_text(' ', strip=True) not in {'', 'Tech at Meta'}]) != 1:
            return None
        headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
        if _meta_single_meta(soup, 'og:title') != title or not document_title.startswith(title):
            return None
        selector = 'div._a78m'; indices = [0]
    if not title or len(title.split()) < 3 or title.casefold() in {'meta ai', 'meta research', 'tech at meta', 'research', 'blog'}:
        return None
    selected = [allnodes[i] for i in indices]
    if not _meta_valid_nodes(selected, region):
        return None
    if len({n.get_text('\n', strip=True) for n in selected}) != len(selected):
        return None
    source_fragments = [_meta_sha(str(n).encode()) for n in selected]
    images = [{'src': n.get('src'), 'alt': n.get('alt')} for node in selected for n in node.find_all('img')]
    media = [{'tag': n.name, 'src': n.get('src'), 'data_src': n.get('data-src'), 'data': n.get('data')} for node in selected for n in node.select('iframe,video,audio,object,embed')]
    omitted = [{'source_component_index': i, 'reason': reason, 'text_sha256': _meta_sha(allnodes[i].get_text('\n', strip=True).encode()), 'word_count': len(allnodes[i].get_text('\n', strip=True).split()), 'fragment_sha256': _meta_sha(str(allnodes[i]).encode()), 'embedded_media_count': len(allnodes[i].select('iframe,video,audio,object,embed'))} for i, reason in excluded]
    components = []; retained_controls = []; removed_controls = []
    for n in selected:
        clone = BeautifulSoup(str(n), 'html.parser').find(n.name)
        cards = clone.select('section._a787')
        if cards and route['family'] != 'tech':
            return None
        for card in cards:
            labels = card.select('span._a6x-'); lists = card.select('ul._a6x_'); links = card.select('ul._a6x_ > li._a6yu > a._a6yv[href]')
            if len(labels) != 1 or labels[0].get_text(' ', strip=True) != 'Recommended Reading' or len(lists) != 1 or not links or len(card.find_all('a')) != len(links):
                return None
            hrefs = [link.get('href') for link in links]
            if any(not _meta_identity(href) or _meta_identity(href)[0] != 'tech.facebook.com' or _meta_identity(href) == _meta_identity(final_url) for href in hrefs):
                return None
            removed_cards.append({'selector': 'section._a787', 'reason': 'separate_recommended_article_cards', 'text_sha256': _meta_sha(card.get_text('\n', strip=True).encode()), 'fragment_sha256': _meta_sha(str(card).encode()), 'hrefs': hrefs})
            card.decompose()
        for button in clone.find_all('button'):
            label = button.get_text(' ', strip=True)
            if button.get('data-testid') == 'drawer-tab' and '_a6iy' in button.get('class', []):
                try:
                    state = json.loads(button.get('data-ms', ''))
                except (ValueError, TypeError):
                    return None
                if not isinstance(state, dict):
                    return None
                targets = clone.find_all(id=button.get('aria-controls')) if button.get('aria-controls') else []
                if len(targets) != 1 or targets[0].parent is not button.parent or targets[0].get('data-testid') != 'drawer-section' or '_a6iz' not in targets[0].get('class', []) or not targets[0].find('li') or state.get('creative') != 'accordion' or state.get('creative_detail') != label:
                    return None
                labels = button.select('p._a5cy')
                if len(labels) != 1 or labels[0].get_text(' ', strip=True) != label or not label:
                    return None
                retained_controls.append({'kind': 'article_accordion_section_label', 'text': label, 'text_sha256': _meta_sha(label.encode()), 'controlled_source_section_id': button.get('aria-controls'), 'interaction_verified': False})
                button.replace_with(labels[0].extract())
            else:
                removed_controls.append({'tag': 'button', 'text_sha256': _meta_sha(button.get_text('\n', strip=True).encode()), 'reason': 'control_outside_validated_article_accordion'})
                button.decompose()
        for tag in clone.select('script,style,noscript,nav,footer,header,aside,form,svg'):
            tag.decompose()
        components.append(clone.get_text('\n', strip=True))
    text = '\n\n'.join(components)
    if any(not t for t in components) or len(text.split()) < 120:
        return None
    return {'title': title, 'document_title': document_title, 'headline_node_name': headline_node.name,
            'headline_h1_absent': not bool(soup.find('h1')), 'text': text, 'word_count': len(text.split()),
            'method': 'meta.' + route['family'].lower() + '.bounded-publisher-prose', 'status': 'body_extracted', 'body_read': False,
            'requested_identity': requested_url, 'final_identity': final_url, 'declared_canonical_url': canonical,
            'requested_final_same_path': route['requested_final_same_path'], 'final_canonical_same_path': route['final_canonical_same_path'],
            'publisher_host_migration': route['publisher_host_migration'], 'canonical_alias': route['identity_alias'],
            'publisher_body_selector': selector, 'publisher_body_selector_count': len(allnodes),
            'selected_source_order_indices': indices, 'article_content_containers': len(selected),
            'component_sha256': [_meta_sha(t.encode()) for t in components], 'component_word_counts': [len(t.split()) for t in components],
            'source_component_fragment_sha256': source_fragments, 'excluded_components': omitted, 'removed_ancillary_sections': removed_cards,
            'retained_article_control_labels': retained_controls, 'removed_control_elements': removed_controls,
            'image_references': images, 'embedded_media_references': media, 'embedded_media_count': len(media), 'media_content_reviewed': False,
            'body_availability_gain': False, 'new_deliberate_reading_credit': False,
            'extraction_limit': 'Current cached publisher prose selected using a bounded page shape, article identity and source order. Declared aliases remain unresolved historical equivalence. Media, publication history, future templates and source reading are unverified.'}


import hashlib
import json
from urllib.parse import urlsplit
from bs4 import BeautifulSoup


def extract_mongodb_han_article(html, requested_url, final_url):
    """Narrow guarded draft for cached MongoDB Article shapes, without new availability credit."""
    def publication_identity(raw, schema=False):
        if not isinstance(raw, str) or not raw.startswith("https://"):
            return None
        # Decline malformed identities rather than normalizing them into eligibility.
        if any(char.isspace() or ord(char) < 32 or ord(char) == 127 for char in raw) or "\\" in raw:
            return None
        try:
            raw.encode("utf-8", "strict")
            parts = urlsplit(raw)
        except (ValueError, UnicodeError):
            return None
        hosts = {"www.mongodb.com", "mongodb.com"} if schema else {"www.mongodb.com"}
        if parts.scheme != "https" or parts.netloc not in hosts or parts.query or parts.fragment:
            return None
        if "//" in parts.path or "%" in parts.path or any(part in {".", ".."} for part in parts.path.split("/")):
            return None
        path = parts.path[:-1] if parts.path.endswith("/") else parts.path
        if not path.startswith("/company/blog/") or any(part in {"category", "categories", "tag", "tags", "author", "authors", "archive", "page", "feed"} for part in path.split("/")):
            return None
        return path

    expected = publication_identity(requested_url)
    if not expected or expected != publication_identity(final_url):
        return None
    if not isinstance(html, str):
        return None
    try:
        html.encode("utf-8", "strict")
    except UnicodeError:
        return None
    soup = BeautifulSoup(html, "html.parser")
    canonical = soup.select('link[rel~="canonical"]')
    if len(canonical) != 1 or publication_identity(canonical[0].get("href")) != expected:
        return None
    mains = soup.find_all("main")
    articles = soup.find_all("article")
    headings = soup.find_all("h1")
    if len(mains) != 1 or len(articles) != 1 or len(headings) != 1:
        return None
    main, article, headline = mains[0], articles[0], headings[0]
    if main not in article.parents or main not in headline.parents:
        return None
    descendants = list(main.descendants)
    if descendants.index(headline) >= descendants.index(article):
        return None
    forbidden_tags = {"nav", "aside", "footer", "header", "form", "dialog"}
    forbidden_roles = {"navigation", "dialog", "alertdialog", "banner", "complementary", "contentinfo", "form", "search", "menu", "menubar", "toolbar", "tablist"}
    forbidden_classes = {"blog-card", "post-card", "related-posts", "related-content", "cookie-banner", "cookie-consent", "cookie-dialog"}
    def forbidden_region(node):
        if not getattr(node, "attrs", None):
            return node.name in forbidden_tags
        roles = str(node.get("role", "")).casefold().split()
        classes = node.get("class", [])
        if isinstance(classes, str):
            classes = classes.split()
        return (node.name in forbidden_tags or bool(forbidden_roles.intersection(roles))
                or bool(forbidden_classes.intersection(value.casefold() for value in classes)))
    # Check the complete ancestry, including outside main, plus retained descendants.
    for selected in (main, article, headline):
        if any(forbidden_region(node) for node in [selected, *selected.parents]):
            return None
    if any(forbidden_region(node) for node in article.find_all(True) + headline.find_all(True)):
        return None
    heads = soup.find_all("head")
    # SVG accessibility titles are not document identity titles.
    document_titles = [node for node in soup.find_all("title")
                       if not any(parent.name in {"svg", "math"} for parent in node.parents)]
    if len(heads) != 1 or len(document_titles) != 1 or heads[0] not in document_titles[0].parents:
        return None
    document_title = document_titles[0].get_text(" ", strip=True)
    if not document_title or not document_title.endswith(" | MongoDB"):
        return None
    def single_metadata(name):
        nodes = [node for node in soup.find_all("meta") if node.get("property") == name or node.get("name") == name]
        return nodes[0].get("content") if len(nodes) == 1 and heads[0] in nodes[0].parents else None
    editorial_title = document_title[:-len(" | MongoDB")]
    if not editorial_title or single_metadata("og:title") != editorial_title or single_metadata("twitter:title") != editorial_title:
        return None
    if publication_identity(single_metadata("og:url")) != expected:
        return None
    title = headline.get_text(" ", strip=True)
    if not title:
        return None
    schemas = []
    def walk_schema(node):
        if isinstance(node, list):
            for child in node:
                yield from walk_schema(child)
        elif isinstance(node, dict):
            yield node
            yield from walk_schema(node.get("@graph", []))
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            payload = json.loads(script.get_text())
        except (ValueError, TypeError):
            return None
        for node in walk_schema(payload):
            kind = node.get("@type")
            kinds = kind if isinstance(kind, list) else [kind]
            if any(isinstance(x, str) and x in {"CollectionPage", "ItemList", "VideoObject", "AudioObject"} for x in kinds):
                return None
            if kind == "Article":
                schemas.append(node)
    if len(schemas) != 1 or schemas[0].get("headline") != title:
        return None
    schema_identity = schemas[0].get("mainEntityOfPage")
    if publication_identity(schema_identity, schema=True) != expected:
        return None
    if article.select("article,nav,header,footer,aside,form,iframe,video,audio,object,embed,script,.blog-card,.post-card,.related-posts,.related-content,[data-component='blog-card']"):
        return None
    components = []
    removed_css = []
    direct_nodes = article.find_all(recursive=False)
    for index, node in enumerate(direct_nodes):
        if node.name == "style":
            removed_css.append(index)
            continue
        if node.name not in {"p", "h2", "h3", "h4", "ul", "ol", "div"}:
            return None
        if node.name == "div":
            # Only observed publisher media captions and one inline next-step callout.
            classes = node.get("class", [])
            caption = "media-container" in classes and len(node.find_all("figure")) == 1 and len(node.find_all("figcaption")) == 1
            callout = "block" in classes and len(node.find_all("h6")) == 1 and len(node.find_all("p")) == 1
            if not caption and not callout:
                return None
        fragment = str(node)
        copied = BeautifulSoup(fragment, "html.parser")
        for omitted in copied.select("style,svg,button,noscript"):
            omitted.decompose()
        text = copied.get_text("\n", strip=True)
        if not text:
            return None
        components.append({"source_index": index, "tag": node.name,
                           "text": text, "text_sha256": hashlib.sha256(text.encode()).hexdigest(),
                           "fragment_sha256": hashlib.sha256(fragment.encode()).hexdigest(),
                           "kind": "ordered_prose" if node.name != "div" else "caption_or_inline_callout"})
    def han_count(text):
        return sum("\u3400" <= char <= "\u9fff" for char in text)
    # Length is only supporting evidence. Require distinct ordered prose and multiple sections.
    prose = [part for part in components if part["tag"] == "p" and han_count(part["text"]) >= 20]
    h2s = [part for part in components if part["tag"] == "h2"]
    if len(prose) < 5 or len({part["text_sha256"] for part in prose}) != len(prose) or len(h2s) < 2:
        return None
    if len({part["text"] for part in h2s}) != len(h2s):
        return None
    first_h2 = h2s[0]["source_index"]
    if not any(part["source_index"] < first_h2 for part in prose):
        return None
    section_counts = []
    for index, section in enumerate(h2s):
        end = h2s[index + 1]["source_index"] if index + 1 < len(h2s) else len(direct_nodes)
        section_counts.append(sum(section["source_index"] < part["source_index"] < end for part in prose))
    if any(count < 2 for count in section_counts):
        return None
    text = "\n\n".join(part["text"] for part in components)
    letter_count = sum(char.isalpha() for char in text)
    if not letter_count or han_count(text) / letter_count < 0.6 or any("\u3040" <= char <= "\u30ff" for char in text):
        return None
    images = [{"src": image.get("src"), "alt": image.get("alt")} for image in article.find_all("img")]
    return {"title": title, "published_at": schemas[0].get("datePublished"), "text": text,
            "text_sha256": hashlib.sha256(text.encode()).hexdigest(), "word_count": len(text.split()),
            "han_characters": han_count(text), "method": "mongodb.bound-ordered-han-prose",
            "status": "body_extracted", "body_read": False,
            "requested_identity": requested_url, "final_identity": final_url,
            "canonical_url": canonical[0].get("href"), "schema_page_identity": schema_identity,
            "document_title": document_title, "editorial_metadata_title": editorial_title,
            "headline_matches_editorial_title": title == editorial_title,
            "declared_html_language": soup.html.get("lang") if soup.html else None,
            "observed_source_language": "Chinese Han-script prose, qualified by the reviewed cached fixtures",
            "source_language_from_html_metadata": False, "components": components,
            "section_prose_paragraph_counts": section_counts, "removed_direct_CSS_indices": removed_css,
            "image_references": images, "media_content_reviewed": False,
            "body_availability_gain": False, "new_deliberate_reading_credit": False,
            "extraction_limit": "Narrow cached MongoDB Article prose extraction. Source language remains Chinese despite English HTML metadata. Media, historical byte equivalence, future templates and deliberate reading remain unverified."}


def extract_publisher_article(html, publisher_id, requested_url, final_url):
    result = extract_article(html)
    if publisher_id == "mongodb" and result["status"] == "body_fetched_unextracted":
        recovered = extract_mongodb_han_article(html, requested_url, final_url)
        if recovered:
            return {**result, **recovered}
    if publisher_id == "meta" and result["status"] == "body_fetched_unextracted":
        recovered = extract_meta_article(html, requested_url, final_url)
        if recovered:
            return {**result, **recovered}
    if publisher_id == "databricks" and result["status"] in SUCCESS:
        recovered = extract_databricks_components(html, requested_url, final_url)
        if recovered:
            return {**result, **recovered}
    if publisher_id == "vercel" and result["status"] == "body_fetched_unextracted":
        recovered = extract_vercel_short_article(html, requested_url, final_url)
        if recovered:
            return {**result, **recovered}
    return result


def archive_collection_path(path, flags=0):
    if not re.search(r"/(?:archive|archives)(?:/|$)", path, flags):
        return False
    return not re.search(r"/(?:archive|archives)/[0-9]{4}/[^/]+(?:/|$)", path, flags)


def redirected_to_collection(requested, final, index, prefixes):
    requested = canonical_url(requested)
    final = canonical_url(final)
    if not requested or not final or requested == final:
        return False
    p = urlsplit(final)
    index_url = canonical_url(index)
    if final == index_url or p.path in {"/", "/blog", "/engineering", "/news", "/products", "/product"}:
        return True
    if archive_collection_path(p.path) or re.search(r"/(?:category|categories|tag|tags|author|authors|topic|topics|series)(?:/|$)", p.path):
        return True
    return any(final == canonical_url(prefix) for prefix in prefixes)


def load_baseline(publisher, baseline_root):
    manifest = json.loads((REPOSITORY / "research/engineering-toolkit/2026-10-01/archive-manifest.json").read_text())
    row = next((p for p in manifest["publishers"] if p["publisher_id"] == publisher), None)
    if not row:
        raise ValueError("Unknown surveyed publisher: " + publisher)
    path = Path(baseline_root) / HISTORICAL / row["inventory_path"]
    raw = path.read_bytes()
    if digest(raw) != row["inventory_sha256"]:
        raise ValueError("Baseline inventory digest mismatch: " + publisher)
    data = json.loads(raw)
    if row["inventory_format"] == "array":
        entries = data
    elif row["inventory_format"] == "publisher_entries":
        entries = next(p["entries"] for p in data["publishers"] if p["publisher_id"] == publisher)
    else:
        entries = [p for p in data[row["inventory_format"]] if p.get("publisher_id", publisher) == publisher]
    if len(entries) != row["record_count"]:
        raise ValueError("Baseline record count mismatch")
    coverage_path = Path(baseline_root) / HISTORICAL / row["coverage_path"]
    coverage_raw = coverage_path.read_bytes()
    if digest(coverage_raw) != row["coverage_sha256"]:
        raise ValueError("Baseline coverage digest mismatch")
    coverage = json.loads(coverage_raw)
    if "publishers" in coverage:
        coverage = next(p for p in coverage["publishers"] if p["publisher_id"] == publisher)
    return row, entries, coverage


def source_urls(coverage):
    urls = set()
    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key in {"url", "requested_url", "endpoint", "index_url", "archive_url", "surveyed_index_url"} and isinstance(value, str):
                    u = canonical_url(value, source=True)
                    if u:
                        urls.add(u)
                elif isinstance(value, (list, dict)):
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                if isinstance(item, str) and item.startswith("http"):
                    u = canonical_url(item, source=True)
                    if u:
                        urls.add(u)
                else:
                    walk(item)
    walk(coverage)
    return urls


class Archive:
    def __init__(self, root, publisher):
        root = Path(root).resolve()
        if root == REPOSITORY or REPOSITORY in root.parents:
            raise ValueError("Raw crawl output must be outside the repository")
        self.root = root / "publishers" / publisher
        self.root.mkdir(parents=True, exist_ok=True)
        self.log_lock = threading.Lock()
        self.lock_handle = (self.root / "collector.lock").open("a+")
        import fcntl
        try:
            fcntl.flock(self.lock_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ValueError("Another collector owns this publisher") from exc
        self.db = sqlite3.connect(self.root / "state.sqlite")
        self.db.execute("CREATE TABLE IF NOT EXISTS articles (url TEXT PRIMARY KEY, metadata TEXT, status TEXT DEFAULT 'pending', receipt TEXT)")
        self.db.execute("CREATE TABLE IF NOT EXISTS sources (url TEXT PRIMARY KEY, status TEXT, receipt TEXT)")
        self.db.execute("CREATE TABLE IF NOT EXISTS article_requests (url TEXT PRIMARY KEY)")
        if self.db.execute("SELECT count(*) FROM article_requests").fetchone()[0] == 0 and (self.root / "attempts.jsonl").exists():
            for line in (self.root / "attempts.jsonl").read_text().splitlines():
                attempt = json.loads(line)
                if attempt.get("kind") == "article" and attempt.get("transport_attempted") is not False and (attempt.get("http_status") is not None or "error" in attempt):
                    self.db.execute("INSERT OR IGNORE INTO article_requests VALUES(?)", (canonical_url(attempt.get("requested_url") or attempt.get("url")),))
        self.db.commit()

    def article(self, url, metadata):
        self.db.execute("INSERT OR IGNORE INTO articles(url,metadata) VALUES(?,?)", (url, json.dumps(metadata)))
        self.db.commit()

    def append(self, file, row):
        with self.log_lock:
            with (self.root / file).open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    def persist_attempt(self, attempt):
        if not attempt.get("persisted_immediately"):
            attempt["persisted_immediately"] = True
            self.append("attempts.jsonl", attempt)

    def record_attempts(self, attempts):
        for attempt in attempts:
            self.persist_attempt(attempt)
            if attempt.get("kind") == "article" and attempt.get("transport_attempted") is not False and (attempt.get("http_status") is not None or "error" in attempt):
                self.db.execute("INSERT OR IGNORE INTO article_requests VALUES(?)", (canonical_url(attempt.get("requested_url") or attempt.get("url")),))
        self.db.commit()

    def body_result(self, url, receipt, extraction):
        self.db.execute("UPDATE articles SET status=?,receipt=? WHERE url=?", (extraction["status"], json.dumps(receipt), url))
        self.db.commit()
        self.append("body-events.jsonl", {"url": url, "receipt": receipt, "extraction": extraction})

    def embedded_body(self, url, html, source_receipt, kind):
        if not html.strip():
            return
        extraction = extract_article("<article>" + html + "</article>")
        extraction["text_sha256"] = digest(extraction["text"].encode())
        relative, sha = self.save_raw(url, html.encode(), "embedded")
        receipt = {"url": url, "fetched_at": now(), "status": kind, "object_path": relative,
                   "sha256": sha, "bytes": len(html.encode()), "source_receipt": source_receipt}
        old = self.db.execute("SELECT status FROM articles WHERE url=?", (url,)).fetchone()
        if old and (old[0] == "excluded_nonarticle" or old[0] == "body_extracted" and extraction["status"] != "body_extracted"):
            self.append("discovery-events.jsonl", {"url": url, "status": "embedded_field_not_applied", "receipt": receipt,
                "reason": "Existing scope exclusion or substantive extraction retained over a weaker embedded field."})
            return
        self.body_result(url, receipt, extraction)

    def repair_bindings(self):
        bindings = set()
        file = self.root / "receipt-bindings.jsonl"
        if file.exists():
            bindings = {(row["object_path"], row["sha256"]) for row in map(json.loads, file.read_text().splitlines())}
        def walk(node):
            if isinstance(node, dict):
                relative, sha = node.get("object_path"), node.get("sha256")
                if relative and sha and node.get("bytes") is None and (relative, sha) not in bindings:
                    path = (self.root / relative).resolve()
                    if self.root.resolve() not in path.parents:
                        raise ValueError("Unsafe legacy response path")
                    data = path.read_bytes()
                    if digest(data) != sha:
                        raise ValueError("Legacy response hash mismatch")
                    self.append("receipt-bindings.jsonl", {"record_type": "receipt_byte_binding",
                        "object_path": relative, "sha256": sha, "bytes": len(data), "verified_at": now(),
                        "correction": "Legacy receipt omitted byte count; exact existing object bytes verified without altering original receipt."})
                    bindings.add((relative, sha))
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for item in node:
                    walk(item)
        for filename in ["attempts.jsonl", "body-events.jsonl", "discovery-events.jsonl", "runs.jsonl"]:
            path = self.root / filename
            if path.exists():
                with path.open() as handle:
                    for line in handle:
                        walk(json.loads(line))
        return len(bindings)

    def save_raw(self, url, data, kind):
        sha = digest(data)
        relative = Path("objects") / kind / sha[:2] / (sha + ".bin")
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_bytes(data)
        return relative.as_posix(), sha

    def summary(self, publisher, config):
        statuses = dict(self.db.execute("SELECT status,count(*) FROM articles GROUP BY status"))
        source_statuses = dict(self.db.execute("SELECT status,count(*) FROM sources GROUP BY status"))
        total = sum(statuses.values())
        excluded = statuses.get("excluded_nonarticle", 0)
        scoped = total - excluded
        unresolved = scoped - sum(statuses.get(s, 0) for s in SUCCESS)
        for table, filename in [("articles", "article-state.jsonl"), ("sources", "source-state.jsonl")]:
            temp_state = self.root / (filename + ".tmp")
            with temp_state.open("w", encoding="utf-8") as handle:
                for item in self.db.execute("SELECT * FROM " + table + " ORDER BY url"):
                    keys = ["url", "metadata", "status", "receipt"] if table == "articles" else ["url", "status", "receipt"]
                    record = dict(zip(keys, item))
                    for key in ["metadata", "receipt"]:
                        if record.get(key):
                            record[key] = json.loads(record[key])
                    handle.write(json.dumps(record, ensure_ascii=False).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029") + "\n")
            temp_state.replace(self.root / filename)
        embedded = 0
        alternate = 0
        for raw_receipt, status in self.db.execute("SELECT receipt,status FROM articles WHERE receipt IS NOT NULL"):
            receipt = json.loads(raw_receipt)
            if status in SUCCESS and receipt.get("status") in {"embedded_api_body", "embedded_imported_body"}:
                embedded += 1
            if status in SUCCESS and receipt.get("status") == "alternate_published_source":
                alternate += 1
        http_attempted = self.db.execute("SELECT count(*) FROM article_requests").fetchone()[0]
        result = {"schema_version": 1, "publisher_id": publisher, "updated_at": now(),
                  "known_article_urls": total, "article_status_counts": statuses,
                  "processed_urls": total - statuses.get("pending", 0),
                  "http_article_attempted_urls": http_attempted,
                  "body_retrieved_urls": sum(statuses.get(s, 0) for s in SUCCESS),
                  "embedded_body_retrieved_urls": embedded, "alternate_source_body_retrieved_urls": alternate,
                  "receipt_bindings_sha256": digest((self.root / "receipt-bindings.jsonl").read_bytes()) if (self.root / "receipt-bindings.jsonl").exists() else None,
                  "source_status_counts": source_statuses, "all_known_urls_attempted": statuses.get("pending", 0) == 0,
                  "all_known_bodies_fetched": unresolved == 0 and excluded == 0,
                  "all_scoped_article_bodies_fetched": unresolved == 0, "all_article_bodies_read": False,
                  "article_read_count": 0, "unresolved_article_urls": unresolved,
                  "excluded_nonarticle_count": statuses.get("excluded_nonarticle", 0),
                  "scoped_article_urls": total - statuses.get("excluded_nonarticle", 0),
                  "discovery_complete": False,
                  "discovery_boundary": "Generic declared links are traversed. Publisher specific hidden cursors, missing pagination, historical omissions and failures require independent review.",
                  "config": config, "limits": ["Automatic body extraction is separate from human or agent reading.",
                  "An exhausted queue only establishes the discovered URL frontier, not publisher lifetime completeness.",
                  "Deleted, private and unlisted articles remain unknown."]}
        temp = self.root / "summary.json.tmp"
        temp.write_text(json.dumps(result, indent=2) + "\n")
        temp.replace(self.root / "summary.json")
        return result


class Fetcher:
    def __init__(self, archive, timeout=30, retries=2, per_host=3, interval=0.35, max_bytes=25000000):
        self.archive, self.timeout, self.retries = archive, timeout, retries
        self.per_host, self.interval, self.max_bytes = per_host, interval, max_bytes
        self.lock = threading.Lock()
        self.hosts = {}
        self.robots = {}
        self.robot_locks = {}
        self.host_delays = {}
        self.block_counts = {}
        self.circuit = {}

    def ensure_robots(self, url):
        host = urlsplit(url).netloc
        with self.lock:
            lock = self.robot_locks.setdefault(host, threading.Lock())
        with lock:
            if host in self.robots:
                return []
            robots_url = urlunsplit((urlsplit(url).scheme, host, "/robots.txt", "", ""))
            receipt, text, attempts = self.fetch(robots_url, "robots")
            if receipt["status"] == "fetched":
                rp = RobotFileParser(robots_url)
                rp.parse(text.splitlines())
                self.robots[host] = rp
                delay = rp.crawl_delay(USER_AGENT) or rp.crawl_delay("*")
                if delay:
                    self.host_delays[host] = max(self.interval, delay)
            elif receipt.get("http_status") in {404, 410}:
                self.robots[host] = False
            else:
                self.robots[host] = None
            return attempts

    def policy_status(self, url):
        host = urlsplit(url).netloc
        if host in self.circuit:
            return "host_blocked_deferred"
        robots = self.robots.get(host)
        if host in self.robots and robots is None:
            return "robots_unavailable"
        if robots and not robots.can_fetch(USER_AGENT, url):
            return "robots_disallowed"
        return None

    def fetch(self, url, kind="article"):
        attempts = []
        for retry in range(self.retries + 1):
            current = url
            response = None
            error = None
            for hop in range(11):
                host = urlsplit(current).netloc
                if kind != "robots" and urlsplit(current).path != "/robots.txt":
                    attempts.extend(self.ensure_robots(current))
                    denied = self.policy_status(current)
                    if denied:
                        receipt = {"requested_url": url, "url": current, "fetched_at": now(),
                                   "status": denied, "kind": kind, "attempt": retry + 1,
                                   "redirect_hop": hop, "transport_attempted": False}
                        attempts.append(receipt)
                        self.archive.persist_attempt(receipt)
                        return receipt, "", attempts
                with self.lock:
                    semaphore, next_start = self.hosts.setdefault(host, (threading.Semaphore(self.per_host), 0))
                with semaphore:
                    with self.lock:
                        semaphore, next_start = self.hosts[host]
                        delay = max(0, next_start - time.monotonic())
                        self.hosts[host] = (semaphore, time.monotonic() + delay + self.host_delays.get(host, self.interval))
                    if delay:
                        time.sleep(delay)
                    started = now()
                    tick = time.monotonic()
                    raw = b""
                    try:
                        response = requests.get(current, headers={"User-Agent": USER_AGENT,
                            "Accept": "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.7",
                            "Accept-Language": "en-US,en;q=0.9"}, timeout=(min(10, self.timeout), self.timeout),
                            allow_redirects=False, stream=True)
                        for chunk in response.iter_content(65536):
                            raw += chunk
                            if len(raw) > self.max_bytes:
                                raise ValueError("Response exceeds explicit byte safety limit")
                        content_type = response.headers.get("Content-Type", "")
                        encoding = response.encoding or "utf-8"
                        if encoding.lower() == "iso-8859-1" and b'charset="utf-8"' in raw[:5000].lower():
                            encoding = "utf-8"
                        text = raw.decode(encoding, errors="replace")
                        relative, sha = self.archive.save_raw(current, raw, kind)
                        status = classify_response(response.status_code, content_type, text, kind == "article")
                        receipt = {"requested_url": url, "url": current, "fetched_at": started,
                                   "http_status": response.status_code, "content_type": content_type,
                                   "bytes": len(raw), "sha256": sha, "object_path": relative,
                                   "seconds": round(time.monotonic() - tick, 3), "kind": kind,
                                   "attempt": retry + 1, "redirect_hop": hop, "status": status,
                                   "headers": {key: value for key, value in response.headers.items()
                                               if key.lower() in {"location", "link", "retry-after", "x-wp-totalpages", "x-wp-total", "etag", "last-modified"}}}
                        attempts.append(receipt)
                        self.archive.persist_attempt(receipt)
                        if kind != "robots" and status in {"blocked", "bot_challenge", "pending_response"}:
                            with self.lock:
                                self.block_counts[host] = self.block_counts.get(host, 0) + 1
                                if self.block_counts[host] >= 3:
                                    self.circuit[host] = {"status": status, "http_status": response.status_code}
                        elif kind != "robots" and status == "fetched":
                            with self.lock:
                                self.block_counts[host] = 0
                        if response.is_redirect and response.headers.get("Location"):
                            current = canonical_url(response.headers["Location"], current, source=True)
                            if not current:
                                raise ValueError("Unsafe redirect URL")
                            continue
                        if response.status_code in {429, 500, 502, 503, 504} and retry < self.retries:
                            delay = min(30, max(1, int(response.headers.get("Retry-After", "0")))) if response.headers.get("Retry-After", "0").isdigit() else 2 ** retry
                            time.sleep(delay)
                            break
                        return receipt, text, attempts
                    except (requests.RequestException, ValueError, LookupError) as exc:
                        error = str(exc)
                        attempts.append({"requested_url": url, "url": current, "fetched_at": started,
                                         "http_status": getattr(response, "status_code", None),
                                         "status": "failed", "error": error, "kind": kind,
                                         "attempt": retry + 1, "redirect_hop": hop,
                                         "seconds": round(time.monotonic() - tick, 3)})
                        self.archive.persist_attempt(attempts[-1])
                        break
                    finally:
                        if response is not None:
                            response.close()
            else:
                error = "Redirect limit reached"
            if retry < self.retries:
                time.sleep(2 ** retry)
        receipt = attempts[-1] if attempts else {"requested_url": url, "status": "failed", "error": error}
        if receipt.get("http_status") in range(300, 400):
            receipt = dict(receipt, status="failed", error="Redirect limit reached")
            attempts.append(receipt)
            self.archive.persist_attempt(receipt)
        return receipt, "", attempts


def inferred_prefixes(index, entries):
    prefixes = {index.rstrip("/") + "/"}
    grouped = {}
    for row in entries:
        url = canonical_url(row.get("url") or row.get("canonical_url"))
        if not url:
            continue
        p = urlsplit(url)
        segments = p.path.strip("/").split("/")
        grouped.setdefault(p.netloc, []).append(segments)
    for host, paths in grouped.items():
        counts = {}
        for path in paths:
            if len(path) > 1:
                counts[path[0]] = counts.get(path[0], 0) + 1
        for first, count in counts.items():
            if count >= max(2, len(paths) // 10):
                prefixes.add("https://" + host + "/" + first + "/")
        if host.startswith(("blog.", "engineering.")) or host in {"shopify.engineering", "slack.engineering", "netflixtechblog.com", "dropbox.tech"}:
            prefixes.add("https://" + host + "/")
    return prefixes


def is_article_url(url, prefixes, known=None):
    if known and url in known:
        return True
    if not url:
        return False
    p = urlsplit(url)
    if re.search(r"\.(?:xml|json|css|js|png|jpe?g|gif|webp|svg|ico|pdf|mp4|zip|gz)$", p.path, re.I):
        return False
    if archive_collection_path(p.path, re.I) or re.search(r"/(?:category|categories|tag|tags|author|authors|page|topic|topics|series|search|feed)(?:/|$)", p.path, re.I):
        return False
    if re.search(r"/(?:blog|latest)/\d+$", p.path):
        return False
    if any(k in {"page", "p", "offset"} or k.endswith("_page") or re.match(r"page\d+$", k) for k, v in parse_qsl(p.query)):
        return False
    return any(url.startswith(prefix) and len(urlsplit(url).path.rstrip("/")) > len(urlsplit(prefix).path.rstrip("/")) for prefix in prefixes)


def discover_document(text, url, content_type, prefixes, known, headers=None):
    articles, sources, embedded = {}, set(), []
    terminal = "No declared continuation found, independent pagination review remains required"
    headers = {k.lower(): v for k, v in (headers or {}).items()}
    if urlsplit(url).path == "/robots.txt":
        sources.update(canonical_url(value, source=True) for value in re.findall(r"^sitemap:\s*(\S+)", text, re.M | re.I))
        return articles, sources - {None}, embedded, "Robots sitemap declarations parsed"
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        root = None
    if root is not None:
        local = root.tag.split("}")[-1]
        if local == "sitemapindex":
            for node in root.iter():
                if node.tag.split("}")[-1] == "loc" and node.text:
                    sources.add(canonical_url(node.text, url, source=True))
            terminal = "Finite sitemap index parsed, all declared child sitemaps queued"
        elif local == "urlset":
            for node in root.iter():
                if node.tag.split("}")[-1] == "loc" and node.text:
                    article = canonical_url(node.text, url)
                    if is_article_url(article, prefixes, known):
                        articles[article] = {"discovery_source": url, "kind": "sitemap"}
            terminal = "Finite sitemap urlset parsed"
        elif local in {"rss", "feed"}:
            for entry in root.iter():
                if entry.tag.split("}")[-1] not in {"item", "entry"}:
                    continue
                title, article = None, None
                for node in entry:
                    key = node.tag.split("}")[-1]
                    if key == "title":
                        title = node.text
                    elif key == "link" and node.get("rel", "alternate") == "alternate":
                        article = canonical_url(node.get("href") or node.text, url)
                if is_article_url(article, prefixes, known):
                    articles[article] = {"title": title, "discovery_source": url, "kind": "feed"}
                    for child in entry:
                        key = child.tag.split("}")[-1]
                        if key in {"encoded", "content"}:
                            body = "".join(ET.tostring(node, encoding="unicode") for node in child) if len(child) else child.text
                            if isinstance(body, str) and body.strip():
                                embedded.append((article, body))
            for node in root.iter():
                if node.tag.split("}")[-1] == "link" and node.get("rel") == "next":
                    sources.add(canonical_url(node.get("href"), url, source=True))
            terminal = "Feed parsed, retained next links; finite recent feed does not establish historical completeness"
        return articles, sources - {None}, embedded, terminal
    try:
        data = json.loads(text)
    except ValueError:
        data = None
    if data is not None:
        def walk(node):
            if isinstance(node, dict):
                raw_url = node.get("link") or node.get("url") or node.get("canonical_url")
                article = canonical_url(raw_url, url) if isinstance(raw_url, str) else None
                if is_article_url(article, prefixes, known):
                    title = node.get("title")
                    title = title.get("rendered") if isinstance(title, dict) else title
                    articles[article] = {"title": title, "discovery_source": url, "kind": "json"}
                    content = node.get("content")
                    if isinstance(content, dict) and isinstance(content.get("rendered"), str):
                        embedded.append((article, content["rendered"]))
                    elif isinstance(node.get("html"), str):
                        embedded.append((article, node["html"]))
                for key, value in node.items():
                    if key in {"next", "next_url", "nextPage", "nextLink"} and isinstance(value, str) and value.startswith(("http", "/")):
                        sources.add(canonical_url(value, url, source=True))
                    elif isinstance(value, (dict, list)):
                        walk(value)
            elif isinstance(node, list):
                for child in node:
                    walk(child)
        walk(data)
        total = headers.get("x-wp-totalpages")
        if total and total.isdigit():
            p = urlsplit(url)
            query = dict(parse_qsl(p.query))
            current = int(query.get("page", "1"))
            if current < int(total):
                query["page"] = str(current + 1)
                sources.add(canonical_url(urlunsplit((p.scheme, p.netloc, p.path, urlencode(query), "")), source=True))
            terminal = "WordPress declared total page count retained and next page queued"
        return articles, sources - {None}, embedded, terminal
    soup = BeautifulSoup(text, "html.parser")
    for link in soup.find_all(["a", "link"], href=True):
        raw = link["href"]
        candidate = canonical_url(raw, url)
        if is_article_url(candidate, prefixes, known):
            articles[candidate] = {"title": link.get_text(" ", strip=True) or None, "discovery_source": url, "kind": "html"}
        rel = link.get("rel", [])
        label = link.get_text(" ", strip=True).lower()
        if "next" in rel or re.match(r"^(?:next(?: page)?|older(?: posts)?|load more)\b", label) or "next" in link.get("aria-label", "").lower():
            sources.add(canonical_url(raw, url, source=True))
        elif link.name == "link" and "alternate" in rel and any(t in link.get("type", "") for t in ("rss", "atom")):
            sources.add(canonical_url(raw, url, source=True))
        elif "sitemap" in raw and raw.endswith((".xml", ".xml.gz")):
            sources.add(canonical_url(raw, url, source=True))
    return articles, sources - {None}, embedded, terminal


def run(args):
    row, entries, coverage = load_baseline(args.publisher, args.baseline_root)
    archive = Archive(args.archive_root, args.publisher)
    fetcher = Fetcher(archive, args.timeout, args.retries, args.concurrency, args.interval)
    index = row["surveyed_index_url"]
    prefixes = set(args.include_prefix) or inferred_prefixes(index, entries)
    config = {"publisher_id": args.publisher, "baseline_inventory_sha256": row["inventory_sha256"],
              "baseline_coverage_sha256": row["coverage_sha256"], "baseline_record_count": row["record_count"],
              "scope": row["scope"], "fresh_discovery_include_prefixes": sorted(prefixes),
              "timeout_seconds": args.timeout, "retries": args.retries,
              "per_host_concurrency": args.concurrency, "per_host_request_interval_seconds": args.interval,
              "source_url_overrides": args.source_url, "no_article_count_cap": True,
              "excluded_nonarticle_patterns": args.exclude_pattern, "no_default_sources": args.no_default_sources}
    collector_path, collector_sha = archive.save_raw("collector", Path(__file__).read_bytes(), "collector")
    archive.append("runs.jsonl", {"started_at": now(), "config": config,
        "collector_sha256": collector_sha, "collector_object_path": collector_path})
    for entry in entries:
        url = canonical_url(entry.get("url") or entry.get("canonical_url"))
        if url:
            archive.article(url, {"kind": "historical_verified_inventory", "metadata": entry,
                                  "source_sha256": row["inventory_sha256"]})
    for file in args.import_bodies:
        import_body_records(archive, file)
    for file in args.urls_file:
        for raw in Path(file).read_text().splitlines():
            url = canonical_url(raw)
            if url:
                archive.article(url, {"kind": "externally_discovered_url", "urls_file_sha256": digest(Path(file).read_bytes())})
    known = {u for u, in archive.db.execute("SELECT url FROM articles")}
    for item in args.import_source:
        if "=" not in item:
            raise ValueError("Import source expects URL=external-file-path")
        source, file = item.rsplit("=", 1)
        raw = Path(file).read_bytes()
        relative, sha = archive.save_raw(source, raw, "imported-source")
        receipt = {"url": source, "fetched_at": now(), "status": "imported_source", "sha256": sha,
                   "object_path": relative, "bytes": len(raw), "transport_receipt": "Supplied externally, inspect original collector receipt separately"}
        rows, more, embedded, terminal = discover_document(raw.decode("utf-8", errors="replace"), source, "application/json", prefixes, known)
        for article, metadata in rows.items():
            archive.article(article, metadata)
            known.add(article)
        for article, html in embedded:
            archive.embedded_body(article, html, receipt, "embedded_imported_body")
        archive.append("discovery-events.jsonl", {"url": source, "receipt": receipt, "discovered_articles": len(rows),
            "continuations": sorted(more), "terminal_observation": terminal})
    index_parts = urlsplit(index)
    origin = urlunsplit((index_parts.scheme, index_parts.netloc, "", "", ""))
    seeds = {origin + "/robots.txt", origin + "/sitemap.xml", origin + "/sitemap-index.xml", index,
             index.rstrip("/") + "/feed", index.rstrip("/") + "/rss.xml"}
    seeds.update(args.source_url)
    historical_sources = source_urls(coverage)
    seeds.update(u for u in historical_sources if canonical_url(u) not in known)
    if args.no_default_sources:
        seeds = set(args.source_url)
    if urlsplit(index).netloc == "medium.com":
        seeds = {u for u in seeds if "sitemap" not in u or u in args.source_url}
    allowed_source_hosts = {urlsplit(u).netloc for u in seeds | known}
    for pattern in args.exclude_pattern:
        for url, in archive.db.execute("SELECT url FROM articles").fetchall():
            if re.search(pattern, url):
                archive.body_result(url, {"url": url, "fetched_at": now(), "status": "excluded_nonarticle", "pattern": pattern,
                    "transport_attempted": False}, {"status": "excluded_nonarticle", "text": "", "word_count": 0, "body_read": False})
    if args.repair_bindings:
        archive.repair_bindings()
        print(json.dumps(archive.summary(args.publisher, config), indent=2), flush=True)
        archive.db.close()
        archive.lock_handle.close()
        return
    if args.reextract:
        for url, raw_receipt in archive.db.execute("SELECT url,receipt FROM articles WHERE receipt IS NOT NULL AND status != 'excluded_nonarticle'").fetchall():
            receipt = json.loads(raw_receipt)
            prior_receipt = json.loads(raw_receipt)
            relative = receipt.get("object_path")
            if not relative:
                continue
            body_path = archive.root / relative
            try:
                data = body_path.read_bytes()
            except OSError as exc:
                archive.body_result(url, {"url": url, "fetched_at": now(), "status": "evidence_unavailable",
                    "error": str(exc), "original_receipt": prior_receipt, "transport_attempted": False},
                    {"status": "evidence_unavailable", "text": "", "word_count": 0, "body_read": False})
                continue
            if digest(data) != receipt.get("sha256"):
                archive.body_result(url, {"url": url, "fetched_at": now(), "status": "evidence_integrity_failure",
                    "error": "Stored response hash mismatch", "original_receipt": prior_receipt, "transport_attempted": False},
                    {"status": "evidence_integrity_failure", "text": "", "word_count": 0, "body_read": False})
                continue
            text = data.decode("utf-8", errors="replace")
            if receipt.get("status") in {"embedded_imported_body", "embedded_api_body"}:
                text = "<article>" + text + "</article>"
            receipt["bytes"] = len(data)
            http_status = receipt.get("http_status", 200)
            status = classify_response(http_status, receipt.get("content_type", "text/html"), text, True)
            if receipt.get("status") not in {"embedded_imported_body", "embedded_api_body", "alternate_published_source"}:
                receipt["status"] = status
            if receipt.get("status") == "alternate_published_source":
                extraction = {"status": "body_extracted" if len(text.split()) >= 120 else "body_fetched_unextracted",
                    "text": text, "word_count": len(text.split()), "body_read": False,
                    "method": "alternate_published_source", "text_sha256": digest(text.encode())}
                archive.body_result(url, dict(receipt, reextracted_at=now(), original_receipt=prior_receipt), extraction)
                continue
            if status == "fetched" and redirected_to_collection(url, receipt.get("url", url), index, prefixes):
                status = "redirected_to_collection"
            elif status == "fetched" and canonical_url(url) != canonical_url(receipt.get("url", url)) and not is_article_url(canonical_url(receipt.get("url", url)), prefixes, known):
                status = "redirected_outside_scope"
            extraction = extract_publisher_article(text, args.publisher, url, receipt.get("url", url)) if status == "fetched" else {"status": status, "text": "", "word_count": 0, "body_read": False}
            extraction["text_sha256"] = digest(extraction["text"].encode())
            archive.body_result(url, dict(receipt, reextracted_at=now(), original_receipt=prior_receipt), extraction)
        print(json.dumps(archive.summary(args.publisher, config), indent=2), flush=True)
        archive.db.close()
        archive.lock_handle.close()
        return
    if not args.bodies_only:
        queue = sorted(seeds, key=lambda u: (not u.endswith("/robots.txt"), u))
        visited = set()
        while queue:
            url = queue.pop(0)
            if url in visited:
                continue
            visited.add(url)
            old = archive.db.execute("SELECT status,receipt FROM sources WHERE url=?", (url,)).fetchone()
            if old and not args.refresh_sources and not args.retry_failed:
                previous = json.loads(old[1])
                queue.extend(u for u in previous.get("continuations", []) if u not in visited and urlsplit(u).netloc in allowed_source_hosts)
                continue
            receipt, text, attempts = fetcher.fetch(url, "source")
            archive.record_attempts(attempts)
            article_rows, more, embedded, terminal = {}, set(), [], None
            if receipt["status"] == "fetched":
                article_rows, more, embedded, terminal = discover_document(text, receipt.get("url", url), receipt.get("content_type", ""), prefixes, known, receipt.get("headers"))
                if urlsplit(url).path == "/robots.txt":
                    rp = RobotFileParser(url)
                    rp.parse(text.splitlines())
                    fetcher.robots[urlsplit(url).netloc] = rp
                for article, metadata in article_rows.items():
                    archive.article(article, metadata)
                    known.add(article)
                for article, html in embedded:
                    if article in known:
                        archive.embedded_body(article, html, receipt, "embedded_api_body")
                for source in sorted(more):
                    if urlsplit(source).netloc in allowed_source_hosts and source not in visited:
                        queue.append(source)
                    elif urlsplit(source).netloc not in allowed_source_hosts:
                        archive.append("discovery-events.jsonl", {"url": source, "status": "out_of_scope_source_host", "discovered_from": url})
            event = {"url": url, "receipt": receipt, "discovered_articles": len(article_rows),
                     "continuations": sorted(more), "terminal_observation": terminal}
            archive.append("discovery-events.jsonl", event)
            archive.db.execute("INSERT OR REPLACE INTO sources VALUES(?,?,?)", (url, receipt["status"], json.dumps(event)))
            archive.db.commit()
            archive.summary(args.publisher, config)
            print(json.dumps({"publisher": args.publisher, "source": url, "status": receipt["status"], "new_frontier_count": len(known), "sources_remaining": len(queue)}), flush=True)
    if not args.discover_only:
        for origin in sorted({urlunsplit((urlsplit(u).scheme, urlsplit(u).netloc, "", "", "")) for u in known}):
            host = urlsplit(origin).netloc
            if host in fetcher.robots:
                continue
            attempts = fetcher.ensure_robots(origin)
            archive.record_attempts(attempts)
            archive.append("discovery-events.jsonl", {"url": origin + "/robots.txt", "receipt": attempts[-1] if attempts else {},
                "terminal_observation": "Robots policy refreshed before article requests; blocked robots means policy unavailable"})
        statuses = {"pending"}
        if args.retry_unextracted:
            statuses.add("body_fetched_unextracted")
        if args.retry_failed:
            statuses.update(s for s, in archive.db.execute("SELECT DISTINCT status FROM articles") if s not in SUCCESS and s != "excluded_nonarticle")
        pending = [url for url, status in archive.db.execute("SELECT url,status FROM articles ORDER BY url") if status in statuses]
        def article_job(url):
            denied = fetcher.policy_status(url)
            if denied:
                return url, {"url": url, "fetched_at": now(), "status": denied,
                    "transport_attempted": False}, "", []
            receipt, text, attempts = fetcher.fetch(url)
            return url, receipt, text, attempts
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            iterator = iter(pending)
            active = set()
            for i in range(args.concurrency):
                url = next(iterator, None)
                if url:
                    active.add(executor.submit(article_job, url))
            completed = 0
            while active:
                ready, active = concurrent.futures.wait(active, return_when=concurrent.futures.FIRST_COMPLETED)
                for future in ready:
                    url, receipt, text, attempts = future.result()
                    archive.record_attempts(attempts)
                    if receipt["status"] == "fetched" and redirected_to_collection(url, receipt.get("url", url), index, prefixes):
                        extraction = {"status": "redirected_to_collection", "text": "", "word_count": 0, "body_read": False}
                    elif receipt["status"] == "fetched" and canonical_url(url) != canonical_url(receipt.get("url", url)) and not is_article_url(canonical_url(receipt.get("url", url)), prefixes, known):
                        extraction = {"status": "redirected_outside_scope", "text": "", "word_count": 0, "body_read": False}
                    elif receipt["status"] == "fetched":
                        extraction = extract_publisher_article(text, args.publisher, url, receipt.get("url", url))
                        extraction["text_sha256"] = digest(extraction["text"].encode())
                    else:
                        extraction = {"status": receipt["status"], "text": "", "word_count": 0, "body_read": False}
                    archive.body_result(url, receipt, extraction)
                    completed += 1
                    if completed % 25 == 0:
                        archive.summary(args.publisher, config)
                        print(json.dumps({"publisher": args.publisher, "bodies_completed_this_run": completed,
                                          "bodies_remaining_this_run": len(pending) - completed}), flush=True)
                    next_url = next(iterator, None)
                    if next_url:
                        active.add(executor.submit(article_job, next_url))
    print(json.dumps(archive.summary(args.publisher, config), indent=2), flush=True)
    archive.db.close()
    archive.lock_handle.close()


def import_body_records(archive, path):
    for line in Path(path).read_text().splitlines():
        row = json.loads(line)
        url = canonical_url(row["url"])
        if not url:
            raise ValueError("Invalid imported article identity")
        source = Path(row["source_path"]).resolve()
        if source == REPOSITORY or REPOSITORY in source.parents:
            raise ValueError("Imported raw source must remain external")
        raw = source.read_bytes()
        if digest(raw) != row["sha256"]:
            raise ValueError("Imported source digest mismatch: " + url)
        relative, sha = archive.save_raw(url, raw, "alternate-published-source")
        text = raw.decode("utf-8", errors="replace")
        extraction = {"status": "body_extracted" if len(text.split()) >= 120 else "body_fetched_unextracted",
                      "text": text, "text_sha256": digest(text.encode()), "word_count": len(text.split()),
                      "body_read": False, "method": "alternate_published_source",
                      "extraction_limit": "Alternate publisher source file, canonical webpage fetch status remains separately retained."}
        archive.article(url, {"kind": "alternate_published_source", "source_url": row["source_url"]})
        archive.body_result(url, {"url": url, "fetched_at": now(), "status": "alternate_published_source",
            "object_path": relative, "sha256": sha, "bytes": len(raw), "source_url": row["source_url"],
            "source_attribution": {k: v for k, v in row.items() if k not in {"source_path"}},
            "transport_attempted": False}, extraction)


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--publisher", required=True)
    p.add_argument("--archive-root", required=True, help="External evidence directory, outside this repository")
    p.add_argument("--baseline-root", required=True, help="Recovered historical archive root")
    p.add_argument("--source-url", action="append", default=[])
    p.add_argument("--urls-file", action="append", default=[], help="External newline article URL file")
    p.add_argument("--import-bodies", action="append", default=[], help="External attributed body source JSONL: url,source_path,source_url,sha256")
    p.add_argument("--import-source", action="append", default=[], help="Cached publisher JSON source as URL=external-file-path")
    p.add_argument("--include-prefix", action="append", default=[])
    p.add_argument("--concurrency", type=int, default=3)
    p.add_argument("--interval", type=float, default=0.35)
    p.add_argument("--timeout", type=float, default=30)
    p.add_argument("--retries", type=int, default=2)
    p.add_argument("--discover-only", action="store_true")
    p.add_argument("--bodies-only", action="store_true")
    p.add_argument("--retry-failed", action="store_true")
    p.add_argument("--retry-unextracted", action="store_true", help="Attempt canonical article retrieval for unextracted API or page responses")
    p.add_argument("--refresh-sources", action="store_true")
    p.add_argument("--no-default-sources", action="store_true", help="Use only exact source overrides, with robots fetched separately")
    p.add_argument("--exclude-pattern", action="append", default=[], help="Preserve URL but classify a reviewed nonarticle regex")
    p.add_argument("--reextract", action="store_true", help="Reclassify and extract stored responses locally, preserving prior events")
    p.add_argument("--repair-bindings", action="store_true", help="Append verified byte bindings for legacy receipt omissions locally")
    return p


if __name__ == "__main__":
    args = parser().parse_args()
    if args.concurrency < 1 or args.concurrency > 16 or args.interval < 0 or args.timeout <= 0 or args.retries < 0:
        raise SystemExit("Invalid bounded request configuration")
    run(args)
