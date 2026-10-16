"""Small synthetic publisher shapes, without archived bodies or HTTP."""
import importlib.util
import json
from pathlib import Path
import unittest
from bs4 import BeautifulSoup
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('portable_meta',Path(__file__).resolve().parents[2]/'scripts/research/blog-crawler.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
TITLE='A portable article evidence fixture'
AI='https://ai.meta.com/blog/portable-evidence-fixture/'
RESEARCH='https://research.facebook.com/blog/2025/7/portable-evidence-fixture/'
TECH='https://tech.facebook.com/engineering/2025/7/portable-evidence-fixture/'
PARTS=[' '.join(label+str(i) for i in range(count)) for label,count in [('first',60),('second',60),('third',40)]]
PROSE='\n'.join(PARTS)
BODY=''.join('<p>'+part+'</p>' for part in PARTS)
def page(body,url=AI,title=TITLE,document_title=None):
 document_title=document_title or title
 return '<html><head><title>'+document_title+'</title><link rel="canonical" href="'+url+'"><meta name="title" content="'+document_title+'"><meta name="og:title" content="'+title+'"><meta name="og:url" content="'+url+'"></head><body>'+body+'</body></html>'
def legacy():
 return page('<div class="_8xs5"><div class="_8znh"><h1>'+TITLE+'</h1><div class="_8zn9 _99tb"><div class="_8zna">'+BODY+'</div></div></div></div>')
def code():
 first=BODY;second=BODY.replace('first','later-first').replace('second','later-second').replace('third','later-third')
 html=page('<div class="_8xs5"><h1>'+TITLE+'</h1><div class="_amgj"><div class="_9bhp _9bhq _9bg-"><h2>Takeaways</h2>'+first+'</div><div class="_9bhp _9bhq _9bg-">'+second+'</div><div></div><div>Share:</div><div class="_9bhs"><div class="_amh_">Subscribe to the newsletter</div></div></div></div>')
 return html,'Takeaways\n'+PROSE+'\n\n'+PROSE.replace('first','later-first').replace('second','later-second').replace('third','later-third')
def hardware(accordion=False):
 article=BODY
 if accordion:
  article+='<div><button class="_a6iy" data-testid="drawer-tab" data-ms=\'{"creative":"accordion","creative_detail":"Decode"}\' aria-controls="panel"><p class="_a5cy">Decode</p></button><div class="_a6iz" data-testid="drawer-section" id="panel"><ul><li>Decode source formats</li></ul></div></div>'
 return page('<div class="_8xs5"><div class="_7h8s"><div class="_a5x4"><h2>'+TITLE+'</h2><p>May 18, 2023 · 8 min read</p><video src="hero.mp4"></video></div><div class="_a5x4">'+article+'</div><div class="_a5x4"><h2>Learn about the infrastructure</h2><a>Watch the film</a></div></div></div>')
def research():
 return page('<div class="mc-research-blog"><section class="_9ye5 _9vu- _9s5f"><div class="_9so9 _9vv4"><header><h1 class="_9v6_">'+TITLE+'</h1></header></div><div class="_9so9 _9vv4">'+BODY+'</div><div class="_9so9 _9vv4"><div class="_9v8g">Areas Research Share Copy URL</div></div></section></div>',RESEARCH,document_title=TITLE+' | Meta Research').replace('name="og:title" content="'+TITLE+'"','name="og:title" content="'+TITLE+' | Meta Research"')
def tech(cards=False):
 extra=''
 if cards:
  extra='<section class="_a787"><span class="_a6x-">Recommended Reading</span><ul class="_a6x_">'+''.join('<li class="_a6yu"><a class="_a6yv" href="https://tech.facebook.com/engineering/2025/7/other-'+str(i)+'/"><p>Other publication '+str(i)+'</p></a></li>' for i in range(3))+'</ul></section>'
 return page('<div class="_techLayout__root"><div class="_a5t8 _a5wp"><div class="_a6r4"><div class="_adj1"><h1 class="_a7y_">'+TITLE+'</h1></div><div class="_a78k"><div class="_a78m _acex _ainz">'+BODY+extra+'</div></div></div></div></div>',TECH,document_title=TITLE+' - Tech at Meta')
def changed(html,action):
 soup=BeautifulSoup(html,'html.parser');action(soup);return str(soup)
class PortableMeta(unittest.TestCase):
 def setUp(self):
  self.net=patch.object(c.requests.sessions.Session,'request',side_effect=AssertionError('Portable check attempted HTTP'));self.net.start()
 def tearDown(self):self.net.stop()
 def recover(self,html,url=AI):return c.extract_publisher_article(html,'meta',url.rstrip('/'),url)
 def refuse(self,html,url=AI):
  self.assertIsNone(c.extract_meta_article(html,url.rstrip('/'),url));self.assertEqual(self.recover(html,url),c.extract_article(html))
 def test_legacy_article_has_exact_source_text_without_reading_credit(self):
  result=self.recover(legacy());self.assertEqual(result['text'],PROSE);self.assertEqual(result['word_count'],160);self.assertFalse(result['body_read']);self.assertFalse(result['body_availability_gain'])
 def test_code_components_retain_order_and_exclude_share_newsletter(self):
  html,expected=code();result=self.recover(html);self.assertEqual(result['text'],expected);self.assertEqual(result['selected_source_order_indices'],[0,1]);self.assertNotIn('Subscribe',result['text']);self.assertNotIn('Share:',result['text'])
 def test_hardware_uses_verified_hero_without_counting_hero_or_film(self):
  result=self.recover(hardware());self.assertEqual(result['text'],PROSE);self.assertTrue(result['headline_h1_absent']);self.assertNotIn('Watch the film',result['text']);self.assertFalse(result['media_content_reviewed'])
 def test_research_frame_excludes_header_and_share(self):
  result=self.recover(research(),RESEARCH);self.assertEqual(result['text'],PROSE);self.assertEqual(result['selected_source_order_indices'],[1]);self.assertNotIn('Copy URL',result['text'])
 def test_tech_frame_retains_prose_and_removes_only_typed_article_cards(self):
  result=self.recover(tech(cards=True),TECH);self.assertEqual(result['text'],PROSE);self.assertEqual(len(result['removed_ancillary_sections']),1);self.assertEqual(len(result['removed_ancillary_sections'][0]['hrefs']),3)
 def test_typed_jsonld_integer_and_null_decline_without_exception(self):
  for value in [7,None]:
   with self.subTest(value=value):
    html=changed(legacy(),lambda s,v=value:s.head.append(BeautifulSoup('<script type="application/ld+json">'+json.dumps({'@type':v})+'</script>','html.parser').script));self.refuse(html)
 def test_malformed_accordion_objects_decline_without_exception(self):
  for value in [7,[],None]:
   with self.subTest(value=value):self.refuse(changed(hardware(True),lambda s,v=value:s.button.__setitem__('data-ms',json.dumps(v))))
 def test_verified_accordion_label_and_content_survive_extraction(self):
  result=self.recover(hardware(True));self.assertEqual(result['text'],PROSE+'\nDecode\nDecode source formats');self.assertEqual(len(result['retained_article_control_labels']),1)
 def test_navigation_ancestor_outside_article_frame_declines(self):
  self.refuse(changed(legacy(),lambda s:s.select_one('div._8xs5').wrap(s.new_tag('nav'))))
 def test_cookie_dialog_ancestor_outside_article_frame_declines(self):
  def wrap(s):
   dialog=s.new_tag('div');dialog['role']='dialog';dialog['class']='cookie-dialog';s.select_one('div._8xs5').wrap(dialog)
  self.refuse(changed(legacy(),wrap))
 def test_research_aside_ancestor_declines(self):
  self.refuse(changed(research(),lambda s:s.select_one('div.mc-research-blog').wrap(s.new_tag('aside'))),RESEARCH)
 def test_conflicting_second_document_title_declines(self):
  self.refuse(changed(legacy(),lambda s:s.head.append(BeautifulSoup('<title>Conflicting source title</title>','html.parser').title)))
 def test_wrong_host_and_changed_canonical_decline(self):
  self.assertIsNone(c.extract_meta_article(legacy(),'https://other.example/blog/portable-evidence-fixture',AI));self.refuse(changed(legacy(),lambda s:s.link.__setitem__('href','https://ai.meta.com/blog/other-fixture/')))
 def test_generic_and_other_publishers_keep_the_prior_cutoff(self):
  html=legacy();self.assertEqual(c.extract_article(html)['status'],'body_fetched_unextracted');self.assertEqual(c.extract_publisher_article(html,'other',AI,AI),c.extract_article(html))
 def test_duplicate_body_or_foreign_context_is_not_accepted(self):
  self.refuse(changed(legacy(),lambda s:s.select_one('div._8zna').append(BeautifulSoup('<div class="_8zna"><p>Another source body</p></div>','html.parser').div)))
 def test_opaque_unknown_template_is_not_a_global_body_fallback(self):
  self.refuse(changed(legacy(),lambda s:s.select_one('div._8zna').__setitem__('class',['other-content'])))
if __name__=='__main__':unittest.main(verbosity=2)
