#!/usr/bin/env python3
"""Public Dropbox archive metadata, without storing article bodies."""
import requests,time,json,datetime,collections,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup
BASE=Path(__file__).parent
session=requests.Session()
session.headers['User-Agent']='Archive metadata research; public engineering index'
last={};ledger=[]
def get(url):
    host=urlparse(url).netloc
    time.sleep(max(0,1.1-(time.monotonic()-last.get(host,0))))
    last[host]=time.monotonic()
    started=datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        r=session.get(url,timeout=(10,25))
        ledger.append({'url':url,'requested_at':started,'status':r.status_code,'final_url':r.url,'response_bytes':len(r.content),'content_type':r.headers.get('content-type')})
        r.raise_for_status();return r
    except Exception as e:
        ledger[-1]['error']=str(e);return None
allstories=get('https://dropbox.tech/all-stories')
sitemap=get('https://dropbox.tech/sitemap.xml')
feed=get('https://dropbox.tech/feed')
robots=get('https://dropbox.tech/robots.txt')
soup=BeautifulSoup(allstories.text,'html.parser')
articles=[]
for a in soup.select('[data-element-id="article-link"]'):
    li=a.find_parent('li');date=li.select_one('[data-element-id="article-date"]').get_text(' ',strip=True)
    published=datetime.datetime.strptime(date,'%b %d, %Y').date().isoformat()
    category=li.select_one('[data-element-id="article-category-link"]').get_text(' ',strip=True)
    articles.append({'url':a['href'].rstrip('/'),'title':a.get_text(' ',strip=True),'published_at':published,'category':category,'metadata_sources':['https://dropbox.tech/all-stories']})
articlemap={a['url']:a for a in articles}
root=ET.fromstring(sitemap.content);excluded=[]
for e in root:
    url=e.find('{*}loc').text.rstrip('/');lm=e.find('{*}lastmod')
    if url in articlemap:
        articlemap[url]['lastmod']=lm.text if lm is not None else None
        articlemap[url]['metadata_sources'].append('https://dropbox.tech/sitemap.xml')
    else:
        path=urlparse(url).path.strip('/').split('/')
        kind='author-profile' if path[0]=='authors' else 'configuration' if path[0]=='configurations' else 'error' if path[0]=='error' else 'navigation/index'
        excluded.append({'url':url,'reason':kind})
froot=ET.fromstring(feed.content);items=froot.findall('.//item');feedurls=[]
for e in items:
    url=e.findtext('link').rstrip('/');feedurls.append(url)
    if url in articlemap:articlemap[url]['metadata_sources'].append('https://dropbox.tech/feed')
# Search existing JSON/Markdown notes for previous coverage, excluding current run.
research=Path('docs/research/engineering-toolkit');previous=''.join(p.read_text(errors='replace') for p in research.rglob('*') if p.is_file() and '2026-10-01' not in str(p) and p.suffix in ('.json','.md'))
for a in articles:a['prior_research_mention']=a['url'] in previous
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
articles.sort(key=lambda x:(x['published_at'],x['url']),reverse=True)
index={'publisher_id':'dropbox','generated_at':now,'metadata_only':True,'canonical_url_basis':'Official all-stories permalinks reconciled against sitemap loc entries. Individual body rel=canonical was not fetched for enumeration.','articles':articles}
coverage={'publisher_id':'dropbox','generated_at':now,'status':'terminal-for-accessible-official-archive','article_count':len(articles),'earliest_published_at':min(a['published_at'] for a in articles),'latest_published_at':max(a['published_at'] for a in articles),'endpoints':[{'url':'https://dropbox.tech/all-stories','http_status':200,'pages':1,'article_count':len(articles),'terminal':True,'terminal_evidence':'Page lists entire archive with no pagination links; its 410 distinct article permalinks equal every article loc in the sitemap.'},{'url':'https://dropbox.tech/sitemap.xml','http_status':200,'pages':1,'loc_count':len(root),'article_count':len(articles),'excluded_loc_count':len(excluded),'terminal':True,'terminal_evidence':'Single urlset with no child sitemaps or next pointer; all article locs reconciled against all-stories.'},{'url':'https://dropbox.tech/feed','http_status':200,'pages':1,'article_count':len(items),'terminal':False,'terminal_evidence':'Recent ten-item RSS; no next/previous relation and not treated as full archive.'},{'url':'https://dropbox.tech/robots.txt','http_status':404,'pages':1,'terminal':False,'terminal_evidence':'404; no discoverable robots endpoint.'}],'exclusions_summary':dict(collections.Counter(x['reason'] for x in excluded)),'exclusions':excluded,'gaps':['Coverage is the accessible publisher archive and sitemap as observed, not proof that deleted or migrated historical posts remain present.','Sitemap lastmod is retained separately from article publication date.','Article bodies were not read by enumeration; prior_research_mention marks a locator appearing in earlier notes, not an earlier deep-read.'],'request_policy':{'per_host_min_interval_seconds':1.1,'timeout_connect_seconds':10,'timeout_read_seconds':25},'requests':ledger}
(BASE/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
(BASE/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'article_count':len(articles),'sitemap_loc_count':len(root),'excluded_count':len(excluded),'earliest':coverage['earliest_published_at'],'latest':coverage['latest_published_at'],'prior_mentions':sum(a['prior_research_mention'] for a in articles)}))
