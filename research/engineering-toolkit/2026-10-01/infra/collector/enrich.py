"""Read archive pagination metadata; article bodies are not persisted."""
import sys,json,re,concurrent.futures,html
from urllib.parse import urljoin,urlparse
from bs4 import BeautifulSoup
from harvest import fetch,ROOT,LOG

def record(pub,url,title=None,date=None,endpoint=None):
 return {'publisher_id':pub,'url':url,'title':html.unescape(title) if title else None,'slug':urlparse(url).path.strip('/').split('/')[-1],'published_at':date,'last_modified_at':None,'discovery_endpoint':endpoint,'metadata_source':'official archive metadata','read_status':'indexed_not_read'}
def dictionaries(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from dictionaries(v)
 elif isinstance(x,list):
  for v in x:yield from dictionaries(v)
def jsonld(s):
 for e in s.find_all('script',type='application/ld+json'):
  try:yield from dictionaries(json.loads(e.string or e.get_text()))
  except Exception:pass
def honeycomb():
 pages=[]; entries={}; errors=[]; terminal=None
 for page in range(1,33):
  u='https://www.honeycomb.io/blog'+('' if page==1 else '?page='+str(page))
  t,r=fetch(u);pages.append(r)
  if r.get('status')!=200:errors.append(r);continue
  s=BeautifulSoup(t,'html.parser');found=0
  for sc in s.find_all('script'):
   text=sc.string or ''
   m=re.search(r'self\.__next_f\.push\((\[.*\])\)',text,re.S)
   if not m:continue
   try:flight=json.loads(m.group(1))[1]
   except Exception:continue
   for b in re.finditer(r'"blogPosts":',flight):
    try:posts=json.JSONDecoder().raw_decode(flight[b.end():])[0]
    except Exception:continue
    for post in posts:
     if not isinstance(post,dict) or not post.get('slug'):continue
     slug=post['slug'];slug=slug['current'] if isinstance(slug,dict) else slug
     url='https://www.honeycomb.io/blog/'+slug
     title=post.get('title');date=post.get('publishedAt')
     entries[url]=record('honeycomb',url,title,date,u);found+=1
  nxt=any(a.get('href')=='?page='+str(page+1) for a in s.find_all('a',href=True))
  pages[-1].update({'page_number':page,'article_metadata_rows':found,'next_page_present':nxt})
  if not nxt:terminal={'page':page,'reason':'no link to next page','url':u};break
 out={'publisher_id':'honeycomb','pages':pages,'errors':errors,'terminal':terminal,'entries':list(entries.values())}
 (ROOT/'honeycomb-archive.json').write_text(json.dumps(out,indent=2));print('honeycomb',len(entries),terminal,flush=True)
 return out
def grafana():
 pages=[];entries={};errors=[];terminal=None
 for page in range(1,103):
  u='https://grafana.com/blog/'+('' if page==1 else '?page='+str(page))
  t,r=fetch(u);pages.append(r)
  if r.get('status')!=200:errors.append(r);continue
  s=BeautifulSoup(t,'html.parser');found=0
  for d in jsonld(s):
   if d.get('@type')!='BlogPosting':continue
   url=d.get('url') or d.get('@id')
   if not url:continue
   url=url.replace('https://grafana.comblog/','https://grafana.com/blog/')
   entries[url]=record('grafana-labs',url,d.get('headline'),d.get('datePublished'),u);found+=1
  nxt=any('page='+str(page+1)+'#all-posts' in a.get('href','') for a in s.find_all('a',href=True))
  pages[-1].update({'page_number':page,'article_metadata_rows':found,'next_page_present':nxt})
  if not nxt:terminal={'page':page,'reason':'no link to next page','url':u};break
 out={'publisher_id':'grafana-labs','pages':pages,'errors':errors,'terminal':terminal,'entries':list(entries.values())}
 (ROOT/'grafana-archive.json').write_text(json.dumps(out,indent=2));print('grafana-labs',len(entries),terminal,flush=True)
 return out
def microsoft():
 pages=[];entries={};errors=[];terminal=None
 for page in range(1,10):
  u='https://devblogs.microsoft.com/engineering-at-microsoft/wp-json/wp/v2/posts?per_page=100&_fields=link,title,date,modified,slug&page='+str(page)
  t,r=fetch(u);pages.append(r)
  try:d=json.loads(t)
  except Exception:errors.append(r);break
  if isinstance(d,dict) and d.get('code')=='rest_post_invalid_page_number':terminal={'page':page,'url':u,'reason':d['code']};break
  if r.get('status')!=200 or not isinstance(d,list):errors.append(r);break
  for x in d:
   entries[x['link']]=record('microsoft',x['link'],x['title']['rendered'],x['date'],u)
   entries[x['link']]['last_modified_at']=x['modified']
  pages[-1].update({'page_number':page,'article_metadata_rows':len(d)})
  if not d:terminal={'page':page,'url':u,'reason':'empty metadata page'};break
 out={'publisher_id':'microsoft','pages':pages,'errors':errors,'terminal':terminal,'entries':list(entries.values())}
 (ROOT/'microsoft-api.json').write_text(json.dumps(out,indent=2));print('microsoft',len(entries),terminal,flush=True)
 return out
def fly():
 pages=[];entries={};errors=[];u='https://fly.io/blog/'
 t,r=fetch(u);pages.append(r);s=BeautifulSoup(t,'html.parser')
 for a in s.find_all('article'):
  link=next((x for x in a.find_all('a',href=True) if x['href'].startswith('/blog/')),None)
  title=a.find(['h1','h2','h3']);date=a.find('time')
  if link:entries[urljoin(u,link['href'])]=record('fly-io',urljoin(u,link['href']),title.get_text(' ',strip=True) if title else None,date.get('datetime') if date else None,u)
 feed='https://fly.io/blog/feed.xml';t,r=fetch(feed);pages.append(r)
 from xml.etree import ElementTree as ET
 try:
  tree=ET.fromstring(t)
  for x in tree.findall('./channel/item'):
   url=x.findtext('link');title=x.findtext('title');date=x.findtext('pubDate')
   if url:entries[url]=record('fly-io',url,title,date,feed)
  # Atom alternate
  ns={'a':'http://www.w3.org/2005/Atom'}
  for x in tree.findall('a:entry',ns):
   l=x.find('a:link',ns);url=l.get('href') if l is not None else None
   if url:entries[url]=record('fly-io',url,x.findtext('a:title',namespaces=ns),x.findtext('a:published',namespaces=ns),feed)
 except Exception as e:errors.append({'url':feed,'error':str(e)})
 out={'publisher_id':'fly-io','pages':pages,'errors':errors,'terminal':{'url':u,'reason':'single archive document; no pagination links; feed exhausted'},'entries':list(entries.values())}
 (ROOT/'fly-archive.json').write_text(json.dumps(out,indent=2));print('fly-io',len(entries),flush=True);return out
if __name__=='__main__':
 results=list(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(lambda f:f(),[honeycomb,grafana,microsoft,fly]))
 (ROOT/'enrichment-requests.json').write_text(json.dumps(LOG,indent=2))
