#!/usr/bin/env python3
"""Official archive metadata enumeration. Bodies cached only in /tmp, never in repo."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, threading, time
import urllib.parse, xml.etree.ElementTree as ET
import requests
BASE=pathlib.Path(__file__).parent
CACHE=pathlib.Path('/tmp/engineering-toolkit-quality-20261001'); CACHE.mkdir(exist_ok=True)
PUBLISHERS=json.loads((BASE.parents[1]/'publisher-survey.json').read_text())['publishers'][40:50]
LOCKS={}; LAST={}; GLOBAL=threading.Lock()
UA='EngineeringArchiveResearch/1.0 (bounded metadata archive enumeration)'
def stamp(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def fetch(url):
 host=urllib.parse.urlparse(url).netloc
 with GLOBAL: lock=LOCKS.setdefault(host,threading.Lock())
 with lock:
  time.sleep(max(0,1.05-(time.monotonic()-LAST.get(host,0))))
  LAST[host]=time.monotonic()
  rec={'url':url,'accessed_at':stamp()}
  try:
   r=requests.get(url,headers={'User-Agent':UA},timeout=(5,20),allow_redirects=False)
   rec.update(status=r.status_code,final_url=r.url,content_type=r.headers.get('content-type',''),bytes=len(r.content),sha256=hashlib.sha256(r.content).hexdigest())
   path=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.body'); path.write_bytes(r.content)
   rec['cache_path']=str(path)
   return rec,r.content
  except requests.RequestException as e:
   rec['failure']=str(e)[:500]; return rec,b''
def probe(pub):
 origin=urllib.parse.urlunparse((*urllib.parse.urlparse(pub['index_url'])[:2],'','','',''))
 requests_done=[]
 rec,body=fetch(origin+'/robots.txt'); requests_done.append(rec)
 maps=re.findall(rb'(?im)^sitemap:\s*(\S+)',body)
 maps=[x.decode() for x in maps]
 if not maps: maps=[origin+'/sitemap.xml']
 for url in maps:
  rec,body=fetch(url); requests_done.append(rec)
  try:
   root=ET.fromstring(body)
   print(pub['id'],url,root.tag,len(root),[x.text for x in root.iter() if x.tag.endswith('loc')][:15],flush=True)
  except ET.ParseError: print(pub['id'],url,rec.get('status'),rec.get('content_type'),body[:80],flush=True)
 return {'publisher_id':pub['id'],'index_url':pub['index_url'],'declared_sitemaps':maps,'requests':requests_done}
def main():
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool: results=list(pool.map(probe,PUBLISHERS))
 (BASE/'probes.json').write_text(json.dumps({'frozen_at':stamp(),'policy':{'per_host_minimum_interval_seconds':1.05,'connect_timeout_seconds':5,'read_timeout_seconds':20,'article_bodies_in_repository':False},'publishers':results},indent=2)+'\n')
if __name__=='__main__':main()
