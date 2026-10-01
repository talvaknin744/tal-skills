#!/usr/bin/env python3
"""Rebuild frozen metadata from cached responses, extracting no article prose."""
import datetime,email.utils,html,json,pathlib,re,urllib.parse,xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from enumerate import BASE,PUBLISHERS,stamp
from crawl import article,NS,usefulmap
PROBES=['probes.json','metadata-probes.json','followup-probes.json','enrichment-probes.json']
reqs=[]
for file in PROBES:
 d=json.loads((BASE/file).read_text())
 reqs.extend(d.get('requests',[]))
 for p in d.get('publishers',[]):reqs.extend(p.get('requests',[]))
# Include child sitemap attempts from the first crawl, including blocked endpoints.
if (BASE/'coverage.json').exists():
 for pub in json.loads((BASE/'coverage.json').read_text()).get('publishers',[]):reqs.extend(pub.get('request_log',[]))
unique={}
for r in reqs: unique[(r['url'],r['accessed_at'])]=r
reqs=list(unique.values())
def textbody(r):
 import hashlib
 p=pathlib.Path(r.get('cache_path','/tmp/engineering-toolkit-quality-20261001/'+hashlib.sha256(r['url'].encode()).hexdigest()+'.body'))
 return p.read_bytes() if p.exists() else b''
def normalize(u):
 x=urllib.parse.urlparse(u);return urllib.parse.urlunparse((x.scheme,x.netloc,x.path.rstrip('/') or '/', '', '', ''))
def isarticle(p,u):
 if p['id']=='jetbrains':return bool(re.search(r'/\d{4}/\d{2}/(?:\d{2}/)?[^/]+/?$',urllib.parse.urlparse(u).path))
 return article(p,u)
def datevalue(t):
 if not t:return None
 try:return email.utils.parsedate_to_datetime(t).date().isoformat()
 except Exception:return t[:10] if re.match(r'\d{4}-\d{2}-\d{2}',t) else None
results=[];allrows=[]
for p in PUBLISHERS:
 pid=p['id'];host=urllib.parse.urlparse(p['index_url']).netloc;rows={};endpoints=[];failures=[];excluded=0
 logs=[r for r in reqs if urllib.parse.urlparse(r['url']).netloc in [host,'www.'+host] and r.get('status')]
 def add(u,source,title=None,date=None,lastmod=None,evidence=None):
  key=normalize(u)
  if not isarticle(p,u):return
  v=rows.setdefault(key,{'publisher_id':pid,'canonical_url':u,'title':None,'published_at':None,'last_modified_at':None,'metadata_sources':[],'body_read':False})
  if source not in v['metadata_sources']:v['metadata_sources'].append(source)
  if title:v['title']=html.unescape(title).strip()
  if date:v['published_at']=date;v['published_at_evidence']=evidence
  if lastmod:v['last_modified_at']=lastmod
  if v['published_at'] is None:
   m=re.search(r'/(\d{4})/(\d{2})/(\d{2})/',u)
   if m:v['published_at']='-'.join(m.groups());v['published_at_evidence']='URL date path'
 for r in logs:
  url=r['url'];body=textbody(r)
  relevant_map=url.endswith('.xml') and usefulmap(p,url)
  # All root indexes are relevant even when child selection is narrower.
  rootmap=url in ['https://www.docker.com/sitemap_index.xml','https://about.gitlab.com/sitemap.xml','https://about.gitlab.com/sitemap_index.xml','https://blog.jetbrains.com/sitemap_index.xml']
  if pid=='jetbrains' and url.endswith(('/team-sitemap.xml','/category-sitemap.xml')):continue
  if r.get('status')!=200:
   if relevant_map or rootmap or 'wp-json' in url or pid=='discord' and 'sitemap' in url:
    failures.append({'endpoint':url,'http_status':r.get('status'),'failure':'HTTP 202 with empty body; access challenge/not an archive response' if r.get('status')==202 else 'HTTP status prevents metadata access'})
   continue
  try:rt=ET.fromstring(body.lstrip())
  except ET.ParseError:continue
  if rt.tag.endswith('urlset') and relevant_map:
   selected=0
   for n in rt:
    u=n.findtext(NS+'loc')
    if u and isarticle(p,u):add(u,url,lastmod=n.findtext(NS+'lastmod'));selected+=1
    else:excluded+=1
   endpoints.append({'url':url,'kind':'sitemap-urlset','declared_entries':len(rt),'selected_entries':selected,'terminal':'finite URL set consumed'})
  elif rt.tag.endswith('sitemapindex') and (relevant_map or rootmap):
   kids=[n.findtext(NS+'loc') for n in rt]
   endpoints.append({'url':url,'kind':'sitemap-index','declared_children':len(kids),'selected_children':[k for k in kids if k and usefulmap(p,k) and not(pid=='jetbrains' and k.endswith(('/team-sitemap.xml','/category-sitemap.xml')))]})
  elif rt.tag.endswith('rss'):
   items=rt.findall('./channel/item');added=0
   for n in items:
    u=n.findtext('link')
    if u and isarticle(p,u):add(u,url,n.findtext('title'),datevalue(n.findtext('pubDate')),evidence='RSS pubDate');added+=1
   endpoints.append({'url':url,'kind':'rss','entries':len(items),'selected_entries':added,'terminal':'finite feed consumed; no historical completeness inferred from feed length'})
  elif rt.tag.endswith('feed'):
   ns='{http://www.w3.org/2005/Atom}';items=rt.findall(ns+'entry');added=0
   for n in items:
    ls=n.findall(ns+'link');u=next((x.get('href') for x in ls if x.get('rel') in ['alternate',None]),None)
    if u and isarticle(p,u):add(u,url,n.findtext(ns+'title'),datevalue(n.findtext(ns+'published')),evidence='Atom published');added+=1
   endpoints.append({'url':url,'kind':'atom','entries':len(items),'selected_entries':added,'terminal':'finite feed consumed; no historical completeness inferred from feed length'})
 if pid=='discord':
  r=next(x for x in logs if x['url']=='https://discord.com/category/engineering');s=BeautifulSoup(textbody(r),'html.parser');items=s.select('.featured-articles-list .w-dyn-item')
  for item in items:
   a=item.select_one('a[href]')
   if a:
    title=a.get('aria-label') or (a.select_one('.text-style-3lines').get_text(' ',strip=True) if a.select_one('.text-style-3lines') else None)
    add(urllib.parse.urljoin(r['url'],a['href']),r['url'],title)
  # Featured elements outside the historical collection may contain newer entries.
  for a in s.select('a.cms_article[href]'):
   node=a.select_one('.text-style-3lines');add(urllib.parse.urljoin(r['url'],a['href']),r['url'],a.get('aria-label') or (node.get_text(' ',strip=True) if node else None))
  endpoints.append({'url':r['url'],'kind':'engineering-category-html','collection_entries':len(items),'selected_entries':len({a.get('href') for a in s.select('a.cms_article[href]')}),'next_links':len(s.select('a.w-pagination-next')),'terminal':'77 finite historical collection rows plus featured entries, no pagination/next link in exposed HTML; whole publisher blog history unproven'})
 # Distinguish exhausted declared sitemap scope from incomplete or narrower surfaces.
 terminal=pid not in ['jetbrains','discord']
 sc='English/root-site blog URLs in the complete relevant official sitemap graph, with feed metadata enrichment.'
 if pid=='jetbrains':sc='All product-section editorial archives declared by JetBrains root sitemap; only successfully accessible child maps and feed retained. Date-path metadata was parsed for YYYY/MM/DD and YYYY/MM paths; day unknown on month-only paths.'
 if pid=='snyk':sc='English/root-site blog plus /articles/ knowledge-center surfaces (the latter was cited by the earlier survey); article/hub subtype not classified.'
 if pid=='discord':sc='Earlier survey engineering category collection and publisher-declared recent RSS; complete whole-blog history is not established.'
 cov={'publisher_id':pid,'publisher_name':p['name'],'index_url':p['index_url'],'scope':sc,'endpoints':endpoints,'pages_or_documents_processed':len(endpoints),'unique_article_count':len(rows),'known_title_count':sum(v['title'] is not None for v in rows.values()),'known_publication_date_count':sum(v['published_at'] is not None for v in rows.values()),'earliest_known_published_at':min((v['published_at'] for v in rows.values() if v['published_at']),default=None),'terminal':{'proven':terminal,'criterion':'all relevant publisher-declared child sitemaps consumed' if terminal else 'not established across full intended archive','qualification':'A sitemap proves exhaustion of publisher-declared discoverability, not every article ever published or article body reading.'},'failures':failures,'exclusions':['localized mirrors','author/category/tag/listing/navigation sitemap URLs','products/docs/press/events','full article bodies from archive enumeration'],'excluded_url_count':excluded,'request_log':[{k:v for k,v in r.items() if k!='cache_path'} for r in logs],'frozen_at':stamp()}
 results.append(cov);allrows.extend(rows.values())
 print(pid,len(rows),'titles',cov['known_title_count'],'dates',cov['known_publication_date_count'],'terminal',terminal,'failures',len(failures))
(BASE/'index.json').write_text(json.dumps({'schema_version':1,'frozen_at':stamp(),'metadata_only':True,'field_semantics':{'canonical_url':'Normalized deduplication uses publisher-declared sitemap/feed/index URLs. Per-entry HTML canonical/redirect checks are not implied.','title':'Exact metadata title when supplied by a feed or listing, null when unavailable; URL slugs are never substituted for titles.','published_at':'Publication date from dated URL or publisher feed; null when unknown. Month-only URL paths do not invent a day.','last_modified_at':'Sitemap modification date, kept separate from publication.','body_read':'False for metadata enumeration; selected source cards separately record reading scope.'},'records':sorted(allrows,key=lambda x:(x['publisher_id'],x['canonical_url']))},indent=2)+'\n')
(BASE/'coverage.json').write_text(json.dumps({'schema_version':1,'frozen_at':stamp(),'request_policy':{'per_host_minimum_interval_seconds':1.05,'connect_timeout_seconds':5,'read_timeout_seconds':20,'access_challenges_bypassed':False,'repository_article_body_storage':False},'publishers':results},indent=2)+'\n')
