#!/usr/bin/env python3
"""Collect official messaging archive metadata; fetch bodies stay outside the repo."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, threading, time, urllib.parse
import requests
from bs4 import BeautifulSoup

OUT = pathlib.Path(__file__).resolve().parent
TMP = pathlib.Path('/tmp/engineering-toolkit-2026-10-01-messaging')
TMP.mkdir(exist_ok=True)
PUBLISHERS = [
 ('confluent','Confluent','https://www.confluent.io','/blog/'),
 ('temporal','Temporal','https://temporal.io','/blog'),
 ('redpanda','Redpanda','https://www.redpanda.com','/blog'),
 ('streamnative','StreamNative','https://streamnative.io','/blog'),
 ('rabbitmq','RabbitMQ project','https://www.rabbitmq.com','/blog'),
 ('synadia-nats','Synadia / NATS','https://www.synadia.com','/blog'),
 ('estuary','Estuary','https://estuary.dev','/blog/'),
 ('materialize','Materialize','https://materialize.com','/blog/'),
 ('risingwave','RisingWave','https://risingwave.com','/blog/'),
 ('decodable','Decodable','https://www.decodable.co','/blog')]
HOST_LOCKS = {}; LAST = {}; LOCK = threading.Lock()
LOG = []
def fetch(url):
    host=urllib.parse.urlparse(url).netloc
    with LOCK: lock=HOST_LOCKS.setdefault(host,threading.Lock())
    with lock:
        time.sleep(max(0, 1.1-(time.monotonic()-LAST.get(host,0))))
        start=time.monotonic()
        try:
            res=requests.get(url,timeout=(8,20),headers={'User-Agent':'EngineeringToolkitResearch/1.0 (metadata archive survey; bounded polite requests)'})
            body=res.text
            rec={'url':url,'final_url':res.url,'status':res.status_code,'content_type':res.headers.get('content-type'),'bytes':len(res.content),'sha256':hashlib.sha256(res.content).hexdigest(),'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'elapsed_seconds':round(time.monotonic()-start,2)}
        except requests.RequestException as e:
            rec={'url':url,'status':None,'error':str(e),'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};body=''
        LAST[host]=time.monotonic()
        with LOCK:LOG.append(rec)
        (TMP/(hashlib.sha256(url.encode()).hexdigest()+'.txt')).write_text(body)
        return rec,body

def probe(p):
    pid,name,base,blog=p
    result={'id':pid,'name':name,'base':base,'blog':base+blog,'probes':[]}
    rec,body=fetch(base+'/robots.txt');result['probes'].append(rec)
    discovered=re.findall(r'(?im)^sitemap:\s*(\S+)',body)
    result['robots_sitemaps']=discovered
    endpoints=list(dict.fromkeys(discovered+[base+'/sitemap.xml',base+blog,base+blog.rstrip('/')+'/rss.xml',base+blog.rstrip('/')+'/feed/']))
    for url in endpoints:
        rec,body=fetch(url);result['probes'].append(rec)
        if rec.get('status')==200:
            if 'xml' in rec.get('content_type','') or body.lstrip().startswith('<?xml'):
                soup=BeautifulSoup(body,'xml') if False else BeautifulSoup(body,'html.parser')
                result.setdefault('xml',[]).append({'url':url,'root':body[:150], 'loc_count':len(soup.find_all('loc')), 'item_count':len(soup.find_all('item')),'entry_count':len(soup.find_all('entry')),'child_locs':[x.get_text(strip=True) for x in soup.find_all('loc')][:20]})
            if url==base+blog:
                soup=BeautifulSoup(body,'html.parser')
                result['archive_metadata']={'title':soup.title.get_text(strip=True) if soup.title else None,'links':list(dict.fromkeys(a.get('href') for a in soup.find_all('a',href=True) if '/blog' in a.get('href','') or 'rss' in a.get('href','') or 'feed' in a.get('href','')))[:50], 'next_data':bool(soup.find('script',id='__NEXT_DATA__')),'ld_json_count':len(soup.find_all('script',type='application/ld+json'))}
    return result

def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:results=list(ex.map(probe,PUBLISHERS))
    (TMP/'probe-results.json').write_text(json.dumps({'publishers':results,'requests':LOG},indent=2)+'\n')
    for p in results:
        print(p['id'],[(r['url'],r.get('status'),r.get('bytes'),r.get('error','')[:100]) for r in p['probes']]);print('XML',p.get('xml'));print('ARCHIVE',p.get('archive_metadata'))
if __name__=='__main__': main()
