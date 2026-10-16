"""Narrow cached Meta prose prototype, with explicit current identity limits."""
import copy
import hashlib
import json
import re
from urllib.parse import urlsplit
from bs4 import BeautifulSoup


def _meta_sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _meta_words(text):
    return re.sub(r'[\W_]+', ' ', text.casefold()).strip()


def _meta_identity(url):
    if not isinstance(url, str) or url.strip() != url:
        return None
    try:
        p = urlsplit(url)
        invalid_authority = p.username or p.password or p.port
    except ValueError:
        return None
    if p.scheme != 'https' or p.query or p.fragment or invalid_authority:
        return None
    if p.netloc != p.hostname or '//' in p.path or re.search(r'%2f|%5c', p.path, re.I):
        return None
    return p.hostname, p.path.rstrip('/')


def _meta_route(requested, final, canonical):
    req, end, can = map(_meta_identity, (requested, final, canonical))
    if not all((req, end, can)):
        return None
    rh, rp = req; fh, fp = end; ch, cp = can
    alias = None
    excluded_slugs = {'blog', 'news', 'research', 'category', 'categories', 'tags', 'tag', 'author', 'authors', 'page', 'archive', 'archives', 'feed', 'search'}
    if fh == 'ai.meta.com' and rh in {'ai.meta.com', 'ai.facebook.com'}:
        if ch != fh or rp != fp or cp != fp or not re.fullmatch(r'/blog/[^/]+', fp):
            return None
        family = 'AI'
    elif fh == 'research.facebook.com' and rh in {'research.facebook.com', 'research.fb.com'}:
        if ch != fh or rp != fp:
            return None
        fm = re.fullmatch(r'/blog/([0-9]{4})/([0-9]{1,2})/([^/]+)', fp)
        cm = re.fullmatch(r'/blog/([0-9]{4})/([0-9]{1,2})/([^/]+)', cp)
        if not fm or not cm or not 1 <= int(fm[2]) <= 12 or (fm[1], int(fm[2]), fm[3]) != (cm[1], int(cm[2]), cm[3]):
            return None
        if fp != cp:
            alias = {'kind': 'declared_calendar_padding', 'requested_url': requested, 'final_url': final,
                     'canonical_url': canonical, 'historical_equivalence': 'unresolved'}
        family = 'research'
    elif fh == 'tech.facebook.com' and rh in {'tech.facebook.com', 'tech.fb.com'}:
        if ch != fh or cp != fp:
            return None
        fm = re.fullmatch(r'/engineering/([0-9]{4})/([0-9]{1,2})/([^/]+)', fp)
        if not fm or not 1 <= int(fm[2]) <= 12:
            return None
        if rp != fp:
            if not re.fullmatch(r'/[^/]+', rp) or rp[1:] != fm[3]:
                return None
            alias = {'kind': 'retained_current_dated_route', 'requested_url': requested, 'final_url': final,
                     'canonical_url': canonical, 'historical_equivalence': 'unresolved'}
        family = 'tech'
    else:
        return None
    slug = fp.rsplit('/', 1)[-1]
    if slug.casefold() in excluded_slugs or slug.isdigit():
        return None
    return {'family': family, 'requested': req, 'final': end, 'canonical': can,
            'identity_alias': alias, 'publisher_host_migration': rh != fh,
            'requested_final_same_path': rp == fp, 'final_canonical_same_path': fp == cp}


def _meta_single_meta(soup, name):
    nodes = [n for n in soup.find_all('meta') if n.get('name') == name or n.get('property') == name]
    return nodes[0].get('content') if len(nodes) == 1 else None


def _meta_in(node, region):
    return node is region or any(p is region for p in node.parents)


def _meta_valid_nodes(nodes, region):
    forbidden_classes = {'blog-card', 'post-card', 'related-posts', 'related-content', 'cookie-banner', 'cookie-consent', 'cookie-dialog'}
    forbidden_roles = {'navigation', 'dialog', 'banner', 'contentinfo'}
    for n in nodes:
        if not _meta_in(n, region) or any(n is not m and _meta_in(n, m) for m in nodes):
            return False
        for p in [n, *list(n.parents)]:
            if p.name in {'a', 'nav', 'aside', 'footer', 'header', 'form'} or p.get('role') in forbidden_roles or forbidden_classes.intersection(p.get('class', [])):
                return False
        if n.select('nav,aside,footer,form,[role="navigation"],[role="dialog"],.blog-card,.post-card,.related-posts,.related-content,.cookie-banner,.cookie-consent,.cookie-dialog'):
            return False
        if len([p for p in n.find_all('p') if p.get_text(' ', strip=True)]) < 3:
            return False
    return True


def extract_meta_article(html, requested_url, final_url):
    soup = BeautifulSoup(html, 'html.parser')
    canonicals = soup.select('link[rel~="canonical"]')
    if len(canonicals) != 1:
        return None
    canonical = canonicals[0].get('href')
    route = _meta_route(requested_url, final_url, canonical)
    document_titles = soup.find_all('title')
    if not route or len(document_titles) != 1:
        return None
    document_title = document_titles[0].get_text(' ', strip=True)
    if not document_title or re.match(r'(?:404|page not found|access denied|error|challenge|just a moment)\b', document_title, re.I):
        return None
    metadata_url = _meta_single_meta(soup, 'og:url')
    if _meta_identity(metadata_url) != _meta_identity(final_url):
        return None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            return None
        pending = data if isinstance(data, list) else [data]
        for node in pending:
            if isinstance(node, dict):
                pending.extend(node.get('@graph', []))
                types = node.get('@type', [])
                if isinstance(types, str):
                    types = [types]
                elif not isinstance(types, list) or any(not isinstance(value, str) for value in types):
                    return None
                if any(t in {'CollectionPage', 'ItemList'} for t in types):
                    return None
    if len(soup.find_all('main')) > 1:
        return None
    selected = []; excluded = []; removed_cards = []; selector = None
    title = None; headline_node = None; region = None; allnodes = []; indices = []
    if route['family'] == 'AI':
        regions = soup.select('div._8xs5')
        if len(regions) != 1:
            return None
        region = regions[0]
        title_metadata = _meta_single_meta(soup, 'title')
        if not title_metadata or _meta_words(title_metadata) != _meta_words(document_title):
            return None
        legacy = soup.select('div._8zna'); code = soup.select('div._amgj')
        if legacy and code:
            return None
        headlines = soup.find_all('h1')
        if legacy:
            contexts = soup.select('div._8znh')
            if len(legacy) != 1 or len(contexts) != 1 or len(headlines) != 1:
                return None
            headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
            if not _meta_in(headline_node, contexts[0]) or not _meta_in(legacy[0], contexts[0]) or not {'_8zn9', '_99tb'}.issubset(legacy[0].parent.get('class', [])):
                return None
            if _meta_words(title) != _meta_words(title_metadata) and _meta_words(title) != _meta_words(route['final'][1].rsplit('/', 1)[-1]):
                return None
            selector = 'div._8zna'; allnodes = legacy; indices = [0]
        elif code:
            if len(code) != 1 or len(headlines) != 1 or not _meta_in(code[0], region):
                return None
            headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
            if not _meta_in(headline_node, region) or _meta_words(title) != _meta_words(title_metadata):
                return None
            allnodes = code[0].find_all('div', recursive=False)
            if len(allnodes) != 5 or any(not {'_9bhp', '_9bhq', '_9bg-'}.issubset(n.get('class', [])) for n in allnodes[:2]):
                return None
            if allnodes[2].get_text(' ', strip=True) or allnodes[3].get_text(' ', strip=True) != 'Share:' or '_9bhs' not in allnodes[4].get('class', []) or not allnodes[4].select('div._amh_') or 'Subscribe' not in allnodes[4].get_text(' ', strip=True):
                return None
            if len(allnodes[4].get_text(' ', strip=True).split()) > 50 or allnodes[4].find(['h1', 'h2', 'h3']):
                return None
            if not allnodes[0].find('h2') or allnodes[0].find('h2').get_text(' ', strip=True) != 'Takeaways':
                return None
            selector = 'div._amgj > div'; indices = [0, 1]
            excluded = [(2, 'empty_structural_spacer'), (3, 'share_control'), (4, 'newsletter_signup')]
        else:
            allnodes = soup.select('div._a5x4')
            if headlines or len(allnodes) not in {3, 8} or len({id(n.parent) for n in allnodes}) != 1 or '_7h8s' not in allnodes[0].parent.get('class', []):
                return None
            if any(not _meta_in(n, region) for n in allnodes):
                return None
            hero = allnodes[0]
            if len(allnodes) == 3:
                hero_headlines = hero.find_all('h2')
                if len(hero_headlines) != 1 or not re.search(r'[A-Z][a-z]+ [0-9]{1,2}, [0-9]{4}.*min read', hero.get_text(' ', strip=True)):
                    return None
                headline_node = hero_headlines[0]
                tail = allnodes[2]
                if tail.find('p') or 'Watch the film' not in tail.get_text(' ', strip=True) or len(tail.find_all('h2')) != 1:
                    return None
                indices = [1]; excluded = [(0, 'hero_title_and_date'), (2, 'separate_film_CTA')]
            else:
                hero_headlines = hero.select('p._am_4')
                if len(hero_headlines) != 1 or len(hero.find_all('p')) != 2 or not re.search(r'[A-Z][a-z]+ [0-9]{1,2}, [0-9]{4}.*min read', hero.get_text(' ', strip=True)):
                    return None
                headline_node = hero_headlines[0]
                tail = allnodes[7]
                if tail.find(['p', 'h1', 'h2', 'h3']) or not tail.get_text(' ', strip=True).startswith('Written by:'):
                    return None
                indices = list(range(1, 7)); excluded = [(0, 'hero_title_and_date'), (7, 'author_credit')]
            title = headline_node.get_text(' ', strip=True)
            if _meta_words(title) != _meta_words(title_metadata) or _meta_words(_meta_single_meta(soup, 'og:title') or '') != _meta_words(title_metadata):
                return None
            selector = 'div._a5x4'
    elif route['family'] == 'research':
        regions = soup.select('div.mc-research-blog'); allnodes = soup.select('div._9so9._9vv4')
        if len(regions) != 1 or len(allnodes) != 3 or len({id(n.parent) for n in allnodes}) != 1 or not {'_9ye5', '_9vu-', '_9s5f'}.issubset(allnodes[0].parent.get('class', [])):
            return None
        region = regions[0]; headlines = allnodes[0].select('h1._9v6_')
        if len(headlines) != 1 or any(not _meta_in(n, region) for n in allnodes):
            return None
        headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
        if len([h for h in soup.find_all('h1') if h.get_text(' ', strip=True) not in {'', 'Research'}]) != 1 or not _meta_words(document_title).startswith(_meta_words(title)) or _meta_single_meta(soup, 'og:title') != document_title:
            return None
        if allnodes[2].find('p') or not allnodes[2].select('div._9v8g') or not allnodes[2].get_text(' ', strip=True).startswith('Areas') or 'Copy URL' not in allnodes[2].get_text(' ', strip=True):
            return None
        selector = 'div._9so9._9vv4'; indices = [1]; excluded = [(0, 'publication_date_headline_and_author'), (2, 'areas_and_share_controls')]
    else:
        regions = soup.select('div._a6r4'); allnodes = soup.select('div._a78m')
        if len(regions) != 1 or len(allnodes) != 1 or not {'_acex', '_ainz'}.issubset(allnodes[0].get('class', [])) or '_a78k' not in allnodes[0].parent.get('class', []):
            return None
        region = regions[0]
        layout = soup.select('div._techLayout__root')
        if len(layout) != 1 or not _meta_in(region, layout[0]) or not {'_a5t8', '_a5wp'}.issubset(region.parent.get('class', [])):
            return None
        headlines = region.select('h1._a7y_')
        if len(headlines) != 1 or len([h for h in soup.find_all('h1') if h.get_text(' ', strip=True) not in {'', 'Tech at Meta'}]) != 1:
            return None
        headline_node = headlines[0]; title = headline_node.get_text(' ', strip=True)
        if _meta_single_meta(soup, 'og:title') != title or not document_title.startswith(title):
            return None
        selector = 'div._a78m'; indices = [0]
    if not title or len(title.split()) < 3 or title.casefold() in {'meta ai', 'meta research', 'tech at meta', 'research', 'blog'}:
        return None
    selected = [allnodes[i] for i in indices]
    if not _meta_valid_nodes(selected, region):
        return None
    if len({n.get_text('\n', strip=True) for n in selected}) != len(selected):
        return None
    source_fragments = [_meta_sha(str(n).encode()) for n in selected]
    images = [{'src': n.get('src'), 'alt': n.get('alt')} for node in selected for n in node.find_all('img')]
    media = [{'tag': n.name, 'src': n.get('src'), 'data_src': n.get('data-src'), 'data': n.get('data')} for node in selected for n in node.select('iframe,video,audio,object,embed')]
    omitted = [{'source_component_index': i, 'reason': reason, 'text_sha256': _meta_sha(allnodes[i].get_text('\n', strip=True).encode()), 'word_count': len(allnodes[i].get_text('\n', strip=True).split()), 'fragment_sha256': _meta_sha(str(allnodes[i]).encode()), 'embedded_media_count': len(allnodes[i].select('iframe,video,audio,object,embed'))} for i, reason in excluded]
    components = []; retained_controls = []; removed_controls = []
    for n in selected:
        clone = BeautifulSoup(str(n), 'html.parser').find(n.name)
        cards = clone.select('section._a787')
        if cards and route['family'] != 'tech':
            return None
        for card in cards:
            labels = card.select('span._a6x-'); lists = card.select('ul._a6x_'); links = card.select('ul._a6x_ > li._a6yu > a._a6yv[href]')
            if len(labels) != 1 or labels[0].get_text(' ', strip=True) != 'Recommended Reading' or len(lists) != 1 or not links or len(card.find_all('a')) != len(links):
                return None
            hrefs = [link.get('href') for link in links]
            if any(not _meta_identity(href) or _meta_identity(href)[0] != 'tech.facebook.com' or _meta_identity(href) == _meta_identity(final_url) for href in hrefs):
                return None
            removed_cards.append({'selector': 'section._a787', 'reason': 'separate_recommended_article_cards', 'text_sha256': _meta_sha(card.get_text('\n', strip=True).encode()), 'fragment_sha256': _meta_sha(str(card).encode()), 'hrefs': hrefs})
            card.decompose()
        for button in clone.find_all('button'):
            label = button.get_text(' ', strip=True)
            if button.get('data-testid') == 'drawer-tab' and '_a6iy' in button.get('class', []):
                try:
                    state = json.loads(button.get('data-ms', ''))
                except (ValueError, TypeError):
                    return None
                if not isinstance(state, dict):
                    return None
                targets = clone.find_all(id=button.get('aria-controls')) if button.get('aria-controls') else []
                if len(targets) != 1 or targets[0].parent is not button.parent or targets[0].get('data-testid') != 'drawer-section' or '_a6iz' not in targets[0].get('class', []) or not targets[0].find('li') or state.get('creative') != 'accordion' or state.get('creative_detail') != label:
                    return None
                labels = button.select('p._a5cy')
                if len(labels) != 1 or labels[0].get_text(' ', strip=True) != label or not label:
                    return None
                retained_controls.append({'kind': 'article_accordion_section_label', 'text': label, 'text_sha256': _meta_sha(label.encode()), 'controlled_source_section_id': button.get('aria-controls'), 'interaction_verified': False})
                button.replace_with(labels[0].extract())
            else:
                removed_controls.append({'tag': 'button', 'text_sha256': _meta_sha(button.get_text('\n', strip=True).encode()), 'reason': 'control_outside_validated_article_accordion'})
                button.decompose()
        for tag in clone.select('script,style,noscript,nav,footer,header,aside,form,svg'):
            tag.decompose()
        components.append(clone.get_text('\n', strip=True))
    text = '\n\n'.join(components)
    if any(not t for t in components) or len(text.split()) < 120:
        return None
    return {'title': title, 'document_title': document_title, 'headline_node_name': headline_node.name,
            'headline_h1_absent': not bool(soup.find('h1')), 'text': text, 'word_count': len(text.split()),
            'method': 'meta.' + route['family'].lower() + '.bounded-publisher-prose', 'status': 'body_extracted', 'body_read': False,
            'requested_identity': requested_url, 'final_identity': final_url, 'declared_canonical_url': canonical,
            'requested_final_same_path': route['requested_final_same_path'], 'final_canonical_same_path': route['final_canonical_same_path'],
            'publisher_host_migration': route['publisher_host_migration'], 'canonical_alias': route['identity_alias'],
            'publisher_body_selector': selector, 'publisher_body_selector_count': len(allnodes),
            'selected_source_order_indices': indices, 'article_content_containers': len(selected),
            'component_sha256': [_meta_sha(t.encode()) for t in components], 'component_word_counts': [len(t.split()) for t in components],
            'source_component_fragment_sha256': source_fragments, 'excluded_components': omitted, 'removed_ancillary_sections': removed_cards,
            'retained_article_control_labels': retained_controls, 'removed_control_elements': removed_controls,
            'image_references': images, 'embedded_media_references': media, 'embedded_media_count': len(media), 'media_content_reviewed': False,
            'body_availability_gain': False, 'new_deliberate_reading_credit': False,
            'extraction_limit': 'Current cached publisher prose selected using a bounded page shape, article identity and source order. Declared aliases remain unresolved historical equivalence. Media, publication history, future templates and source reading are unverified.'}
