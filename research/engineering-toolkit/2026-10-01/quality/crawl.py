#!/usr/bin/env python3
import concurrent.futures,json,hashlib,pathlib,re,sys,xml.etree.ElementTree as ET
import urllib.parse
from enumerate import BASE,CACHE,PUBLISHERS,fetch,stamp
NS='{http://www.sitemaps.org/schemas/sitemap/0.9}'
def parsed(body): return ET.fromstring(body.lstrip())
def load_body(rec):return pathlib.Path(rec['cache_path']).read_bytes() if 'cache_path' in rec else b''
def usefulmap(pub,url):
 pid=pub['id']; path=urllib.parse.urlparse(url).path
 if pid=='docker': return bool(re.fullmatch(r'/post-sitemap\d*\.xml',path))
 if pid=='gitlab':return path=='/blog.xml'
 if pid=='snyk':return path in ['/sitemaps/sitemap-blogs.xml','/sitemaps/sitemap-articles.xml']
 if pid=='discord':return path in ['/sitemap.xml','/sitemap_index.xml']
 if pid=='elastic':return path=='/sitemap.xml'
 return True

def article(pub,url):
 pid=pub['id']; p=urllib.parse.urlparse(url).path
 if pid=='jetbrains':return bool(re.search(r'/\d{4}/\d{2}/[^/]+/?$',p))
 if pid=='docker':return bool(re.fullmatch(r'/blog/[^/]+/?',p))
 if pid=='sentry':return p not in ['/','/engineering/'] and not p.startswith(('/authors/','/categories/','/tags/','/category/','/tag/','/search/','/page/')) and len([x for x in p.split('/') if x])==1
 if pid in ['posthog','tailscale']: return bool(re.fullmatch(r'/blog/[^/]+/?',p))
 if pid=='gitlab':return bool(re.fullmatch(r'/blog/[^/]+/?',p)) or bool(re.search(r'/blog/\d{4}/\d{2}/\d{2}/[^/]+/?$',p))
 if pid=='snyk':return bool(re.fullmatch(r'/blog/[^/]+/?',p)) or p.startswith('/articles/') and p!='/articles/'
 if pid=='trail-of-bits':return bool(re.fullmatch(r'/\d{4}/\d{2}/\d{2}/[^/]+/?',p))
 if pid in ['elastic','discord']:return bool(re.fullmatch(r'/blog/[^/]+/?',p))
 return False

def crawl(pub,probe):
 pid=pub['id']; log=probe['requests']; records={}; maps=[]; failures=[]; excluded=0
 roots={x['url']:x for x in log}
 todo=[]
 for url in probe['declared_sitemaps']:
  if usefulmap(pub,url):todo.append(url)
 if pid=='discord':todo=['https://discord.com/sitemap.xml']
 seen=set()
 while todo:
  url=todo.pop(0)
  if url in seen:continue
  seen.add(url)
  if url in roots: rec=roots[url]; body=load_body(rec)
  else:rec,body=fetch(url);log.append(rec)
  if rec.get('status')!=200:
   failures.append({'endpoint':url,'status':rec.get('status'),'failure':rec.get('failure')});continue
  try:root=parsed(body)
  except ET.ParseError as e: failures.append({'endpoint':url,'failure':'Non XML: '+str(e)});continue
  if root.tag.endswith('sitemapindex'):
   children=[n.findtext(NS+'loc') for n in root]
   for child in children:
    if child and usefulmap(pub,child):todo.append(child)
   maps.append({'url':url,'type':'sitemapindex','declared_children':len(children),'selected_children':sum(bool(c and usefulmap(pub,c)) for c in children)})
  elif root.tag.endswith('urlset'):
   chosen=0
   for n in root:
    loc=n.findtext(NS+'loc')
    if not loc:continue
    if not article(pub,loc):excluded+=1;continue
    chosen+=1
    last=n.findtext(NS+'lastmod')
    dates=re.search(r'/(\d{4})/(\d{2})/(\d{2})/',loc)
    date='-'.join(dates.groups()) if dates else None
    records[loc]={'publisher_id':pid,'canonical_url':loc,'canonical_evidence':'publisher-declared sitemap URL; HTML canonical not checked for every entry','title':None,'title_status':'not supplied by sitemap','published_at':date,'published_at_evidence':'URL date path' if date else None,'last_modified_at':last,'discovered_at':stamp(),'metadata_sources':[url],'body_read':False}
   maps.append({'url':url,'type':'urlset','declared_entries':len(root),'selected_article_entries':chosen})
  print(pid,'map',len(maps),'articles',len(records),'remaining',len(todo),flush=True)
 dates=[r['published_at'] for r in records.values() if r['published_at']]
 coverage={'publisher_id':pid,'publisher_name':pub['name'],'index_url':pub['index_url'],'scope':'English/root-site blog articles declared in selected official sitemaps; Snyk also includes articles/ because prior survey cited that surface. JetBrains includes all product-section editorial archives.','archive_method':'finite robots-declared sitemap graph','endpoints':maps,'request_log':log,'unique_article_count':len(records),'earliest_known_published_at':min(dates) if dates else None,'unknown_publication_date_count':sum(r['published_at'] is None for r in records.values()),'unknown_title_count':len(records),'terminal':{'proven':not failures,'criterion':'every relevant child sitemap declared by selected root(s) was consumed; URL sets are finite terminal endpoints','processed_sitemap_count':len(maps),'remaining_queue_count':len(todo),'qualification':'sitemap exhaustiveness is publisher-declared discoverability, not proof every historically published article remains indexed'},'failures':failures,'exclusions':['localized mirrors','author/category/tag/listing/navigation URLs','non-blog products/docs/press/events pages','article body reading from metadata enumeration'],'excluded_url_count':excluded,'frozen_at':stamp()}
 (BASE/(pid+'.index.json')).write_text(json.dumps({'publisher_id':pid,'records':list(records.values())},indent=2)+'\n')
 (BASE/(pid+'.coverage.json')).write_text(json.dumps(coverage,indent=2)+'\n')
 return coverage

def main():
 probes=json.loads((BASE/'probes.json').read_text())['publishers']; probe_by={x['publisher_id']:x for x in probes}
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool: results=list(pool.map(lambda p:crawl(p,probe_by[p['id']]),PUBLISHERS))
 all_records=[]
 for pub in PUBLISHERS: all_records.extend(json.loads((BASE/(pub['id']+'.index.json')).read_text())['records'])
 (BASE/'index.json').write_text(json.dumps({'schema_version':1,'frozen_at':stamp(),'metadata_only':True,'records':all_records},indent=2)+'\n')
 (BASE/'coverage.json').write_text(json.dumps({'schema_version':1,'frozen_at':stamp(),'publishers':results},indent=2)+'\n')
if __name__=='__main__':main()
