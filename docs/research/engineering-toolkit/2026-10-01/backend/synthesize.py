#!/usr/bin/env python3
"""Reconcile the frozen publisher metadata records; performs no network reads."""
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
import json,datetime,re
BASE=Path(__file__).parent
RESEARCH=Path('docs/research/engineering-toolkit')
PUBLISHERS=['netflix','uber','stripe','shopify','github','slack','airbnb','spotify','doordash','dropbox']
def norm(url):
    p=urlsplit(url);return urlunsplit((p.scheme,p.netloc.lower(),p.path.rstrip('/'),'',''))
previous={}
for path in RESEARCH.rglob('*'):
    if path.is_file() and path.suffix in ('.md','.json') and '2026-10-01' not in str(path):
        for url in re.findall(r'https?://[^\s<>\"\)\]}]+',path.read_text(errors='replace')):
            previous.setdefault(norm(url),set()).add(str(path))
articles=[];publishers=[];seen=set()
for name in PUBLISHERS:
    ip=BASE/name/'index.json';cp=BASE/name/'coverage.json'
    if not ip.exists() or not cp.exists():raise SystemExit('Missing final publisher deliverable: '+name)
    source=json.loads(ip.read_text());coverage=json.loads(cp.read_text());rows=source.get('articles',source.get('entries',[]))
    urls=[norm(r['url']) for r in rows]
    assert len(urls)==len(set(urls)),name
    status=coverage.get('status',coverage.get('coverage_status',coverage.get('terminal_status','See source coverage')))
    publisher={'publisher_id':name,'article_count':len(rows),'status':status,'index_record':str(ip.relative_to(BASE)),'coverage_record':str(cp.relative_to(BASE)),'earliest_published_at':coverage.get('earliest_published_at',coverage.get('earliest_publication_date')),'latest_published_at':coverage.get('latest_published_at',coverage.get('latest_publication_date')),'completion_scope':coverage.get('completion_scope',coverage.get('coverage_limit')),'limitations':coverage.get('limitations',[]),'earliest_archive_date':coverage.get('earliest_archive_date'),'missing_title_count':sum(not r.get('title') for r in rows),'unverified_publication_date_count':sum(not r.get('published_at') for r in rows),'previously_recorded_count':sum(bool(previous.get(norm(r['url']))) for r in rows),'gaps':coverage.get('gaps',[])}
    publishers.append(publisher)
    for row in rows:
        url=norm(row['url']);assert url not in seen,(name,url);seen.add(url)
        sources=row.get('metadata_sources',row.get('enumeration_sources',row.get('sources',[])))
        if not sources:sources=[row.get('metadata_source',row.get('metadata_url'))] if row.get('metadata_source',row.get('metadata_url')) else []
        articles.append({'publisher_id':name,'url':row['url'],'title':row.get('title'),'published_at':row.get('published_at'),'archive_date':row.get('archive_date'),'publication_date_basis':row.get('publication_date_confidence',row.get('publication_date_source',row.get('date_source','See publisher source record'))),'publication_date_verification':row.get('publication_date_verification'),'archive_date_basis':row.get('publication_date_source') if row.get('archive_date') else None,'lastmod':row.get('lastmod',row.get('sitemap_last_modified',row.get('updated_at'))),'metadata_sources':sources,'source_record':str(ip.relative_to(BASE)),'previous_record_paths':sorted(previous.get(url,[]))})
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
index={'lane':'backend','generated_at':now,'archive_enumeration_metadata_only':True,'canonical_url_basis':'Each publisher record preserves official archive permalinks and its canonical URL verification limits. No global claim of individual-body rel=canonical verification is made.','article_count':len(articles),'previously_recorded_count':sum(bool(a['previous_record_paths']) for a in articles),'newly_catalogued_count':sum(not a['previous_record_paths'] for a in articles),'publishers':publishers,'articles':articles}
(BASE/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
legacy=json.loads((BASE/'stripe'/'legacy-index.json').read_text())
legacy_rows=legacy.get('articles',legacy.get('entries',[]))
supplement={'publisher_id':'stripe','index_record':'stripe/legacy-index.json','article_count':len(legacy_rows),'scope':'All English legacy corporate blog categories; historical engineering classification unresolved. Excluded from main Engineering record count.','earliest_published_at':min(a['published_at'] for a in legacy_rows if a.get('published_at')),'overlap_note':'Current/legacy title-and-date aliases are documented in Stripe coverage; distinct URL counts are not claimed as distinct underlying article works.'}
summary={'lane':'backend','generated_at':now,'publisher_count':len(publishers),'article_count':len(articles),'metadata_only':True,'full_archives_all_reached':False,'supplementary_indexes':[supplement],'publishers':publishers,'method':'Official archives, APIs, feeds and sitemaps traversed to their accessible terminal conditions or explicit documented access/rate/history gaps. Supplemental legacy corp-category metadata is retained separately where engineering classification is unavailable.','deep_read_records':['deep-capacity-data.json','deep-interfaces.json'],'copyright_scope':'Article titles, URLs, dates and original practice analysis; no article full text retained.','verification':'JSON parsing and unique normalized URL assertions passed; proposed runtime checks were not executed.'}
(BASE/'coverage.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
lines=['# Backend archive inventory — 2026-10-01','',f'{len(articles):,} official archive metadata records across ten publishers. Metadata enumeration is separate from article reading. Accessible terminal endpoints are exhausted where indicated; publisher history gaps remain explicit.','', '| Publisher | Records | Status | Missing publication dates |','| --- | ---: | --- | ---: |']
labels={'netflix':('Netflix','Sitemap exhausted; older history limited'),'uber':('Uber','Engineering category exhausted'),'stripe':('Stripe','Current category exhausted; legacy taxonomy unknown'),'shopify':('Shopify','Feed exhausted; HTML gaps listed'),'github':('GitHub','Current English taxonomy exhausted'),'slack':('Slack','Public API exhausted'),'airbnb':('Airbnb','Limited feeds; history blocked/rate limited'),'spotify':('Spotify','Current API exhausted; publication dates partial'),'doordash':('DoorDash','Engineering API exhausted'),'dropbox':('Dropbox','All-stories and sitemap reconciled')}
for p in publishers:
    name,label=labels[p['publisher_id']]
    lines.append(f"| [{name}]({p['coverage_record']}) | {p['article_count']} | {label} | {p['unverified_publication_date_count']} |")
lines+=['','A separate Stripe legacy corporate supplement contains 234 dated records back to 2012-06-13; its historical engineering category is unresolved, so it is excluded from the main count. Netflix exposes history only from 2020 through its accessible sitemap; Airbnb history remains feed-limited and rate-limited. Spotify publication dates are unverified for 283 rows; CMS archive dates are retained separately.','', 'Each publisher directory contains index.json and coverage.json with exact endpoint, page, date-basis and exclusion details. [Combined index](index.json) normalizes metadata and prior-record URL matches; [coverage](coverage.json) preserves publisher limits.','', '[Capacity/data cards](deep-capacity-data.json) and [interface/dataflow cards](deep-interfaces.json) contain four fresh article reads, six-dimensional practices and current primary-document crosschecks. Their Markdown companions record read scopes and ranked existing reference placements.','', 'Approved package changes are recorded separately in the deep-read records and implementation report. No commits or deployments were performed here; root owns model trials and integration. Article enumeration itself remains metadata-only.']
(BASE/'README.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'publishers':len(publishers),'articles':len(articles),'new':index['newly_catalogued_count'],'prior':index['previously_recorded_count']}))
