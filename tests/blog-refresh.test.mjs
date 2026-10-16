import test from 'node:test';
import assert from 'node:assert/strict';
import { reportReferenceBindings, runCollectorSha256, sha256, snapshotCounters, validateExtraction, validatePublisherSnapshot, validateReceipt } from '../scripts/research/check-blog-refresh.mjs';

const hash = sha256(Buffer.from('fixture'));
const publisher = { publisher_id: 'fixture', inventory_sha256: hash, coverage_sha256: hash, record_count: 3 };
function fixture() {
  const extraction = { status: 'body_extracted', title: 'A real article', text: 'evidence '.repeat(130), word_count: 130, body_read: false, method: 'article' };
  extraction.text_sha256 = sha256(Buffer.from(extraction.text));
  const receipt = { status: 'fetched', http_status: 200, object_path: 'objects/article/raw.bin', sha256: hash, bytes: 7 };
  const articles = [
    { url: 'https://example.com/blog/article', status: 'body_extracted', receipt },
    { url: 'https://example.com/blog/blocked', status: 'blocked', receipt: { status: 'blocked', http_status: 403 } },
    { url: 'https://example.com/blog/pending', status: 'pending', receipt: null },
  ];
  const events = [{ url: articles[0].url, receipt, extraction }, { url: articles[1].url, receipt: articles[1].receipt, extraction: { status: 'blocked', text: '', word_count: 0, body_read: false } }];
  const attempts = [{ ...receipt, kind: 'article', requested_url: articles[0].url }, { ...articles[1].receipt, kind: 'article', requested_url: articles[1].url }];
  const summary = { schema_version: 1, publisher_id: 'fixture', config: { baseline_inventory_sha256: hash, baseline_coverage_sha256: hash, baseline_record_count: 3 },
    known_article_urls: 3, article_status_counts: { body_extracted: 1, blocked: 1, pending: 1 }, all_known_urls_attempted: false,
    all_known_bodies_fetched: false, unresolved_article_urls: 2, all_article_bodies_read: false, article_read_count: 0, discovery_complete: false,
    discovery_boundary: 'Generic links only.', limits: ['Publisher lifetime remains unknown.'] };
  const report = { schema_version: 1, publisher_id: 'fixture', crawler_summary_sha256: hash, crawler_summary_path: 'publishers/fixture/summary.json',
    counters: { ...snapshotCounters(summary, articles, attempts).counters, read_articles: 1 }, discovery_scope: 'Public current archive.',
    terminal_status: 'partial', gaps: ['A blocked article and a pending article remain.'], read_articles: [{ url: articles[0].url, reading_scope: 'Full article body.', evidence_sha256: hash }] };
  return { publisher, summary, articles, events, attempts, report, summarySha256: hash };
}

test('snapshot preserves pending, blocked, extracted and deliberately read boundaries', () => {
  const result = validatePublisherSnapshot(fixture());
  assert.deepEqual(result.issues, []);
  assert.equal(result.counters.processed_urls, 2);
  assert.equal(result.counters.http_article_attempted_urls, 2);
  assert.equal(result.unresolved, 2);
});

test('stale summaries and altered publisher reports fail independent reconciliation', () => {
  const input = fixture();
  input.summary.known_article_urls = 4;
  input.report.crawler_summary_sha256 = 'a'.repeat(64);
  input.report.counters.pending = 0;
  const result = validatePublisherSnapshot(input);
  assert(result.issues.includes('Crawler summary does not match current state snapshot'));
  assert(result.issues.includes('Authored report crawler summary binding mismatch'));
  assert(result.issues.includes('Authored report counter mismatch: pending'));
});

test('error HTML and access challenges cannot count as substantive body extraction', () => {
  const event = fixture().events[0];
  event.extraction.title = '404 Page Not Found';
  assert(validateExtraction(event).includes('Error page counted as extracted article'));
  event.extraction.title = 'Article';
  event.extraction.text += ' verify you are human';
  assert(validateExtraction(event).includes('Access challenge counted as extracted article'));
  event.receipt.http_status = 202;
  assert(validateExtraction(event).includes('Nonfinal response counted as extracted article'));
});

test('article redirects to product or collection pages are retrieval gaps', () => {
  const event = fixture().events[0];
  event.receipt.url = 'https://example.com/pricing';
  assert(validateExtraction(event).includes('Article redirect to a collection or product page counted as body retrieval'));
  event.receipt.url = 'https://example.com/blog';
  assert(validateExtraction(event).includes('Article redirect to a collection or product page counted as body retrieval'));
  event.receipt.url = 'https://example.com/blog/corrected-article';
  assert.deepEqual(validateExtraction(event), []);
});

test('alternate official published sources require pinned attribution and preserve webpage boundaries', () => {
  const event = fixture().events[0];
  event.receipt = { ...event.receipt, status: 'alternate_published_source', http_status: undefined,
    source_url: 'https://github.com/publisher/blog/blob/' + 'a'.repeat(40) + '/article.md',
    source_attribution: { url: event.url, sha256: hash, repository_commit: 'a'.repeat(40), git_source_manifest_sha256: hash,
      retrieval_method: 'official_public_git_source' } };
  assert(validateExtraction(event).includes('Alternate published source attribution incomplete'));
  event.receipt.source_attribution.source_url = event.receipt.source_url;
  assert.deepEqual(validateExtraction(event), []);
});

test('substantive articles about bot protection can quote challenge user interface text', () => {
  const event = fixture().events[0];
  event.extraction.title = 'Redesigning browser challenge pages';
  event.extraction.text = 'explanation '.repeat(400) + 'verify you are human';
  event.extraction.word_count = 404;
  event.extraction.text_sha256 = sha256(Buffer.from(event.extraction.text));
  assert.deepEqual(validateExtraction(event), []);
});

test('automatic collection and terminal scope cannot conceal unread or pending work', () => {
  const input = fixture();
  input.summary.all_article_bodies_read = true;
  input.events[0].extraction.body_read = true;
  input.report.gaps = [];
  input.report.terminal_status = 'complete';
  const issues = validatePublisherSnapshot(input).issues;
  assert(issues.includes('Automatic collection claims article reading'));
  assert(issues.some(issue => issue.startsWith('Automatic extraction is represented as article reading')));
  assert(issues.includes('Pending frontier omitted from authored gaps'));
  assert(issues.includes('Unresolved frontier represented as complete'));
});

test('receipt verifies exact raw bytes and rejects traversal or missing payload bindings', () => {
  const receipt = fixture().events[0].receipt;
  assert.deepEqual(validateReceipt(receipt, () => ({ bytes: 7, sha256: hash })), []);
  assert.deepEqual(validateReceipt(receipt, () => ({ bytes: 8, sha256: hash })), ['Receipt object digest or byte count mismatch']);
  assert.deepEqual(validateReceipt({ ...receipt, object_path: '../outside.bin' }), ['Unsafe or missing receipt object path']);
  assert.deepEqual(validateReceipt({ status: 'fetched' }), ['Fetched receipt has no bound raw object']);
  const legacy = { ...receipt };
  delete legacy.bytes;
  assert.deepEqual(validateReceipt(legacy, () => ({ bytes: 7, sha256: hash })), []);
  assert.deepEqual(validateReceipt(legacy, () => ({ bytes: 7, sha256: 'a'.repeat(64) })), ['Receipt object digest or byte count mismatch']);
});

test('missing authored evidence stays visible and nonextracted outcomes cannot retain a body count', () => {
  const input = fixture();
  input.report = undefined;
  input.events[1].extraction.word_count = 150;
  const issues = validatePublisherSnapshot(input).issues;
  assert(issues.includes('Authored publisher report missing'));
  assert(issues.some(issue => issue.startsWith('Nonextracted outcome retains substantive extraction counters')));
});

test('excluded navigation keeps its retained disposition without becoming unresolved article work', () => {
  const input = fixture();
  input.articles[2] = { url: input.articles[2].url, status: 'excluded_nonarticle', receipt: { status: 'excluded_nonarticle', transport_attempted: false } };
  input.events.push({ url: input.articles[2].url, receipt: input.articles[2].receipt, extraction: { status: 'excluded_nonarticle', text: '', word_count: 0, body_read: false } });
  input.summary.article_status_counts = { body_extracted: 1, blocked: 1, excluded_nonarticle: 1 };
  input.summary.all_known_urls_attempted = true;
  input.summary.unresolved_article_urls = 1;
  input.summary.scoped_article_urls = 2;
  input.summary.excluded_nonarticle_count = 1;
  input.summary.all_scoped_article_bodies_fetched = false;
  input.report.counters = { ...snapshotCounters(input.summary, input.articles, input.attempts).counters, read_articles: 1 };
  const result = validatePublisherSnapshot(input);
  assert.deepEqual(result.issues, []);
  assert.equal(result.excluded_nonarticle_count, 1);
  assert.equal(result.scoped_article_urls, 2);
  assert.equal(result.unresolved, 1);
  assert.equal(result.counters.processed_urls, 3);
  assert.equal(result.counters.http_article_attempted_urls, 2);
});

test('authored discovery and reading references retain explicit source digest bindings', () => {
  assert.deepEqual(reportReferenceBindings({ discovery_record_path: 'discovery/record.json', discovery_record_sha256: hash,
    read_articles: [{ evidence_path: 'reading/article.html', evidence_sha256: hash }],
    correction: { manifest_external_path: 'correction/manifest.json', manifest_sha256: hash },
    receipt: { object_path: 'objects/raw.bin', sha256: hash } }), [
    { path: 'discovery/record.json', sha256: hash }, { path: 'reading/article.html', sha256: hash },
    { path: 'correction/manifest.json', sha256: hash },
  ]);
});

test('custom runner config retains its original collector identity without invented top level metadata', () => {
  assert.equal(runCollectorSha256({ config: { collector_sha256: hash } }), hash);
  assert.equal(runCollectorSha256({ collector_sha256: hash, config: { collector_sha256: 'a'.repeat(64) } }), hash);
  assert.equal(runCollectorSha256({ config: {} }), undefined);
});
