"""Metadata-only official archive enumeration. Never persists fetched article bodies."""
import requests, concurrent.futures, time, threading, json, re, sys, hashlib
from datetime import datetime, timezone
from urllib.parse import urlparse,urljoin
from pathlib import Path
from bs4 import BeautifulSoup
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
S=requests.Session(); S.headers['User-Agent']='EngineeringResearchMetadata/1.0 (public archive enumeration; no article republication)'
LOCK=threading.Lock(); LAST={}; LOG=[]
def fetch(url):
    host=urlparse(url).netloc
    with LOCK:
        delay=max(0,1.05-(time.monotonic()-LAST.get(host,0)))
        LAST[host]=time.monotonic()+delay
    if delay:time.sleep(delay)
    started=time.monotonic()
    try:
        r=S.get(url,timeout=(8,25))
        rec={'url':url,'final_url':r.url,'status':r.status_code,'bytes':len(r.content),'seconds':round(time.monotonic()-started,3),'content_type':r.headers.get('Content-Type'),'accessed_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(r.content).hexdigest()}
        with LOCK: LOG.append(rec)
        return r.text,rec
    except Exception as e:
        rec={'url':url,'error':type(e).__name__+': '+str(e),'seconds':round(time.monotonic()-started,3),'accessed_at':datetime.now(timezone.utc).isoformat(),'sha256':None}
        with LOCK: LOG.append(rec)
        return '',rec
PUBS=[('aws','https://builder.aws.com'),('google','https://research.google'),('microsoft','https://devblogs.microsoft.com'),('cloudflare','https://blog.cloudflare.com'),('fastly','https://www.fastly.com'),('datadog','https://www.datadoghq.com'),('grafana-labs','https://grafana.com'),('honeycomb','https://www.honeycomb.io'),('hashicorp','https://www.hashicorp.com'),('fly-io','https://fly.io')]
def probe(pub):
    key,base=pub
    out={'id':key,'base':base,'probes':[]}
    for path in ['/robots.txt','/sitemap.xml']:
        txt,rec=fetch(base+path)
        sm=re.findall(r'(?im)^sitemap:\s*(\S+)',txt) if path.endswith('txt') else re.findall(r'<loc>(.*?)</loc>',txt)[:80]
        out['probes'].append({'request':rec,'links':sm,'snippet':txt[:700] if not sm else None})
    return out
if __name__=='__main__':
    result=list(concurrent.futures.ThreadPoolExecutor(max_workers=10).map(probe,PUBS))
    (ROOT/'endpoint-probes.json').write_text(json.dumps(result,indent=2))
    (ROOT/'requests.json').write_text(json.dumps(LOG,indent=2))
    for p in result:print(json.dumps(p))
