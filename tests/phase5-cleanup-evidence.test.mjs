import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = path.join(root, 'evals/phase5-cleanup/runs/2026-10-05-final');
const read = name => JSON.parse(fs.readFileSync(path.join(run, name), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sorted = value => Array.isArray(value) ? value.map(sorted)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const rubricHashes = criteria => {
  const literal = JSON.stringify(sorted(criteria));
  const ascii = literal.replace(/[\u0080-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  return [hash(literal), hash(ascii)];
};

test('final cleanup evidence binds retained records, candidate identity and unchanged criteria', () => {
  const archive = read('archive-manifest.json');
  for (const [name, digest] of Object.entries(archive.retained_files)) {
    assert.equal(path.basename(name), name);
    assert.equal(hash(fs.readFileSync(path.join(run, name))), digest, name);
  }
  assert.equal(archive.release_status, 'uploaded-digest-verified');
  const candidate = read('candidate-identity.json');
  assert.equal(hash(candidate.files.map(file => file.path + '\0' + file.sha256 + '\n').join('')), candidate.source_digest);
  assert.equal(archive.candidate_source_digest, candidate.source_digest);
  const selection = read('selection.json');
  const rubric = new Map(read('rubric.json').cases.map(row => [row.case_key, row]));
  const scores = read('score.json');
  assert.equal(scores.case_results.length, selection.cases.length);
  assert.equal(new Set(scores.case_results.map(row => row.case_key)).size, selection.cases.length);
  for (const selected of selection.cases) {
    const key = selected.skill + '--' + selected.case_id;
    const criteria = rubric.get(key);
    assert.ok(criteria, key);
    assert.ok(rubricHashes(criteria.criteria).includes(selected.rubric_sha256 ?? criteria.rubric_sha256), key);
    if (selected.existing_case) {
      assert.equal(hash(fs.readFileSync(path.join(root, selected.source_case_file))), selected.source_case_file_sha256, key);
    }
    const result = scores.case_results.find(row => row.case_key === key);
    if (result.grading_status !== 'scored') continue;
    assert.deepEqual(result.score.criteria.map(row => row.id).sort(), criteria.criteria.map(row => row.id).sort(), key);
    assert.ok(result.score.criteria.every(row => [0, 1, 2].includes(row.score)), key);
    assert.deepEqual(result.score.critical_results.map(row => row.id).sort(), criteria.criteria.filter(row => row.severity === 'critical').map(row => row.id).sort(), key);
  }
});
