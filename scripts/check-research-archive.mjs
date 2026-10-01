// Validate published archive attribution, not article reading or runtime behavior.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateCoverageAttribution } from './research/coverage.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = path.join(root, 'docs/research/engineering-toolkit/2026-10-01');
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'archive-manifest.json'), 'utf8'));
const survey = JSON.parse(fs.readFileSync(path.join(base, '../publisher-survey.json'), 'utf8'));
const expected = new Set(survey.publishers.map(item => item.id));
const seen = new Set();
let count = 0;
function readBound(relative, expectedHash) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || /[\\\x00-\x1f]/.test(relative)
    || relative.split('/').some(part => !part || part === '..' || part === '.')) throw new Error(`Unsafe research path: ${relative}`);
  const bytes = fs.readFileSync(path.join(base, relative));
  if (createHash('sha256').update(bytes).digest('hex') !== expectedHash) throw new Error(`Archive source changed: ${relative}`);
  return JSON.parse(bytes);
}
for (const publisher of manifest.publishers) {
  const id = publisher.publisher_id;
  if (!expected.has(id) || seen.has(id)) throw new Error(`Unknown or repeated publisher: ${id}`);
  seen.add(id);
  const inventory = readBound(publisher.inventory_path, publisher.inventory_sha256);
  const proof = readBound(publisher.coverage_path, publisher.coverage_sha256);
  validateCoverageAttribution(publisher, proof);
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
  count += records.length;
}
if (seen.size !== expected.size || manifest.publisher_count !== expected.size || count !== manifest.metadata_record_count
  || manifest.all_article_bodies_read !== false) throw new Error('Archive coverage/count/reading boundary mismatch');
console.log(`Research archive attribution valid: ${seen.size} surveyed publishers, ${count} metadata records; body reading is separate`);
