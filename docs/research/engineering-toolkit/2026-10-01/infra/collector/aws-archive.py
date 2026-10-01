"""Enumerate only the public Builders Library tag, never all AWS product blogs."""
import json,re
from datetime import datetime,timezone
from urllib.parse import urlencode,urljoin
from harvest import fetch,ROOT,LOG
from enrich import record
entries={};pages=[];errors=[];terminal=None;cursor=None;seen=set()
for page in range(1,501):
 params={'tag':'builders-library','pageSize':100}
 if cursor:params['cursor']=cursor
 u='https://api.builder.aws.com/cs/v2/tag/articles?'+urlencode(params)
 t,r=fetch(u);pages.append(r)
 try:d=json.loads(t)
 except Exception:errors.append(r);break
 if r.get('status')!=200 or not isinstance(d,dict) or 'articles' not in d:errors.append({'request':r,'response_keys':list(d) if isinstance(d,dict) else None});break
 for a in d['articles']:
  url=urljoin('https://builder.aws.com',a['uri']);e=record('aws',url,a.get('title'),None,u)
  e['metadata_source']='public Builder Center Builders Library tag API';e['locale']=a.get('locale')
  e['collection_published_at']=datetime.fromtimestamp(a['lastPublishedAt']/1000,timezone.utc).isoformat() if a.get('lastPublishedAt') else None
  e['last_modified_at']=datetime.fromtimestamp(a['lastModifiedAt']/1000,timezone.utc).isoformat() if a.get('lastModifiedAt') else None
  e['collection_tags']=a.get('tags');e['author_name']=a.get('author',{}).get('preferredName');e['publisher_affiliation_evidence']={k:a.get('author',{}).get(k) for k in ['isAmazonEmployee','isAmazonThoughtLeader']}
  entries[url]=e
 cursor=d.get('cursor');pages[-1].update({'page_number':page,'article_metadata_rows':len(d['articles']),'reported_results_size':d.get('resultsSize'),'cursor_present':bool(cursor)})
 if not cursor:terminal={'page':page,'reason':'response cursor absent/empty','url':u};break
 if cursor in seen:errors.append({'url':u,'error':'repeated cursor'});break
 seen.add(cursor)
out={'publisher_id':'aws','pages':pages,'errors':errors,'terminal':terminal,'entries':list(entries.values()),'date_caveat':'Builder Center lastPublishedAt dates describe migrated/current collection publication. Original article publication dates are not established by this API.'}
(ROOT/'aws-archive.json').write_text(json.dumps(out,indent=2));(ROOT/'aws-archive-requests.json').write_text(json.dumps(LOG,indent=2));print('aws',len(entries),terminal,'errors',errors,flush=True)
