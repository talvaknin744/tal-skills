"""Supplement official feeds and six article metadata pages; no body persistence."""
import json
from xml.etree import ElementTree as E
from bs4 import BeautifulSoup
from harvest import fetch,ROOT,LOG
from enrich import record,jsonld
feeds=[]
for u in ['https://www.datadoghq.com/blog/engineering/index.xml','https://www.fastly.com/blog_rss.xml','https://blog.cloudflare.com/rss/','https://www.hashicorp.com/blog/feed.xml']:
 t,r=fetch(u);out={'request':r,'entries':[],'kind':'feed'}
 try:
  root=E.fromstring(t)
  for it in root.findall('./channel/item'):out['entries'].append({'url':it.findtext('link'),'title':it.findtext('title'),'published_at':it.findtext('pubDate')})
  ns={'a':'http://www.w3.org/2005/Atom'}
  for it in root.findall('a:entry',ns):
   l=it.find('a:link',ns);out['entries'].append({'url':l.get('href') if l is not None else None,'title':it.findtext('a:title',namespaces=ns),'published_at':it.findtext('a:published',namespaces=ns)})
 except Exception as e:out['error']=str(e)
 feeds.append(out)
(ROOT/'feeds.json').write_text(json.dumps(feeds,indent=2))
checks=[]
for pub,u in [('fly-io','https://fly.io/blog/welcome-to-fly/'),('fly-io','https://fly.io/blog/anycast-on-easy-mode/'),('fly-io','https://fly.io/blog/low-latency-liveview/'),('fly-io','https://fly.io/blog/the-region-consolidation-project/'),('datadog','https://www.datadoghq.com/blog/engineering/consul-at-datadog/'),('datadog','https://www.datadoghq.com/blog/engineering/releasing-czlib-and-zstd-go-bindings/')]:
 t,r=fetch(u);s=BeautifulSoup(t,'html.parser');title=s.find('meta',attrs={'property':'og:title'});date=s.find('meta',attrs={'property':'article:published_time'});date=date.get('content') if date else None;canonical=s.find('link',rel='canonical')
 for d in jsonld(s):
  if d.get('@type') in ['BlogPosting','Article'] and d.get('datePublished'):date=d['datePublished']
 if not date:
  ti=s.find('time');date=ti.get('datetime') if ti else None
 checks.append({'request':r,'entry':record(pub,canonical.get('href') if canonical else u,title.get('content') if title else None,date,u)})
(ROOT/'article-metadata-checks.json').write_text(json.dumps(checks,indent=2));(ROOT/'metadata-requests.json').write_text(json.dumps(LOG,indent=2))
