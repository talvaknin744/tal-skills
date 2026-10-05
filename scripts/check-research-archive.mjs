// Validate published archive attribution, not article reading or runtime behavior.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCoverageAttribution, validateCoverageCatalog } from './research/coverage.mjs';
import { parseResearchArchiveManifest, validateResearchArchiveCompleteness, validateResearchCoverageBindings, validateResearchInventoryBindings } from './research/archive-manifest.mjs';
import { originalPublishedDigest, sha256 } from './lib/published-file.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const restoredRoot = process.argv[2] && path.resolve(process.argv[2]);
if (process.argv.length > 3) throw new Error('Usage: node scripts/check-research-archive.mjs [restored-repository-root]');
const base = path.join(root, 'research/engineering-toolkit/2026-10-01');
const manifestPath = path.join(base, 'archive-manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const survey = JSON.parse(fs.readFileSync(path.join(base, '../publisher-survey.json'), 'utf8'));
const researchArchive = parseResearchArchiveManifest(fs.readFileSync(path.join(root, 'research/MANIFEST.md'), 'utf8'));
const coverageCatalogBytes = fs.readFileSync(path.join(root, 'research/coverage-catalog.json'));
if (sha256(coverageCatalogBytes) !== researchArchive.coverageCatalogSha256) throw new Error('Coverage catalog digest mismatch');
const coverageCatalog = JSON.parse(coverageCatalogBytes);
validateResearchArchiveCompleteness(researchArchive, coverageCatalog);
validateResearchInventoryBindings(researchArchive, manifest);
validateResearchCoverageBindings(researchArchive, manifest);
const catalogEntries = validateCoverageCatalog(manifest, coverageCatalog, {
  path: 'docs/research/engineering-toolkit/2026-10-01/archive-manifest.json',
  sha256: originalPublishedDigest(manifestBytes, 'docs/research/engineering-toolkit/2026-10-01/archive-manifest.json'),
});
const expected = new Set(survey.publishers.map(item => item.id));
const seen = new Set();
let count = 0;
function readProof(relative, expectedHash, repository = root) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || /[\\\x00-\x1f]/.test(relative)
    || relative.split('/').some(part => !part || part === '..' || part === '.')) throw new Error(`Unsafe research path: ${relative}`);
  const bytes = fs.readFileSync(path.join(repository, 'docs/research/engineering-toolkit/2026-10-01', relative));
  if (originalPublishedDigest(bytes, path.posix.join('docs/research/engineering-toolkit/2026-10-01', relative), repository) !== expectedHash) throw new Error(`Archive source changed: ${relative}`);
  return JSON.parse(bytes);
}
for (const publisher of manifest.publishers) {
  const id = publisher.publisher_id;
  if (!expected.has(id) || seen.has(id)) throw new Error(`Unknown or repeated publisher: ${id}`);
  seen.add(id);
  const catalogEntry = catalogEntries.get(id);
  const proof = { publisher_id: id, [catalogEntry.summary_key]: catalogEntry.summary, [catalogEntry.gaps_key ?? 'gaps']: catalogEntry.gaps };
  validateCoverageAttribution(publisher, proof);
  if (restoredRoot) validateCoverageAttribution(publisher, readProof(publisher.coverage_path, publisher.coverage_sha256, restoredRoot));
  if (restoredRoot) {
    const inventoryRelative = path.posix.join('docs/research/engineering-toolkit/2026-10-01', publisher.inventory_path);
    const bytes = fs.readFileSync(path.join(restoredRoot, inventoryRelative));
    if (originalPublishedDigest(bytes, inventoryRelative, restoredRoot) !== publisher.inventory_sha256) throw new Error(`Restored inventory changed: ${id}`);
    const inventory = JSON.parse(bytes);
    let records;
    if (publisher.inventory_format === 'array') records = inventory;
    else if (publisher.inventory_format === 'publisher_entries') records = inventory.publishers.find(item => item.publisher_id === id)?.entries;
    else if (['records', 'articles'].includes(publisher.inventory_format)) records = inventory[publisher.inventory_format]?.filter(item => !item.publisher_id || item.publisher_id === id);
    else throw new Error(`Unknown inventory format: ${id}`);
    if (!Array.isArray(records) || records.length !== publisher.record_count) throw new Error(`Count mismatch: ${id}`);
    const urls = new Set();
    for (const record of records) {
      const raw = record.url ?? record.canonical_url;
      const url = new URL(raw);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(`Invalid metadata URL: ${id}`);
      url.hash = ''; url.search = ''; url.pathname = url.pathname.replace(/\/+$/, '');
      if (urls.has(url.href)) throw new Error(`Duplicate canonical metadata URL: ${id}: ${raw}`);
      urls.add(url.href);
      for (const key of ['html', 'body_html', 'article_body', 'content']) {
        if (typeof record[key] === 'string' && record[key].length > 100) throw new Error(`Article payload in metadata: ${id}: ${key}`);
      }
    }
  }
  if (!Number.isSafeInteger(publisher.record_count) || publisher.record_count < 0) throw new Error(`Invalid archived count: ${id}`);
  count += publisher.record_count;
}
if (seen.size !== expected.size || manifest.publisher_count !== expected.size || count !== manifest.metadata_record_count
  || manifest.all_article_bodies_read !== false) throw new Error('Archive coverage/count/reading boundary mismatch');
console.log(`Research archive attribution valid: ${seen.size} surveyed publishers, ${count} metadata records; ${restoredRoot ? 'restored inventory bytes, counts, URLs and payloads checked' : 'inventory digests/counts retained; raw URLs and payloads require the restored archive'}; body reading is separate`);
