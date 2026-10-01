"""Replay declared archive endpoints, retaining metadata and response evidence only.

Usage: python3 collector.py --output /tmp/storage-archive-replay.json
This replays the captured endpoint inventory; a later snapshot must independently
recheck advertised totals/next links before making a new terminal-coverage claim.
No article body, feed description/content, CMS HTML, or hydration text is saved.
"""
import argparse, hashlib, html, json, re, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent
LAST={}

def fetch(url):
    original=url; hops=[]
    for _ in range(6):
        host=urlparse(url).netloc
        time.sleep(max(0,1.05-(time.monotonic()-LAST.get(host,0))))
        LAST[host]=time.monotonic();began=time.time()
        record={'url':url,'fetched_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(began))}
        try:
            response=requests.get(url,timeout=(8,25),allow_redirects=False,
                headers={'User-Agent':'EngineeringResearchArchive/1.0 (public metadata; bounded collection)'})
            record.update(status=response.status_code,bytes=len(response.content),
                sha256=hashlib.sha256(response.content).hexdigest(),
                content_type=response.headers.get('content-type'),
                pagination_headers={k:v for k,v in response.headers.items() if k.lower() in ['x-wp-total','x-wp-totalpages','link']},
                elapsed_seconds=round(time.time()-began,3))
            hops.append(record)
            if response.status_code in [301,302,303,307,308] and response.headers.get('location'):
                url=urljoin(url,response.headers['location']);continue
            body=response.content.decode('utf-8',errors='replace') if response.status_code==200 else ''
            return {'requested_url':original,'final_url':url,'hops':hops},body
        except requests.RequestException as error:
            record.update(status='error',error=str(error),elapsed_seconds=round(time.time()-began,3));hops.append(record)
            return {'requested_url':original,'final_url':url,'hops':hops},''
    return {'requested_url':original,'final_url':url,'hops':hops,'error':'redirect limit'},''

def metadata(body,url):
    """Extract explicit metadata fields, never preserve prose/body-bearing values."""
    found=[]
    def add(u,title=None,date=None,last_modified=None):
        if u:found.append({'url':urljoin(url,u),'title':title,'date':date,'last_modified':last_modified})
    try:
        data=json.loads(body)
        posts=data if isinstance(data,list) else data.get('posts',data.get('result',{}).get('entries',[]))
        for post in posts:
            title=post.get('title');title=title.get('rendered') if isinstance(title,dict) else title
            title=html.unescape(re.sub('<[^>]+>','',title or ''))
            u=post.get('link') or post.get('url') or post.get('pathname')
            if not u and post.get('slug'):
                slug=post['slug'];slug=slug.get('current') if isinstance(slug,dict) else slug
                u='/blog/'+slug.strip('/')+'/'
            add(u,title,post.get('date') or post.get('published_at') or post.get('publishDate'),post.get('updated_at') or post.get('_updatedAt'))
        return found
    except (ValueError,AttributeError,TypeError):pass
    try:
        root=ET.fromstring(body)
        for node in root.findall('./{*}url'):add(node.findtext('{*}loc'),last_modified=node.findtext('{*}lastmod'))
        for node in root.findall('.//item'):add(node.findtext('link'),node.findtext('title'),node.findtext('pubDate'))
        for node in root.findall('./{*}entry'):
            link=node.find('{*}link');add(link.get('href') if link is not None else None,node.findtext('{*}title'),node.findtext('{*}published'))
        return found
    except ET.ParseError:pass
    soup=BeautifulSoup(body,'html.parser')
    for stamp in soup.find_all('time'):
        anchor=stamp.parent.parent.select_one('h2 a')
        if anchor:add(anchor['href'],anchor.get_text(' ',strip=True),stamp.get('datetime'))
    for anchor in soup.select('a.grid-post__link'):
        text=anchor.parent.parent.get_text(' ',strip=True);stamp=re.search(r'[A-Z][a-z]{2} \d{1,2}, \d{4}',text)
        add(anchor['href'],anchor.get_text(' ',strip=True),stamp.group() if stamp else None)
    chunks=[json.loads(m.group(1)) for m in re.finditer(r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)',body)]
    stream=''.join(chunks)
    for match in re.finditer(r'\{"__typename":"TemplateBlog"',stream):
        try:post,_=json.JSONDecoder().raw_decode(stream[match.start():])
        except ValueError:continue
        add('/blog/'+post['slug']+'/',post.get('title'),post.get('publishDate'))
    return found

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    coverage=json.loads((ROOT/'coverage.json').read_text())
    endpoints=[]
    for publisher in coverage['publishers']:
        for collection in publisher['collections']:
            endpoints.extend(collection.get('endpoints',[]))
            if collection.get('endpoint'):endpoints.append(collection['endpoint'])
            for topic in collection.get('topic_collections',{}).values():endpoints.extend(page['url'] for page in topic['pages'])
    results=[]
    for endpoint in dict.fromkeys(endpoints):
        evidence,body=fetch(endpoint);results.append({'evidence':evidence,'metadata':metadata(body,evidence['final_url'])})
    args.output.write_text(json.dumps({'results':results,'boundary':'Replayed endpoint inventory; new terminal claims require separately checking totals/continuation and repeated identities.'},indent=2,ensure_ascii=False))
