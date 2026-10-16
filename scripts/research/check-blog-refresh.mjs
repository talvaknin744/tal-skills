// Audit crawl evidence and attribution, not a guarantee of publisher completeness.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const checkerSource = fs.readFileSync(fileURLToPath(import.meta.url));
export const checkerSha256 = crypto.createHash('sha256').update(checkerSource).digest('hex');
export const historicalDigests = {
  'research/MANIFEST.md': 'abb78077bd6c307fd5c989c6616dfb42c540c193b6b1dd17de9cffacb2c11b20',
  'research/coverage-catalog.json': '8e92b33727679bb22413bdfa65ca44e141f5f0d1884549de13df75a07869a1a6',
};
const fetchedStatuses = new Set(['body_extracted', 'body_fetched_unextracted']);
const excludedStatuses = new Set(['excluded_nonarticle', 'nonarticle']);
const hashPattern = /^[a-f0-9]{64}$/;
const errorTitle = /^(?:404\b|page not found\b|not found\b|access denied\b|just a moment\b|error\s*(?:403|404|500)\b)/i;

export function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function runCollectorSha256(run) {
  return run.collector_sha256 ?? run.config?.collector_sha256;
}

export function validateReceipt(receipt, readObject) {
  const issues = [];
  if (!receipt || typeof receipt !== 'object') return ['Missing receipt'];
  if (receipt.object_path != null || receipt.sha256 != null || receipt.bytes != null) {
    const relative = receipt.object_path;
    if (typeof relative !== 'string' || path.isAbsolute(relative) || /[\\\x00-\x1f]/.test(relative)
      || relative.split('/').some(part => !part || part === '.' || part === '..')) {
      return ['Unsafe or missing receipt object path'];
    }
    if (!hashPattern.test(receipt.sha256 ?? '') || receipt.bytes != null && (!Number.isSafeInteger(receipt.bytes) || receipt.bytes < 0)) {
      return ['Invalid receipt digest or byte count'];
    }
    if (readObject) {
      try {
        const object = readObject(relative);
        if (receipt.bytes != null && object.bytes !== receipt.bytes || object.sha256 !== receipt.sha256) issues.push('Receipt object digest or byte count mismatch');
      } catch (error) {
        issues.push(`Receipt object unavailable: ${error.code ?? error.message}`);
      }
    }
  } else if (['fetched', 'embedded_api_body', 'embedded_imported_body', 'imported_source'].includes(receipt.status)) {
    issues.push('Fetched receipt has no bound raw object');
  }
  if (receipt.source_receipt) issues.push(...validateReceipt(receipt.source_receipt, readObject));
  return issues;
}

export function validateExtraction(event) {
  const issues = [];
  const extraction = event?.extraction;
  if (!extraction || typeof extraction !== 'object') return ['Missing extraction record'];
  if (extraction.body_read !== false) issues.push('Automatic extraction is represented as article reading');
  const text = extraction.text ?? '';
  if (extraction.text_sha256 != null && sha256(Buffer.from(text)) !== extraction.text_sha256) issues.push('Extracted text digest mismatch');
  if (extraction.status === 'body_extracted') {
    if (!Number.isSafeInteger(extraction.word_count) || extraction.word_count < 120 || !text.trim()) issues.push('Substantive extraction threshold not established');
    if (errorTitle.test(extraction.title ?? '')) issues.push('Error page counted as extracted article');
    if (extraction.word_count <= 250 && /cf-chl-|checking your browser|verify you are human|enable javascript and cookies to continue/i.test(text.slice(0, 30000))) issues.push('Access challenge counted as extracted article');
    const alternate = event.receipt?.status === 'alternate_published_source';
    const attribution = event.receipt?.source_attribution;
    if (alternate && (!event.receipt.source_url || attribution?.source_url !== event.receipt.source_url
      || attribution?.url !== event.url || attribution?.sha256 !== event.receipt.sha256
      || !/^[a-f0-9]{40}$/.test(attribution?.repository_commit ?? '')
      || !hashPattern.test(attribution?.git_source_manifest_sha256 ?? '')
      || attribution?.retrieval_method !== 'official_public_git_source')) issues.push('Alternate published source attribution incomplete');
    if (!['fetched', 'embedded_api_body', 'embedded_imported_body', 'alternate_published_source'].includes(event.receipt?.status)) issues.push('Unsuccessful response counted as extracted article');
    if (event.receipt?.http_status != null && (event.receipt.http_status < 200 || event.receipt.http_status >= 300 || event.receipt.http_status === 202)) issues.push('Nonfinal response counted as extracted article');
  } else if (text || extraction.word_count) {
    issues.push('Nonextracted outcome retains substantive extraction counters');
  }
  if (fetchedStatuses.has(extraction.status) && event.receipt?.status === 'fetched') {
    try {
      const requested = new URL(event.url);
      const final = new URL(event.receipt.url ?? event.url);
      const finalPath = final.pathname.replace(/\/+$/, '') || '/';
      if (requested.pathname !== final.pathname && /\/(?:blog|posts)\//.test(requested.pathname)
        && (/^\/(?:docs?|learn|pricing|products?)(?:\/|$)/.test(finalPath) || /^\/(?:blog|posts)$/.test(finalPath))) {
        issues.push('Article redirect to a collection or product page counted as body retrieval');
      }
    } catch { issues.push('Extraction receipt contains an invalid source URL'); }
  }
  return issues;
}

export function snapshotCounters(summary, articles, attempts = []) {
  const statuses = {};
  for (const row of articles) statuses[row.status] = (statuses[row.status] ?? 0) + 1;
  const known = articles.length;
  const excluded = articles.filter(row => excludedStatuses.has(row.status)).length;
  const retrievedTargets = new Set(articles.filter(row => fetchedStatuses.has(row.status)).map(row => {
    const target = new URL(row.receipt?.url ?? row.url);
    target.hash = '';
    target.pathname = target.pathname.replace(/\/+$/, '') || '/';
    for (const key of [...target.searchParams.keys()]) if (key.startsWith('utm_')) target.searchParams.delete(key);
    return target.href;
  }));
  return {
    statuses,
    counters: {
      baseline_records: summary.config?.baseline_record_count,
      known_urls: known,
      processed_urls: known - (statuses.pending ?? 0),
      http_article_attempted_urls: new Set(attempts.filter(row => row.kind === 'article' && row.transport_attempted !== false).map(row => row.requested_url ?? row.url)).size,
      body_retrieved_urls: [...fetchedStatuses].reduce((sum, status) => sum + (statuses[status] ?? 0), 0),
      body_extracted: statuses.body_extracted ?? 0,
      body_fetched_unextracted: statuses.body_fetched_unextracted ?? 0,
      pending: statuses.pending ?? 0,
    },
    excluded_nonarticle_count: excluded,
    scoped_article_urls: known - excluded,
    terminal_dispositions: known - (statuses.pending ?? 0),
    distinct_retrieved_target_urls: retrievedTargets.size,
    retrieval_alias_count: [...fetchedStatuses].reduce((sum, status) => sum + (statuses[status] ?? 0), 0) - retrievedTargets.size,
    unresolved: known - excluded - [...fetchedStatuses].reduce((sum, status) => sum + (statuses[status] ?? 0), 0),
  };
}

export function validatePublisherSnapshot({ publisher, summary, articles, events = [], attempts = [], report, summarySha256 }) {
  const issues = [];
  const warnings = [];
  const id = publisher.publisher_id;
  if (summary.publisher_id !== id || summary.schema_version !== 1) issues.push('Crawler publisher identity or schema mismatch');
  if (summary.config?.baseline_inventory_sha256 !== publisher.inventory_sha256
    || summary.config?.baseline_coverage_sha256 !== publisher.coverage_sha256
    || summary.config?.baseline_record_count !== publisher.record_count) issues.push('Historical publisher binding mismatch');
  const urls = new Set();
  for (const row of articles) {
    if (urls.has(row.url)) issues.push(`Duplicate state URL: ${row.url}`);
    urls.add(row.url);
    try {
      const url = new URL(row.url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
      issues.push(`Invalid state URL: ${row.url}`);
    }
    if (!row.status || typeof row.status !== 'string') issues.push(`Missing state disposition: ${row.url}`);
    if (row.status !== 'pending' && !row.receipt) issues.push(`Terminal disposition has no receipt: ${row.url}`);
  }
  const derived = snapshotCounters(summary, articles, attempts);
  const statusEntries = object => JSON.stringify(Object.entries(object ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  if (statusEntries(derived.statuses) !== statusEntries(summary.article_status_counts)
    || derived.counters.known_urls !== summary.known_article_urls) issues.push('Crawler summary does not match current state snapshot');
  if (summary.all_known_urls_attempted !== (derived.counters.pending === 0)
    || summary.all_known_bodies_fetched !== (derived.unresolved === 0 && derived.excluded_nonarticle_count === 0)
    || summary.unresolved_article_urls !== derived.unresolved) issues.push('Crawler completion counters do not reconcile');
  if (summary.scoped_article_urls != null && (summary.scoped_article_urls !== derived.scoped_article_urls
    || summary.excluded_nonarticle_count !== derived.excluded_nonarticle_count
    || summary.all_scoped_article_bodies_fetched != null && summary.all_scoped_article_bodies_fetched !== (derived.unresolved === 0))) issues.push('Scoped article exclusion counters do not reconcile');
  if (summary.all_article_bodies_read !== false || summary.article_read_count !== 0) issues.push('Automatic collection claims article reading');
  if (summary.discovery_complete !== false || !summary.discovery_boundary || !Array.isArray(summary.limits) || !summary.limits.length) issues.push('Generic collection discovery limits missing');
  const latest = new Map(events.map(event => [event.url, event]));
  for (const row of articles) {
    if (row.status === 'pending') continue;
    const event = latest.get(row.url);
    if (!event || event.extraction?.status !== row.status) issues.push(`Latest body event does not match state: ${row.url}`);
    else {
      for (const issue of validateExtraction(event)) issues.push(`${issue}: ${row.url}`);
      if (event.extraction?.status === 'body_extracted' && event.extraction.method === 'main') warnings.push(`Main container extraction requires article identity review: ${row.url}`);
    }
  }
  if (report) {
    if (report.schema_version !== 1 || report.publisher_id !== id) issues.push('Authored report identity or schema mismatch');
    if (report.crawler_summary_sha256 !== summarySha256 || report.crawler_summary_path !== `publishers/${id}/summary.json`) issues.push('Authored report crawler summary binding mismatch');
    for (const [key, value] of Object.entries(derived.counters)) if (report.counters?.[key] !== value) issues.push(`Authored report counter mismatch: ${key}`);
    if (report.counters?.attempted_urls != null && report.counters.attempted_urls !== derived.counters.processed_urls) issues.push('Legacy attempted_urls disposition alias mismatch');
    if (!report.discovery_scope || !report.terminal_status || !Array.isArray(report.gaps)) issues.push('Authored discovery scope, terminal status or gaps missing');
    if (!Array.isArray(report.read_articles)) issues.push('Authored deliberate reading records missing');
    else {
      const readUrls = new Set();
      for (const article of report.read_articles) {
        if (!article.url || !article.reading_scope) issues.push('Deliberate reading source or scope missing');
        if (!hashPattern.test(article.evidence_sha256 ?? article.receipt_sha256 ?? '') && !article.retrieval_source) issues.push(`Deliberate reading evidence attribution missing: ${article.url}`);
        if (readUrls.has(article.url)) issues.push(`Repeated deliberate reading URL: ${article.url}`);
        readUrls.add(article.url);
      }
      if (report.counters?.read_articles !== readUrls.size) issues.push('Authored deliberate reading count mismatch');
    }
    if (derived.counters.pending > 0 && !report.gaps.length) issues.push('Pending frontier omitted from authored gaps');
    if (derived.unresolved > 0 && /^(?:complete|all\s+(?:posts|articles|bodies)\s+(?:read|fetched))$/i.test(report.terminal_status)) issues.push('Unresolved frontier represented as complete');
  } else issues.push('Authored publisher report missing');
  return { publisher_id: id, issues: [...new Set(issues)], warnings: [...new Set(warnings)], ...derived };
}

async function readJsonLines(file) {
  if (!fs.existsSync(file)) return [];
  const rows = [];
  let lineNumber = 0;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    lineNumber += 1;
    if (line.trim()) {
      try { rows.push(JSON.parse(line)); }
      catch { throw new Error(`Invalid JSONL at ${path.basename(file)}:${lineNumber}`); }
    }
  }
  return rows;
}

export function reportReferenceBindings(document) {
  const bindings = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'object_path' && key.endsWith('_path') && typeof value === 'string') {
        const hashKey = key.replace(/(?:_external)?_path$/, '_sha256');
        if (hashPattern.test(node[hashKey] ?? '')) bindings.push({ path: value, sha256: node[hashKey] });
      }
      if (value && typeof value === 'object') walk(value);
    }
  }
  walk(document);
  return bindings;
}

export async function auditRefresh({ archiveRoot, reportRoot, verifyObjects = true, root = repository, publisherIds, onProgress }) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'research/engineering-toolkit/2026-10-01/archive-manifest.json')));
  const selected = publisherIds ? manifest.publishers.filter(row => publisherIds.includes(row.publisher_id)) : manifest.publishers;
  if (publisherIds?.some(id => !selected.some(row => row.publisher_id === id))) throw new Error('Unknown selected publisher');
  const result = { schema_version: 1, audit_checker_sha256: checkerSha256, audited_at: new Date().toISOString(), expected_publisher_count: selected.length, surveyed_publisher_count: 60,
    audited_publisher_count: 0, authored_report_count: 0, historical_files_unchanged: true,
    object_bytes_verified: verifyObjects, all_article_bodies_read: false, publishers: [], issues: [] };
  for (const [relative, expected] of Object.entries(historicalDigests)) {
    if (sha256(fs.readFileSync(path.join(root, relative))) !== expected) {
      result.historical_files_unchanged = false;
      result.issues.push(`Historical file changed: ${relative}`);
    }
  }
  const expected = new Set(manifest.publishers.map(row => row.publisher_id));
  if (expected.size !== 60 || manifest.publisher_count !== 60) result.issues.push('Historical publisher roster count mismatch');
  if (fs.existsSync(reportRoot)) for (const file of fs.readdirSync(reportRoot)) {
    if (file.endsWith('.json') && !expected.has(file.slice(0, -5))) result.issues.push(`Unknown authored publisher report: ${file}`);
  }
  for (const publisher of selected) {
    const id = publisher.publisher_id;
    onProgress?.({ publisher_id: id, phase: 'started' });
    const external = path.join(archiveRoot, 'publishers', id);
    const summaryPath = path.join(external, 'summary.json');
    const reportPath = path.join(reportRoot, `${id}.json`);
    const entry = { publisher_id: id, issues: [], warnings: [] };
    result.publishers.push(entry);
    if (!fs.existsSync(summaryPath)) { entry.issues.push('Crawler summary missing'); continue; }
    try {
      const summaryBytes = fs.readFileSync(summaryPath);
      const summary = JSON.parse(summaryBytes);
      const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath)) : undefined;
      if (report) result.authored_report_count += 1;
      if (!fs.existsSync(path.join(reportRoot, `${id}.md`))) entry.issues.push('Authored Markdown publisher report missing');
      const [articles, sources, events, attempts, runs] = await Promise.all([
        'article-state.jsonl', 'source-state.jsonl', 'body-events.jsonl', 'attempts.jsonl', 'runs.jsonl',
      ].map(file => readJsonLines(path.join(external, file))));
      const initialIssues = entry.issues;
      Object.assign(entry, validatePublisherSnapshot({ publisher, summary, articles, events, attempts, report, summarySha256: sha256(summaryBytes) }));
      entry.issues.unshift(...initialIssues);
      entry.report_reference_bindings_checked = 0;
      if (report) for (const binding of reportReferenceBindings(report)) {
        try {
          if (path.isAbsolute(binding.path) || /[\\\x00-\x1f]/.test(binding.path)
            || binding.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe reference path');
          const file = fs.realpathSync(path.join(archiveRoot, binding.path));
          if (!file.startsWith(fs.realpathSync(archiveRoot) + path.sep)) throw new Error('Reference escapes external archive');
          if (sha256(fs.readFileSync(file)) !== binding.sha256) entry.issues.push(`Authored report reference digest mismatch: ${binding.path}`);
          entry.report_reference_bindings_checked += 1;
        } catch (error) { entry.issues.push(`Authored report reference unavailable: ${binding.path}: ${error.code ?? error.message}`); }
      }
      const objectCache = new Map();
      const readObject = verifyObjects ? relative => {
        if (objectCache.has(relative)) return objectCache.get(relative);
        const objectPath = path.join(external, relative);
        const real = fs.realpathSync(objectPath);
        if (!real.startsWith(fs.realpathSync(external) + path.sep)) throw new Error('Object escapes publisher archive');
        const bytes = fs.readFileSync(real);
        const binding = { bytes: bytes.length, sha256: sha256(bytes) };
        objectCache.set(relative, binding);
        return binding;
      } : undefined;
      const metadataGaps = new Map();
      const recordMetadataGap = receipt => {
        if (receipt?.object_path && receipt?.sha256 && receipt.bytes == null) metadataGaps.set(`${receipt.object_path}:${receipt.sha256}`, {
          object_path: receipt.object_path, sha256: receipt.sha256, recorded_bytes: null,
          observed_bytes: objectCache.get(receipt.object_path)?.bytes ?? null,
          qualification: 'The original receipt omits byte count. Independently checked object digest binds the existing raw bytes.',
        });
        if (receipt?.source_receipt) recordMetadataGap(receipt.source_receipt);
      };
      for (const receipt of [...attempts, ...articles.map(row => row.receipt).filter(Boolean), ...events.map(row => row.receipt)]) {
        for (const issue of validateReceipt(receipt, readObject)) entry.issues.push(`${issue}: ${receipt?.url ?? receipt?.requested_url ?? 'unknown'}`);
        recordMetadataGap(receipt);
      }
      for (const source of sources) {
        const receipt = source.receipt?.receipt ?? source.receipt;
        for (const issue of validateReceipt(receipt, readObject)) entry.issues.push(`${issue}: source ${source.url}`);
        recordMetadataGap(receipt);
      }
      const sourceCounts = {};
      for (const source of sources) sourceCounts[source.status] = (sourceCounts[source.status] ?? 0) + 1;
      if (JSON.stringify(Object.entries(sourceCounts).sort()) !== JSON.stringify(Object.entries(summary.source_status_counts ?? {}).sort())) entry.issues.push('Source state counters do not reconcile');
      const runIdentityGaps = runs.filter(run => !hashPattern.test(runCollectorSha256(run) ?? ''));
      if (!runs.length || !runs.some(run => hashPattern.test(runCollectorSha256(run) ?? ''))) entry.issues.push('Run collector identity missing');
      if (runIdentityGaps.length && !/(?:collector|producer|candidate|implementation).{0,120}(?:hash|identity|snapshot)|(?:hash|identity|snapshot).{0,120}(?:collector|producer|candidate|implementation)/i.test(JSON.stringify(report?.gaps ?? []))) entry.issues.push('Retained collector identity gap omitted from authored report');
      entry.retained_run_identity_gaps = runIdentityGaps.map(run => ({ started_at: run.started_at ?? null, collector_sha256: null,
        qualification: 'This retained run does not bind its original collector implementation. Raw receipts and later candidates remain separately attributable.' }));
      entry.collector_source_snapshots_verified = 0;
      entry.retained_collector_source_snapshot_gaps = [];
      for (const run of runs) {
        const collectorHash = runCollectorSha256(run);
        if (!hashPattern.test(collectorHash ?? '')) continue;
        if (run.collector_object_path) {
          for (const issue of validateReceipt({ object_path: run.collector_object_path, sha256: collectorHash, status: 'imported_source' }, readObject)) entry.issues.push(`${issue}: collector source ${collectorHash}`);
          if (verifyObjects && objectCache.get(run.collector_object_path)?.sha256 === collectorHash) entry.collector_source_snapshots_verified += 1;
        } else entry.retained_collector_source_snapshot_gaps.push({ started_at: run.started_at ?? null, collector_sha256: collectorHash,
          qualification: 'The run records a collector hash without an exact source object. It does not establish reconstruction of that original candidate.' });
      }
      entry.article_transport_attempted_urls = entry.counters.http_article_attempted_urls;
      entry.attempt_count = attempts.length;
      entry.bound_object_count = objectCache.size;
      entry.retained_receipt_metadata_gaps = [...metadataGaps.values()];
      entry.source_count = sources.length;
      entry.run_count = runs.length;
      entry.artifact_bindings = Object.fromEntries(['summary.json', 'article-state.jsonl', 'source-state.jsonl', 'body-events.jsonl', 'attempts.jsonl', 'runs.jsonl'].filter(file => fs.existsSync(path.join(external, file))).map(file => [file, sha256(fs.readFileSync(path.join(external, file)))]));
      entry.issues = [...new Set(entry.issues)];
      result.audited_publisher_count += 1;
      onProgress?.({ publisher_id: id, phase: 'completed', issue_count: entry.issues.length });
    } catch (error) { entry.issues.push(`Audit could not complete: ${error.message}`); }
  }
  result.issue_count = result.issues.length + result.publishers.reduce((sum, row) => sum + row.issues.length, 0);
  result.warning_count = result.publishers.reduce((sum, row) => sum + row.warnings.length, 0);
  result.snapshot_reconciliation_passed = result.issue_count === 0 && result.audited_publisher_count === selected.length && result.authored_report_count === selected.length;
  result.evidence_integrity_passed = result.snapshot_reconciliation_passed && verifyObjects;
  result.all_surveyed_publishers_audited = selected.length === 60 && result.audited_publisher_count === 60;
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const option = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  const archiveRoot = option('--archive-root');
  if (!archiveRoot) throw new Error('Usage: node scripts/research/check-blog-refresh.mjs --archive-root external-directory [--report-root directory] [--output file] [--skip-object-bytes] [--allow-incomplete]');
  const reportRoot = option('--report-root') ?? path.join(repository, 'research/company-blog-refresh/2026-10-14/publishers');
  const checkerArchive = path.join(path.resolve(archiveRoot), 'audit-checkers');
  fs.mkdirSync(checkerArchive, { recursive: true });
  fs.writeFileSync(path.join(checkerArchive, checkerSha256 + '.mjs'), checkerSource);
  const publisherIds = args.flatMap((argument, index) => argument === '--publisher' ? [args[index + 1]] : []);
  const result = await auditRefresh({ archiveRoot: path.resolve(archiveRoot), reportRoot: path.resolve(reportRoot), verifyObjects: !args.includes('--skip-object-bytes'), publisherIds: publisherIds.length ? publisherIds : undefined,
    onProgress: args.includes('--progress') ? progress => console.error(JSON.stringify(progress)) : undefined });
  result.audit_checker_snapshot_path = 'audit-checkers/' + checkerSha256 + '.mjs';
  if (option('--output')) fs.writeFileSync(option('--output'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ audited_publishers: result.audited_publisher_count, authored_reports: result.authored_report_count,
    issues: result.issue_count, warnings: result.warning_count, evidence_integrity_passed: result.evidence_integrity_passed,
    historical_files_unchanged: result.historical_files_unchanged }));
  if (!result.evidence_integrity_passed && !args.includes('--allow-incomplete')) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
