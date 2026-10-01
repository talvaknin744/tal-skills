"""Hash final public source responses without persisting bodies; rate limit per host."""
import json,concurrent.futures
from collections import defaultdict
from urllib.parse import urlparse
from harvest import fetch,ROOT,LOG
urls=set()
def scan(x):
 if isinstance(x,dict):
  if isinstance(x.get('url'),str) and any(k in x for k in ['status','error','seconds']) and x['url'].startswith('https://'):urls.add(x['url'])
  for v in x.values():scan(v)
 elif isinstance(x,list):
  for v in x:scan(v)
for path in ROOT.glob('*.json'):
 if path.name=='index.json':continue
 try:scan(json.loads(path.read_text()))
 except Exception:pass
byhost=defaultdict(list)
for u in sorted(urls):byhost[urlparse(u).netloc].append(u)
def hostrun(item):
 host,us=item
 for u in us:fetch(u)
 print(host,len(us),'responses revalidated',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:list(executor.map(hostrun,byhost.items()))
(ROOT/'request-provenance.json').write_text(json.dumps({'scope':'Final response revalidation; earlier probe hashes were not recorded and are not reconstructed. Bodies were parsed transiently and discarded.','requests':LOG},indent=2)+'\n')
print('total',len(LOG),flush=True)
