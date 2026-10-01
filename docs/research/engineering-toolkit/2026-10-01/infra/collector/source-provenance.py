"""Record final hashes for deep-read sources and their contract crosschecks."""
import json,concurrent.futures
from harvest import fetch,ROOT,LOG
urls={s['url'] for s in json.loads((ROOT/'deep-design.json').read_text())['sources']}
config=json.loads((ROOT/'config-distribution.json').read_text());urls.add(config['url']);urls.update(s['url'] for s in config['crosschecks'])
old=json.loads((ROOT/'request-provenance.json').read_text());existing={r['url'] for r in old['requests']}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:list(executor.map(fetch,sorted(urls-existing)))
for r in old['requests']:r.setdefault('record_type','final_metadata_endpoint_revalidation')
for r in LOG:r['record_type']='final_deep_source_revalidation'
old['requests'].extend(LOG)
(ROOT/'request-provenance.json').write_text(json.dumps(old,indent=2)+'\n')
print('added',len(LOG),'deep source response hashes; total',len(old['requests']))
