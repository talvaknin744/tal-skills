"""Freeze deduplicated metadata and scoped coverage; no article bodies retained."""
import json,re,hashlib
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse
from email.utils import parsedate_to_datetime
ROOT=Path(__file__).resolve().parent.parent
REPO=ROOT.parents[4]
def read(name):return json.loads((ROOT/name).read_text()) if (ROOT/name).exists() else []
def key(url):
 p=urlparse(url);host=p.netloc.lower().removeprefix('www.')
 path=p.path.rstrip('/')
 if host=='hashicorp.com' and path.startswith('/blog/'):path='/en'+path
 return 'https://'+host+path

def dateiso(v):
 if not v:return None
 try:return parsedate_to_datetime(v).isoformat()
 except Exception:return v
PUBLISHERS=json.loads((REPO/'docs/research/engineering-toolkit/publisher-survey.json').read_text())['publishers'][20:30]
sm={p['id']:read(p['id']+'-sitemap.json') for p in PUBLISHERS}
archive_names={'aws':'aws-archive.json','google':'google-archive.json','microsoft':'microsoft-api.json','grafana-labs':'grafana-archive.json','honeycomb':'honeycomb-archive.json','fly-io':'fly-archive.json'}
archives={p:read(n) for p,n in archive_names.items()}
feeds=read('feeds.json');checks=read('article-metadata-checks.json')
index={};exclusions={}
def add(e,kind,archive_member=True):
 u=e.get('url')
 if not u:return
 k=key(u)
 if k not in index:index[k]={**{f:e.get(f) for f in ['publisher_id','url','title','slug','published_at','last_modified_at','collection_published_at','locale','metadata_source','read_scope'] if f in e},'read_status':'indexed_not_read','archive_member':archive_member,'discovery_evidence':[],'aliases':[]}
 old=index[k]
 if u!=old['url'] and u not in old['aliases']:old['aliases'].append(u)
 for field in ['title','published_at','last_modified_at','collection_published_at','locale']:
  if e.get(field):old[field]=dateiso(e[field]) if field=='published_at' else e[field]
 endpoint=e.get('discovery_endpoint')
 ev={'url':endpoint,'kind':kind}
 if endpoint and ev not in old['discovery_evidence']:old['discovery_evidence'].append(ev)
 old['archive_member']=old['archive_member'] or archive_member
for pub,d in sm.items():
 es=d['entries'];kept=[];dropped=[]
 for e in es:
  depth=len(urlparse(e['url']).path.strip('/').split('/'))
  if (pub=='fastly' and depth!=2) or (pub=='hashicorp' and depth!=3):dropped.append(e['url']);continue
  kept.append(e);add(e,'official sitemap')
 exclusions[pub]=dropped;d['entries']=kept;d['metadata_count']=len(kept)
for pub,d in archives.items():
 for e in d['entries']:add(e,'official paginated archive / feed / metadata API')
for d in feeds:
 u=d['request']['url']
 pub='datadog' if 'datadoghq' in u else 'fastly' if 'fastly' in u else 'cloudflare' if 'cloudflare' in u else 'hashicorp' if 'hashicorp' in u else None
 if not pub:continue
 for e in d.get('entries',[]):
  e={**e,'publisher_id':pub,'discovery_endpoint':u,'metadata_source':'official feed'}
  # Feeds sometimes use legacy paths; merge only known scoped sitemap members.
  if key(e['url']) in index:add(e,'official limited feed')
for d in checks:
 if d['request'].get('status')==200:add(d['entry'],'article metadata only; body not read')
new=read('deep-design.json');new_articles=[]
for a in new['articles']:
 source=next(s for s in new['sources'] if s['id']==a['read_scope_ref'])
 pub={'AWS':'aws','Google Cloud':'google','Grafana Labs':'grafana-labs'}[a['publisher']]
 e={'publisher_id':pub,'url':source['url'],'title':source['title'],'published_at':a['published_at'],'last_modified_at':None,'discovery_endpoint':source['url'],'read_scope':source['read_scope'],'metadata_source':'new deep read','slug':urlparse(source['url']).path.rstrip('/').split('/')[-1]}
 add(e,'new supplemental deep read' if key(e['url']) not in index else 'new deep read',key(e['url']) in index)
 index[key(e['url'])]['read_status']='deep_read';index[key(e['url'])]['read_scope']=source['read_scope'];new_articles.append(e)
config=read('config-distribution.json');add(config,'new deep read',True);index[key(config['url'])]['read_status']='deep_read';index[key(config['url'])]['read_scope']=config['read_scope'];new_articles.append(config)
prior=json.loads((REPO/'docs/research/engineering-toolkit/lanes/infra.json').read_text())['articles']
for a in prior:
 matches=[e for e in index.values() if key(e['url'])==key(a['url']) or (a['publisher_id']=='aws' and e.get('title')==a['title'])]
 for e in matches:
  if e['read_status']!='deep_read':e['read_status']='prior_deep_read';e['prior_record']='docs/research/engineering-toolkit/lanes/infra.json'
  if key(e['url'])!=key(a['url']) and a['url'] not in e['aliases']:e['aliases'].append(a['url'])
  if a.get('published_at') and not e.get('published_at'):e['published_at']=a['published_at']
entries=sorted(index.values(),key=lambda e:(e['publisher_id'],e['url']))
now=datetime.now(timezone.utc).isoformat()
idx={'schema_version':1,'lane':'infrastructure-and-reliability','frozen_at':now,'article_count':len(entries),'archive_member_count':sum(e['archive_member'] for e in entries),'supplemental_deep_read_count':sum(not e['archive_member'] for e in entries),'new_deep_read_count':len(new_articles),'metadata_note':'Indexed metadata is not a body read. null title/publication date means unavailable from harvested metadata. last_modified_at is not publication date. Canonical identity deduplicates www and trailing-slash/HashiCorp legacy-feed variants; source URLs and aliases retained.','articles':entries}
(ROOT/'index.json').write_text(json.dumps(idx,indent=2,ensure_ascii=False)+'\n')
scopes={
'aws':'Current Builders Library tag only. Retain all 30 collection items; four API locale hints are hu/no/et/sv while displayed titles are English. Do not extend to other AWS product or community blogs.',
'google':'Google Research blog only; Google Cloud SLO/cost article is an explicitly supplemental deep read, not archive expansion.',
'microsoft':'Engineering@Microsoft sub-blog only; exclude other Microsoft DevBlogs collections.',
'cloudflare':'English/default Cloudflare Blog article routes in official post sitemap; exclude translated multi-segment routes and author/tag/archive sitemaps.',
'fastly':'English Fastly /blog/{article} routes; exclude author/category/tag directories, translated blog routes and non-blog documentation.',
'datadog':'Datadog /blog/engineering/{article} collection only; exclude other Monitor product/security/AI collections.',
'grafana-labs':'English Grafana /blog/{article} collection; exclude non-blog docs, translated publications and directory pages.',
'honeycomb':'Honeycomb /blog/{article} sitemap plus the public blog archive; retain 37 sitemap-only press-release routes as metadata, not engineering body reads.',
'hashicorp':'HashiCorp /en/blog/{article} English collection only; exclude category/product/tag directories and other locales.',
'fly-io':'Fly /blog/{article} collection; exclude Sprites/blog-adjacent collections and non-blog documentation.'}
limits={
'aws':['API dates describe current/migrated publication in Builder Center, not original historical dates.','Legacy AWS PDFs and current tagged collection are not identical; static-stability PDF is indexed as supplemental.','All other Builder Center monthly article sitemaps intentionally excluded from collection scope.'],
'google':['Deleted/unlisted historical pages cannot be proved from an accessible archive.','Full bodies were not read for archive metadata rows.'],
'microsoft':['The earlier surveyed flaky-test candidate is absent from both the current scoped sitemap and metadata API; absence does not establish deletion reason.'],
'cloudflare':['Post sitemap is a current declared inventory, not proof that removed historical articles were recovered.','Publication dates obtained only from limited feed and prior/new reads.'],
'fastly':['Official sitemap exhausted; public feed contains only 25 recent items. Most titles/publication dates remain unknown; article URLs are not body reads.'],
'datadog':['Engineering RSS has 100 items against 102 scoped sitemap URLs; two additional article metadata pages were checked.'],
'grafana-labs':['Two archive rows have empty publication dates.','Schema @id values omitted the host/path slash; fixed from the official sitemap route for deduplication.'],
'honeycomb':['Blog archive exposes 632 items, versus 669 scoped sitemap routes. The 37 extra routes are press-release-style pages; their bodies and dates were not read.'],
'hashicorp':['robots.txt and /en/blog/all returned Vercel checkpoint HTTP 429. Official sitemap and legacy feed were accessible.','Sitemap gives last modification, not publication history. Legacy Atom feed has 20 items with updated values, not reliable original publication dates.'],
'fly-io':['Single archive document contains 199 items against 202 scoped sitemap routes. Three extra route metadata pages were checked.','Feed provides dates for only 40 recent items; most historical dates remain unknown.']}
cov=[]
for p in PUBLISHERS:
 pub=p['id'];allrows=[e for e in entries if e['publisher_id']==pub and e['archive_member']];dated=[e['published_at'] for e in allrows if e.get('published_at')]
 pages=sm[pub]['archive_pages'][:] if pub!='aws' else []
 if pub in archives:pages+=archives[pub].get('pages',[])
 primary=archives.get(pub,sm[pub]);terminal=primary.get('terminal') or {'reason':primary['terminal_status'],'url':primary.get('root_endpoint')}
 status='terminal_reached_metadata_archive' if pub in archives else 'terminal_reached_declared_sitemap_only'
 cov.append({'publisher_id':pub,'name':p['name'],'surveyed_index_url':p['index_url'],'scope':scopes[pub],'status':status,'metadata_article_count':len(allrows),'metadata_title_count':sum(bool(e.get('title')) for e in allrows),'publication_date_count':len(dated),'earliest_observed_publication_date':min(dated) if dated else None,'earliest_archive_publication_date':min(dated) if dated and len(dated)==len(allrows) else None,'date_coverage':'all indexed archive rows' if len(dated)==len(allrows) else 'partial or unavailable; earliest observed is not a claim of oldest publication','earliest_collection_publication_date':min((e['collection_published_at'] for e in allrows if e.get('collection_published_at')),default=None),'archive_page_count':len(pages),'archive_pages':pages,'terminal':terminal,'new_deep_reads':[a['url'] for a in new_articles if a['publisher_id']==pub],'excluded_directory_url_count':len(exclusions[pub]),'excluded_directory_urls':exclusions[pub],'limits':limits[pub],'failed_archive_requests':primary.get('errors',[])})
probes=[]
for p in read('endpoint-probes.json'):
 for d in p['probes']:
  r=d['request']
  if r.get('status') not in [200,None] or r.get('error'):probes.append({'publisher_id':p['id'],**r})
for name in ['aws-feed-probe.json','aws-content-feed-probes.json','aws-legacy-tag.json']:
 d=read(name);ds=d if isinstance(d,list) else [d]
 for item in ds:
  r=item.get('request',{})
  if r.get('status') not in [200,None]:probes.append({'publisher_id':'aws',**r,'error_message':item.get('error')})
coverage={'schema_version':1,'lane':'infrastructure-and-reliability','frozen_at':now,'original_survey_record':'docs/research/engineering-toolkit/publisher-survey.json publishers[20:30]','publisher_count':10,'metadata_archive_articles':idx['archive_member_count'],'supplemental_deep_read_articles':idx['supplemental_deep_read_count'],'new_article_deep_reads':4,'all_archive_bodies_read':False,'new_selected_archive_bodies_read':2,'method':{'collection':'Official robots/sitemaps, public pagination, public metadata API and official feeds; ≤1 request/second per host; connect/read timeouts 8/25 seconds.','copyright':'Fetched bodies are transient and discarded; retained files contain metadata, request provenance and original research synthesis.','terminal_meaning':'Accessible declared routes exhausted for stated scope; does not recover deleted/unlisted pages or establish a complete publication history.','response_hashes':'Final response revalidation records SHA-256 and UTC time. Original extraction/probe hashes were not captured and are not fabricated.','provenance':'request-provenance.json; final response revalidation is distinguished from initial metadata extraction.'},'publishers':cov,'probe_failures':probes,'exclusions':['Article-body crawling for entire archives','All non-selected publisher collections','Runtime or model experiments','No new skill packages created'],'implementation':{'changed':['skills/engineering/microservice-operations/references/capacity.md','skills/infrastructure/infrastructure-change-safety/SKILL.md','skills/infrastructure/infrastructure-change-safety/references/configuration-distribution.md','skills/infrastructure/infrastructure-change-safety/references/sources.md'],'operations_source_ledger':'Source entries sent to root for integration; this lane did not edit that ledger.','runtime_verification':'not executed'}}
(ROOT/'coverage.json').write_text(json.dumps(coverage,indent=2,ensure_ascii=False)+'\n')
print('frozen',idx['article_count'],'archive',idx['archive_member_count'],'supplemental',idx['supplemental_deep_read_count'])
for p in cov:print(p['publisher_id'],p['metadata_article_count'],p['archive_page_count'],p['earliest_observed_publication_date'],p['terminal'])
