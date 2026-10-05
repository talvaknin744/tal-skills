"""Exhaust Google Research blog pagination, retaining metadata only."""
import json,re
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from harvest import fetch,ROOT,LOG
from enrich import record
entries={};pages=[];errors=[];terminal=None;max_page=135
for page in range(1,max_page+1):
 u='https://research.google/blog/'+('' if page==1 else '?page='+str(page))
 t,r=fetch(u);pages.append(r)
 if r.get('status')!=200:errors.append(r);continue
 s=BeautifulSoup(t,'html.parser');cards=s.select('a.glue-card--blog');found=0
 for a in cards:
  url=urljoin(u,a['href']);title=a.select_one('.headline-6');date=a.select_one('.glue-card__eyebrow')
  date=date.get_text(' ',strip=True) if date else None
  try:date=datetime.strptime(date,'%B %d, %Y').date().isoformat()
  except Exception:pass
  entries[url]=record('google',url,title.get_text(' ',strip=True) if title else None,date,u);found+=1
 nxt=any(a.get('data-page')==str(page+1) and a.get('aria-disabled')!='true' for a in s.find_all('a',attrs={'data-page':True}))
 pages[-1].update({'page_number':page,'article_metadata_rows':found,'next_page_present':nxt})
 if page%30==0:print('google page',page,'rows',len(entries),flush=True)
 if not nxt:terminal={'page':page,'reason':'no active next page link','url':u};break
out={'publisher_id':'google','pages':pages,'errors':errors,'terminal':terminal,'entries':list(entries.values())}
(ROOT/'google-archive.json').write_text(json.dumps(out,indent=2));(ROOT/'google-archive-requests.json').write_text(json.dumps(LOG,indent=2));print('google',len(entries),terminal,flush=True)
