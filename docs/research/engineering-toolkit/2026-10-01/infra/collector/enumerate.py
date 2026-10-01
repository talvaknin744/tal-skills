"""Walk declared official sitemaps and persist canonical metadata only."""
import json,re,concurrent.futures
from urllib.parse import urlparse,unquote
from xml.etree import ElementTree as ET
from harvest import fetch,ROOT,LOG
NS={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
JOBS={
'aws':'https://builder.aws.com/sitemaps/sitemap.xml',
'google':'https://research.google/sitemap_main.xml',
'microsoft':'https://devblogs.microsoft.com/engineering-at-microsoft/sitemap.xml',
'cloudflare':'https://blog.cloudflare.com/sitemap-posts.xml',
'fastly':'https://www.fastly.com/sitemap/sitemap-index.xml',
'datadog':'https://www.datadoghq.com/en/sitemap.xml',
'grafana-labs':'https://grafana.com/en/sitemap.xml',
'honeycomb':'https://www.honeycomb.io/sitemap/blog-articles/0.xml',
'hashicorp':'https://www.hashicorp.com/sitemap.xml',
'fly-io':'https://fly.io/sitemap-landing.xml'}
def include(key,url):
 p=urlparse(url).path
 if key=='aws':return '/content/' in p
 if key=='google':return p.startswith('/blog/') and p!='/blog/'
 if key=='microsoft':return p.startswith('/engineering-at-microsoft/') and not any(x in p for x in ['/tag/','/category/','/author/','/page/','/feed','sitemap']) and p!='/engineering-at-microsoft/'
 if key=='cloudflare':return not any(p.startswith('/'+x+'/') for x in ['de-de','es-es','fr-fr','it-it','ja-jp','ko-kr','pt-br','zh-cn','zh-tw']) and len(p.strip('/').split('/'))==1
 if key=='fastly':return p.startswith('/blog/') and len(p.strip('/').split('/'))==2
 if key=='datadog':return p.startswith('/blog/engineering/') and p!='/blog/engineering/'
 if key=='grafana-labs':return p.startswith('/blog/') and p!='/blog/' and not '/tags/' in p and not '/categories/' in p
 if key=='honeycomb':return p.startswith('/blog/') and p!='/blog/'
 if key=='hashicorp':return p.startswith('/en/blog/') and len(p.strip('/').split('/'))==3 and p not in ['/en/blog/all']
 if key=='fly-io':return p.startswith('/blog/') and p!='/blog/'
 return False
def walk(key,root):
 queue=[root]; seen=set(); entries={}; pages=[]; errors=[]
 while queue:
  url=queue.pop(0)
  if url in seen:continue
  seen.add(url);txt,rec=fetch(url);pages.append(rec)
  if rec.get('status')!=200:errors.append(rec);continue
  try:tree=ET.fromstring(txt)
  except Exception as e:errors.append({'url':url,'error':'not valid XML: '+str(e)});continue
  kind=tree.tag.split('}')[-1]
  if kind=='sitemapindex':
   links=[e.text for e in tree.findall('sm:sitemap/sm:loc',NS)]
   # Restrict known large site indexes to the original publication collection.
   if key=='microsoft':links=[u for u in links if 'post-sitemap' in u]
   queue.extend(links)
  elif kind=='urlset':
   for e in tree.findall('sm:url',NS):
    loc=e.find('sm:loc',NS);mod=e.find('sm:lastmod',NS)
    if loc is None or not include(key,loc.text):continue
    canonical=loc.text.split('#')[0]
    slug=unquote(urlparse(canonical).path.rstrip('/').split('/')[-1])
    entries[canonical]={'publisher_id':key,'url':canonical,'title':None,'slug':slug,'published_at':None,'last_modified_at':mod.text if mod is not None else None,'discovery_endpoint':url,'metadata_source':'official sitemap','read_status':'indexed_not_read'}
  else:errors.append({'url':url,'error':'unexpected XML root '+kind})
 out={'publisher_id':key,'root_endpoint':root,'archive_pages':pages,'metadata_count':len(entries),'terminal_status':'all declared child sitemap pages exhausted' if not errors else 'declared archive traversal has gaps','errors':errors,'entries':list(entries.values())}
 (ROOT/(key+'-sitemap.json')).write_text(json.dumps(out,indent=2))
 print(json.dumps({k:v for k,v in out.items() if k!='entries'}),flush=True)
 return out
if __name__=='__main__':
 results=list(concurrent.futures.ThreadPoolExecutor(max_workers=10).map(lambda kv:walk(*kv),JOBS.items()))
 (ROOT/'sitemap-results.json').write_text(json.dumps(results,indent=2))
 (ROOT/'enumeration-requests.json').write_text(json.dumps(LOG,indent=2))
