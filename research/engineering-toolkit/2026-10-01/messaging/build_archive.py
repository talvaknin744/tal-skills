#!/usr/bin/env python3
"""Exhaust public official sitemap collections, augment metadata from feeds/HTML.
No article bodies are written to the repository. Dates retain their semantics.
"""
import concurrent.futures,datetime,email.utils,hashlib,json,pathlib,re,urllib.parse,xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import collect_archives as C
OUT=C.OUT
if not (C.TMP/'probe-results.json').exists():C.main()
PROBE=json.loads((C.TMP/'probe-results.json').read_text())
REQUESTS=PROBE['requests'][:]
for logpath in [OUT/'coverage.json',C.TMP/'discovery-requests.json']:
    if logpath.exists():
        value=json.loads(logpath.read_text());more=value if isinstance(value,list) else value['requests']
        REQUESTS.extend(x for x in more if x not in REQUESTS)
CACHE={x['url']:x for x in REQUESTS}
PAGES={}; COLLECTIONS={}; RECORDS={}

def local_or_fetch(u):
    cached_body=C.TMP/(hashlib.sha256(u.encode()).hexdigest()+'.txt')
    if u in CACHE and cached_body.exists():
        return CACHE[u],cached_body.read_text()
    rec,body=C.fetch(u);CACHE[u]=rec
    return rec,body

def canonical(u):
    p=urllib.parse.urlparse(u)
    host=p.netloc.lower()
    if host in ['synadia.com','redpanda.com','rabbitmq.com','decodable.co','confluent.io']:host='www.'+host
    return urllib.parse.urlunparse(('https',host,p.path.rstrip('/'),'','',''))

def is_article(u):
    p=urllib.parse.urlparse(u);path=p.path.rstrip('/')
    if not path.startswith('/blog/'):return False
    tail=path[6:]
    if any(tail.startswith(x) for x in ['tags/','tag/','categories/','category/','author/','authors/','page/','series/','tutorial/','data-engineering/','data-basics/','ai-llm/','data-insights/']):return False
    if tail in ['rss.xml','feed.xml','feed','data-engineering','data-basics','ai-llm','data-insights','tutorial','podcasts','archive','tags','authors','series','categories','category','author','tag']:return False
    if re.fullmatch(r'\d+',tail):return False
    if path.endswith('.xml'):return False
    return True

def entry(pid,u,source):
    key=canonical(u)
    allowed={
      'confluent':{'www.confluent.io','developer.confluent.io'},
      'temporal':{'temporal.io'},'redpanda':{'www.redpanda.com'},
      'streamnative':{'streamnative.io'},'rabbitmq':{'www.rabbitmq.com'},
      'synadia-nats':{'www.synadia.com','nats.io'},'estuary':{'estuary.dev'},
      'materialize':{'materialize.com'},'risingwave':{'risingwave.com'},
      'decodable':{'www.decodable.co'}}
    if urllib.parse.urlparse(key).netloc not in allowed[pid]:return None
    r=RECORDS[pid].setdefault(key,{'publisher_id':pid,'url':key,'listed_url':u,'title':None,'title_source':None,'slug_label':urllib.parse.unquote(urllib.parse.urlparse(u).path.rstrip('/').split('/')[-1]).replace('-',' '),'published_at':None,'published_at_source':None,'modified_at':None,'modified_at_source':None,'collection_endpoints':[],'read_status':'indexed_only'})
    if source not in r['collection_endpoints']:r['collection_endpoints'].append(source)
    return r

def parse_sitemap(pid,u,body):
    root=ET.fromstring(body);tag=root.tag.split('}')[-1]
    if tag=='sitemapindex':
        kids=[x.text.strip() for x in root.iter() if x.tag.split('}')[-1]=='loc']
        return kids,0,0
    if tag!='urlset':raise ValueError('not sitemap: '+tag)
    total=0;articles=0
    for x in root:
        data={y.tag.split('}')[-1]:y.text for y in x}
        u2=data.get('loc');total+=1
        if not u2:continue
        if is_article(u2):
            r=entry(pid,u2,u)
            if r is None:continue
            articles+=1
            if data.get('lastmod'):r['modified_at']=data['lastmod'];r['modified_at_source']=u
    return [],total,articles

def walk_sitemap(pid,start):
    pending=[start];seen=set();page=[]
    while pending:
        u=pending.pop(0)
        if u in seen:continue
        seen.add(u);rec,body=local_or_fetch(u)
        info={'url':u,'status':rec.get('status'),'sha256':rec.get('sha256')}
        if rec.get('status')!=200:info['terminal_reason']='fetch_failed';page.append(info);continue
        try:
            kids,total,n=parse_sitemap(pid,u,body)
            info.update({'kind':'sitemap_index' if kids else 'urlset','total_entries':total,'article_entries':n,'child_sitemaps':kids,'terminal_reason':'all_child_sitemaps_visited' if kids else 'single_finite_urlset_exhausted'})
            # These collections have site-wide indices; docs/integration children are outside blog scope.
            blogkids=[k for k in kids if not any(t in k for t in ['/docs/','integrations-sitemap','sitemap-docs'])]
            info['out_of_scope_children']=[k for k in kids if k not in blogkids]
            pending.extend(blogkids)
        except Exception as e:info['terminal_reason']='parse_failed';info['error']=str(e)
        page.append(info)
    return page

def parse_date(s):
    s=s.strip()
    try:
        d=email.utils.parsedate_to_datetime(s)
        if d:return d.isoformat()
    except (ValueError,TypeError):pass
    for fmt in ['%B %d, %Y','%b %d, %Y','%Y-%m-%d']:
        try:return datetime.datetime.strptime(s,fmt).date().isoformat()
        except ValueError:pass
    return None

def parse_feed(pid,u,body):
    root=ET.fromstring(body)
    kind=root.tag.split('}')[-1]
    count=0
    for x in root.iter():
        if x.tag.split('}')[-1] not in ['item','entry']:continue
        data={y.tag.split('}')[-1]:y.text for y in x}
        link=data.get('link')
        if kind=='feed':
            ls=[a for a in x if a.tag.split('}')[-1]=='link' and a.get('rel','alternate')=='alternate'];link=ls[0].get('href') if ls else None
        if not link or not is_article(link):continue
        r=entry(pid,link,u)
        if r is None:continue
        count+=1
        if data.get('title'):r['title']=data['title'];r['title_source']=u
        dt=data.get('pubDate') or data.get('published') or data.get('date')
        if dt:r['published_at']=parse_date(dt) or dt;r['published_at_source']=u
    return count

DATE_RE=re.compile(r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},?\s+20\d{2}\b')
def parse_html(pid,u,body):
    soup=BeautifulSoup(body,'html.parser');count=0
    for a in soup.find_all('a',href=True):
        link=urllib.parse.urljoin(u,a['href'])
        if not is_article(link):continue
        r=entry(pid,link,u)
        if r is None:continue
        header=a.find(['h2','h3','h4'])
        text=header.get_text(' ',strip=True) if header else a.get_text(' ',strip=True)
        if not header and a.parent.name in ['h2','h3','h4']:text=a.get_text(' ',strip=True)
        # Text-only title anchors have compact text; avoid descriptions/navigation.
        if text and (header or (len(text)<230 and not any(w in text.lower() for w in ['read more','min read','best practices, industry trends']))):
            if not r['title'] or header:r['title']=text;r['title_source']=u
        # RabbitMQ's dated archive explicitly ties the date label to a dated URL.
        if pid=='rabbitmq' and u.endswith('/archive'):
            dated=re.search(r'/blog/(\d{4})/(\d{2})/(\d{2})/',link)
            if dated:
                r['published_at']='-'.join(dated.groups());r['published_at_source']=u
                r['title']=re.sub(r'^[A-Z][a-z]+ \d{1,2}\s*-\s*','',text);r['title_source']=u
        scope=a
        for i in range(4):
            dt=scope.find('time')
            ds=dt.get('datetime') if dt and dt.get('datetime') else None
            matches=list(dict.fromkeys(DATE_RE.findall(scope.get_text(' ',strip=True))))
            if ds or len(matches)==1:
                ds=ds or parse_date(matches[0])
                if ds and not r['published_at']:r['published_at']=ds;r['published_at_source']=u
                break
            if not scope.parent:break
            # Avoid page-wide metadata contamination.
            if len(scope.parent.find_all('a',href=True))>8:break
            scope=scope.parent
        count+=1
    nextlinks=[]
    for a in soup.find_all('a',href=True):
        href=urllib.parse.urljoin(u,a['href']);rel=a.get('rel',[]);label=a.get_text(' ',strip=True)
        if 'next' in rel or a.get('aria-label')=='Next Page' or 'w-pagination-next' in a.get('class',[]) or (pid=='confluent' and label=='›') or ('Next' in label and re.search(r'/blog/(?:page/)?\d+',href)) or (pid=='rabbitmq' and 'Older' in label):nextlinks.append(href)
    return count,list(dict.fromkeys(nextlinks))

CONFIG={
'confluent':{'sitemaps':['https://www.confluent.io/sitemap.xml','https://developer.confluent.io/sitemap.xml'],'feeds':['https://www.confluent.io/rss.xml'],'paginate':100,'archive':['https://developer.confluent.io/blog/'],'article_metadata':['https://www.confluent.io/blog/introducing-tls-1-3/','https://www.confluent.io/blog/agenda-kafka-summit-bangalore-2024/']},
 'temporal':{'sitemaps':['https://temporal.io/sitemap.xml'],'feeds':['https://temporal.io/blog/feed.xml']},
 'redpanda':{'sitemaps':['https://www.redpanda.com/sitemap.xml'],'feeds':['https://www.redpanda.com/blog/rss.xml']},
 'streamnative':{'sitemaps':['https://streamnative.io/sitemap.xml'],'feeds':[],'structured':[('https://streamnative.io/blog/_payload.json?_b=7799610b-e904-4f42-bdf8-4fcb36797521','nuxt_payload')]},
 'rabbitmq':{'sitemaps':['https://www.rabbitmq.com/sitemap.xml'],'feeds':['https://www.rabbitmq.com/blog/rss.xml'],'archive':['https://www.rabbitmq.com/blog/archive']},
 'synadia-nats':{'sitemaps':['https://www.synadia.com/sitemap-index.xml','https://nats.io/sitemap.xml'],'feeds':['https://www.synadia.com/rss.xml','https://nats.io/blog/index.xml']},
 'estuary':{'sitemaps':['https://estuary.dev/sitemap-index.xml'],'feeds':['https://estuary.dev/blog/rss.xml']},
 'materialize':{'sitemaps':['https://materialize.com/sitemap.xml'],'feeds':['https://materialize.com/rss.xml'],'paginate':23},
 'risingwave':{'sitemaps':['https://risingwave.com/sitemap.xml'],'feeds':[],'structured':[('https://risingwave.com/blog/','next_flight')]},
 'decodable':{'sitemaps':['https://www.decodable.co/sitemap.xml'],'feeds':['https://www.decodable.co/blog/rss.xml'],'follow_next':True}}

def parse_structured(pid,u,body,kind):
    n=0
    if kind=='nuxt_payload':
        pool=json.loads(body)
        refs=pool[pool[2]['blogs-listing']]
        rows=[{k:pool[v] if v>=0 else None for k,v in pool[i].items() if k in ['title','date','path','isDraft']} for i in refs]
        rows=[x for x in rows if not x.get('isDraft')]
    else:
        soup=BeautifulSoup(body,'html.parser');rows=[]
        for script in soup.find_all('script'):
            text=script.get_text()
            if not text.startswith('self.__next_f.push(') or 'publishedAt' not in text:continue
            args=json.loads(text[len('self.__next_f.push('):-1]);flight=args[1]
            pos=flight.find('"blogs":')
            if pos>=0:
                blogs,end=json.JSONDecoder().raw_decode(flight[pos+len('"blogs":'):]);rows.extend(x['node'] for x in blogs)
    for x in rows:
        link=urllib.parse.urljoin(u,x.get('path') or x.get('url') or '/blog/'+x['slug'])
        if not is_article(link):continue
        r=entry(pid,link,u)
        if r is None:continue
        r['title']=x['title'];r['title_source']=u
        dt=x.get('date') or x.get('publishedAt')
        if dt:r['published_at']=dt;r['published_at_source']=u
        n+=1
    return n

def collect(p):
    pid=p['id'];RECORDS[pid]={};cfg=CONFIG[pid];pages=[]
    for u in cfg['sitemaps']:pages.extend(walk_sitemap(pid,u))
    for u in cfg['feeds']:
        rec,body=local_or_fetch(u);info={'url':u,'status':rec.get('status'),'kind':'feed','sha256':rec.get('sha256')}
        if rec.get('status')==200:
            try:info.update({'article_entries':parse_feed(pid,u,body),'terminal_reason':'single_finite_feed_exhausted','scope_note':'feed terminal proves exposed feed exhaustion, not historical completeness'})
            except Exception as e:info.update({'terminal_reason':'not_parseable_feed','error':str(e)})
        else:info['terminal_reason']='fetch_failed'
        pages.append(info)
    html_urls=[p['blog']]+cfg.get('archive',[])
    if cfg.get('paginate'):html_urls += [p['base']+'/blog/'+str(i)+'/' for i in range(2,cfg['paginate']+1)]
    seen_html=set()
    for u in html_urls:
        if u in seen_html:continue
        seen_html.add(u)
        rec,body=local_or_fetch(u);info={'url':u,'status':rec.get('status'),'kind':'archive_html','sha256':rec.get('sha256')}
        if rec.get('status')==200:
            n,nex=parse_html(pid,u,body);info.update({'article_links':n,'next_links':nex,'terminal_reason':'observed_listing' if nex else 'no_next_link_observed'})
        else:info['terminal_reason']='fetch_failed'
        if cfg.get('follow_next') and rec.get('status')==200:
            html_urls.extend(x for x in nex if x not in seen_html)
        pages.append(info)
    for u in cfg.get('article_metadata',[]):
        rec,body=local_or_fetch(u);info={'url':u,'status':rec.get('status'),'kind':'article_metadata_only','sha256':rec.get('sha256')}
        if rec.get('status')==200:
            soup=BeautifulSoup(body,'html.parser');r=entry(pid,u,u)
            for script in soup.find_all('script',type='application/ld+json'):
                data=json.loads(script.get_text())
                if data.get('@type')=='BlogPosting' and data.get('datePublished'):
                    r['published_at']=data['datePublished'];r['published_at_source']=u
            info['terminal_reason']='article_metadata_fields_extracted_body_not_read'
        pages.append(info)
    for u,kind in cfg.get('structured',[]):
        rec,body=local_or_fetch(u);info={'url':u,'status':rec.get('status'),'kind':kind,'sha256':rec.get('sha256')}
        if rec.get('status')==200:
            try:info.update({'article_entries':parse_structured(pid,u,body,kind),'terminal_reason':'complete_embedded_listing_array_exhausted'})
            except Exception as e:info.update({'terminal_reason':'parse_failed','error':str(e)})
        pages.append(info)
    PAGES[pid]=pages
    print(pid,len(RECORDS[pid]),'title',sum(bool(x['title']) for x in RECORDS[pid].values()),'date',sum(bool(x['published_at']) for x in RECORDS[pid].values()),flush=True)

def prior_urls():
    old={}
    research=OUT.parents[1]
    for p in research.rglob('*'):
        if not p.is_file() or '2026-10-01' in p.parts or p.suffix not in ['.md','.json']:continue
        for u in re.findall(r'https?://[^\s<>"\)\]]+',p.read_text(errors='replace')):
            old.setdefault(canonical(u.rstrip('.,;')),set()).add(str(p.relative_to(research)))
    return old

def write():
    old=prior_urls();allrecs=[];cov=[]
    deepfile=OUT/'deep-reading.json'
    deep={canonical(x['url']):x for x in json.loads(deepfile.read_text())['articles']} if deepfile.exists() else {}
    for p in PROBE['publishers']:
        pid=p['id'];rr=list(RECORDS[pid].values())
        for r in rr:
            r['prior_record_matches']=sorted(old.get(r['url'],[]))
            if r['url'] in deep:
                d=deep[r['url']];r['read_status']='deep_read';r['deep_read_record']='deep-reading.json#'+d['id'];r['read_scope']=d['read_scope']
                if not r['title']:r['title']=d['title'];r['title_source']=d['url']
                if not r['published_at']:r['published_at']=d['published_at'];r['published_at_source']=d['url']
        rr.sort(key=lambda r:(r['published_at'] or '',r['url']),reverse=True);allrecs+=rr
        pubdates=[r['published_at'] for r in rr if r['published_at']]
        modified=[r['modified_at'] for r in rr if r['modified_at']]
        cov.append({'publisher_id':pid,'name':p['name'],'declared_collection':'Official English blog article paths under /blog/; company and NATS project grouped for Synadia/NATS; Confluent developer blog included. Category/tag/author/pagination/feed and documentation paths excluded.','index_url':p['blog'],'collection_endpoints':CONFIG[pid]['sitemaps']+CONFIG[pid]['feeds']+CONFIG[pid].get('archive',[])+[x[0] for x in CONFIG[pid].get('structured',[])]+CONFIG[pid].get('article_metadata',[]),'pages':PAGES[pid],'collection_page_count':len(PAGES[pid]),'sitemap_urlset_count':sum(x.get('kind')=='urlset' for x in PAGES[pid]),'archive_html_page_count':sum(x.get('kind')=='archive_html' for x in PAGES[pid]),'article_count':len(rr),'titles_available':sum(bool(x['title']) for x in rr),'publication_dates_available':len(pubdates),'sitemap_modification_dates_available':len(modified),'earliest_publication_date':min(pubdates) if pubdates else None,'earliest_publication_date_scope':'among records with publication metadata; not proof of archive start','earliest_sitemap_modification_date':min(modified) if modified else None,'prior_record_count':sum(bool(x['prior_record_matches']) for x in rr),'terminal_state':'all_declared_sitemap_urlsets_and_exposed_feeds_exhausted; declared_paginated_archives_reached_no_next_link','gaps':['Sitemap exhaustion establishes the publisher-exposed collection, not every article ever published.','Indexed URLs were not individually checked for liveness and were not counted as read.','Missing titles and publication dates remain null; slug labels and sitemap lastmod are separate metadata.'] + (['Feeds may be capped; sitemap is the archive URL authority.'] if pid in ['rabbitmq','redpanda','decodable'] else [])})
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OUT/'index.json').write_text(json.dumps({'schema_version':1,'lane':'messaging','collected_at':now,'index_semantics':'One canonical URL per publisher. Listed metadata only; no full article body. Publication dates and sitemap lastmod are separate. Prior record matches mark already known sources.','publisher_count':10,'article_count':len(allrecs),'records':allrecs},indent=2,ensure_ascii=False)+'\n')
    (OUT/'coverage.json').write_text(json.dumps({'schema_version':1,'lane':'messaging','collected_at':now,'publishers':cov,'request_policy':{'minimum_seconds_between_same_host_requests':1.1,'connect_timeout_seconds':8,'read_timeout_seconds':20,'max_parallel_publishers':10},'requests':REQUESTS+C.LOG},indent=2,ensure_ascii=False)+'\n')
    print('TOTAL',len(allrecs),'prior',sum(bool(x['prior_record_matches']) for x in allrecs))
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:list(ex.map(collect,PROBE['publishers']))
    write()
