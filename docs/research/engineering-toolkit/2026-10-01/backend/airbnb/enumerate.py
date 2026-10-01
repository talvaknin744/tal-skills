#!/usr/bin/env python3
"""Enumerate accessible first-party Airbnb publication metadata, never full text.

Run from any directory. A feed snapshot is not the historical archive.
Requests are serial, spaced by at least 1.1 seconds, with bounded timeouts.
"""
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import quote, urlsplit, urlunsplit
import xml.etree.ElementTree as ET

import requests

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
FEED = "https://medium.com/feed/airbnb-engineering"
MAX_TAG_FEEDS = 100
PROBES = [
    (FEED, "publication-rss"),
    ("https://medium.com/feed/airbnb-engineering?limit=100", "feed-limit-probe"),
    ("https://medium.com/feed/airbnb-engineering?before=2026-06-09", "feed-pagination-probe"),
    ("https://medium.com/airbnb-engineering", "publication-index"),
    ("https://medium.com/airbnb-engineering/archive", "historical-archive"),
    ("https://medium.com/airbnb-engineering/all", "current-archive"),
    ("https://medium.com/airbnb-engineering?format=json", "publication-json-probe"),
    ("https://medium.com/airbnb-engineering/archive?format=json", "archive-json-probe"),
    ("https://medium.com/airbnb-engineering/sitemap.xml", "publication-sitemap-probe"),
    ("https://medium.com/airbnb-engineering/sitemap/sitemap.xml", "publication-sitemap-probe"),
    ("https://medium.com/sitemap/airbnb-engineering", "publication-sitemap-probe"),
    ("https://medium.com/robots.txt", "robots-discovery"),
    ("https://medium.com/sitemap/sitemap.xml", "global-sitemap-index"),
]


def utcnow():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_url(url):
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def write_json(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main():
    started_at = utcnow()
    endpoints = []
    articles = {}
    feed_hashes = {}
    discovered_tags = set()
    queued_tags = set()
    fetched_tags = set()
    remaining_tags = set()
    rate_limited = False
    tag_discovery_started = time.monotonic()
    last_request_at = 0.0
    session = requests.Session()
    for url, kind in PROBES:
        if kind == "publication-tag-rss" and (rate_limited or time.monotonic() - tag_discovery_started > 240):
            remaining_tags.add(url.rsplit("/", 1)[-1])
            continue
        time.sleep(max(0.0, 1.1 - (time.monotonic() - last_request_at)))
        last_request_at = time.monotonic()
        item = {"url": url, "kind": kind, "requested_at": utcnow(), "pages": 1, "count": 0, "terminal": False}
        try:
            response = session.get(url, timeout=(10, 25))
            item.update(status=response.status_code, final_url=response.url,
                        content_type=response.headers.get("content-type"), response_bytes=len(response.content))
            if response.status_code == 200 and kind in {"publication-rss", "feed-limit-probe", "feed-pagination-probe", "publication-tag-rss"}:
                digest = hashlib.sha256(response.content).hexdigest()
                if kind != "publication-tag-rss":
                    feed_hashes[url] = digest
                else:
                    fetched_tags.add(url.rsplit("/", 1)[-1])
                root = ET.fromstring(response.content)
                entries = root.findall("./channel/item")
                item.update(count=len(entries), terminal=True,
                            terminal_reason="All item elements in this RSS snapshot consumed; no pagination link exposed. This is a feed terminal, not a historical-archive terminal.",
                            response_sha256=digest, feed_title=root.findtext("./channel/title"))
                for entry in entries:
                    source_url = entry.findtext("link")
                    canonical = normalize_url(source_url)
                    record = articles.setdefault(canonical, {
                        "url": canonical,
                        "title": entry.findtext("title"),
                        "published_at": parsedate_to_datetime(entry.findtext("pubDate")).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                        "lastmod": None,
                        "metadata_sources": [],
                        "source_url": source_url,
                        "categories": [],
                    })
                    record["metadata_sources"].append(url)
                    categories = {node.text for node in entry.findall("category") if node.text}
                    record["categories"] = sorted(set(record["categories"]) | categories)
                    discovered_tags.update(categories)
                # Publication-scoped RSS tag links derive from category metadata only.
                # The finite bound is explicit; exhausting tag feeds does not prove history complete.
                for tag in sorted(discovered_tags - queued_tags):
                    if len(queued_tags) < MAX_TAG_FEEDS:
                        PROBES.append((FEED + "/tagged/" + quote(tag, safe="-"), "publication-tag-rss"))
                        queued_tags.add(tag)
                    else:
                        remaining_tags.add(tag)
            elif response.status_code == 200 and kind == "global-sitemap-index":
                root = ET.fromstring(response.content)
                children = root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap")
                item.update(count=len(children), count_unit="child_sitemaps", terminal=False,
                            terminal_reason="Root sitemap index parsed in full; its global post/user/publication child sitemaps were not traversed because they do not delimit the Airbnb publication.")
            elif response.status_code == 200 and kind == "robots-discovery":
                item.update(count=0, terminal=True, terminal_reason="Entire robots response inspected for sitemap declarations.",
                            sitemap_declarations=re.findall(r"(?im)^Sitemap:\s*(\S+)", response.text))
            elif response.status_code == 403:
                item["terminal_reason"] = "HTTP 403 Cloudflare error/challenge HTML; archive enumeration did not advance."
            elif response.status_code == 404:
                item["terminal_reason"] = "HTTP 404; guessed endpoint does not provide an archive."
            elif response.status_code == 429:
                rate_limited = True
                item["terminal_reason"] = "HTTP 429; stop subsequent tag requests and preserve the partial metadata snapshot."
            else:
                item["terminal_reason"] = "Response did not expose a parsed archive in this bounded probe."
        except Exception as exc:
            item.update(status="request_error", error=f"{type(exc).__name__}: {exc}", terminal_reason="Bounded request failed; no archive traversal.")
        endpoints.append(item)
        print(json.dumps({"url": url, "status": item["status"], "count": item["count"]}), flush=True)

    # Compare normalized URLs and Medium story IDs against all previous research ledgers.
    previous_urls = set()
    previous_files = []
    for path in sorted(ROOT.rglob("*.json")):
        if "2026-10-01" in path.parts:
            continue
        text = path.read_text()
        urls = re.findall(r'https?://[^\s"\\<>]+', text)
        matches = [normalize_url(url) for url in urls if "medium.com/airbnb-engineering/" in url]
        if matches:
            previous_files.append(str(path.relative_to(ROOT)))
            previous_urls.update(matches)
    prior_ids = {match.group(1) for url in previous_urls if (match := re.search(r"-([a-f0-9]{12})$", url))}
    duplicate_count = 0
    for record in articles.values():
        match = re.search(r"-([a-f0-9]{12})$", record["url"])
        existing = record["url"] in previous_urls or bool(match and match.group(1) in prior_ids)
        record["already_in_prior_records"] = existing
        duplicate_count += existing
    ordered = sorted(articles.values(), key=lambda value: value["published_at"] or "", reverse=True)
    generated_at = utcnow()
    write_json("index.json", {
        "publisher_id": "airbnb", "publisher_name": "Airbnb", "lane": "backend",
        "generated_at": generated_at, "metadata_only": True,
        "scope": "Union of current first-party publication RSS and bounded publication-tag RSS snapshots discovered from category metadata. Historical completeness is not established.",
        "url_normalization": "RSS link with tracking query and fragment removed; article pages were not fetched to inspect rel=canonical.",
        "article_count": len(ordered), "articles": ordered,
    })
    write_json("coverage.json", {
        "publisher_id": "airbnb", "lane": "backend", "started_at": started_at, "generated_at": generated_at,
        "status": "partial", "full_archive_terminal_reached": False,
        "method": "Metadata-only first-party RSS/XML and bounded archive endpoint probes. RSS body/description/content fields were neither analyzed nor saved. No article deep reads.",
        "request_policy": {"minimum_seconds_between_request_starts_per_host": 1.1, "connect_timeout_seconds": 10, "read_timeout_seconds": 25},
        "endpoints": endpoints,
        "browser_extraction_observations": [
            {"url": "https://medium.com/airbnb-engineering", "status": "public_shell", "count": 0,
             "note": "web.open exposes publication name, Airbnb careers link and topic navigation, but no story metadata."},
            {"url": "https://medium.com/airbnb-engineering/archive", "final_url": "https://medium.com/airbnb-engineering/all", "status": "public_shell", "count": 0,
             "note": "web.open follows archive redirect and exposes Latest / All topics / All years controls, but no story metadata."},
        ],
        "article_count": len(ordered), "earliest_published_at": min((record["published_at"] for record in ordered), default=None),
        "latest_published_at": max((record["published_at"] for record in ordered), default=None),
        "feed_pagination_probes_return_same_payload": len(set(feed_hashes.values())) == 1 and len(feed_hashes) == 3,
        "tag_feed_discovery": {"discovery_source": "RSS item/category metadata", "maximum_tag_feed_requests": MAX_TAG_FEEDS,
                               "maximum_elapsed_discovery_seconds": 240, "discovered_tag_count": len(discovered_tags),
                               "requested_tag_feed_count": sum(endpoint["kind"] == "publication-tag-rss" for endpoint in endpoints),
                               "successful_tag_feed_count": len(fetched_tags), "unvisited_tags": sorted(remaining_tags)},
        "rate_limiting": {"observed": rate_limited, "policy": "Stop subsequent tag requests on the first HTTP 429.",
                          "failed_endpoints": [endpoint["url"] for endpoint in endpoints if endpoint["status"] == 429]},
        "deduplication": {"previous_record_root": "docs/research/engineering-toolkit", "excluded_scan_tree": "2026-10-01",
                          "comparison": "Normalized exact URL and Medium 12-character story ID.",
                          "previous_files_with_airbnb_article_urls": previous_files,
                          "previous_unique_airbnb_article_urls": len(previous_urls), "current_rows_already_recorded": duplicate_count,
                          "current_rows_not_in_prior_records": len(ordered) - duplicate_count},
        "exclusions": [
            "Medium-wide sitemap descendants: 27,974 child sitemaps span unrelated publications, users and posts; no Airbnb-scoped terminal was established.",
            "Full article content, RSS content:encoded/description, comments, and recommendations.",
            "Article recommendations and deep-reading claims are outside this metadata enumeration.",
        ],
        "gaps": [
            "Historical archive before the oldest RSS entry is unenumerated; a feed terminal does not prove archive exhaustion.",
            "Direct publication/archive/JSON/publication-sitemap requests receive HTTP 403; browser text extraction only exposes shell controls.",
            "limit=100 and before=2026-06-09 did not paginate the RSS feed; both returned the same ten entries.",
            "lastmod is unavailable from these RSS item fields and remains null; canonical URLs are normalized RSS links rather than article rel=canonical observations.",
            "Publication tag RSS feeds each expose a current snapshot; their union does not prove coverage of older articles that have dropped out of every discovered tag feed.",
            "Category discovery is bounded to 100 tag feeds and 240 seconds; any unvisited tags are listed explicitly.",
            "HTTP 429 responses prevent completion of some discovered tag feeds; exact failed endpoints are recorded.",
        ],
    })
    print(json.dumps({"article_count": len(ordered), "status": "partial", "output": str(OUT)}), flush=True)


if __name__ == "__main__":
    main()
