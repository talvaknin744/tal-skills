import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { originalPublishedDigest } from '../scripts/lib/published-file.mjs';

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
    assert.equal(originalPublishedDigest(fs.readFileSync(path.join(run, name)), `evals/phase5-cleanup/runs/2026-10-05-final/${name}`, root, digest), digest, name);
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

test('all historical focused prompts and criteria are bound to the canonical authored corpus', () => {
  const binding = read('focused-corpus-binding.json');
  assert.equal(binding.schema_version, 1);
  for (const [filename, digest] of [[binding.source_case_file, binding.source_case_file_sha256], [binding.source_rubric_file, binding.source_rubric_file_sha256]]) {
    assert.equal(hash(fs.readFileSync(path.join(root, filename))), digest, filename);
  }
  const canonicalCases = JSON.parse(fs.readFileSync(path.join(root, binding.source_case_file))).cases;
  const canonicalRubrics = JSON.parse(fs.readFileSync(path.join(root, binding.source_rubric_file))).cases;
  const selected = read('selection.json').cases.filter(row => row.new_focused_case);
  assert.deepEqual(binding.cases.map(row => row.case_id).sort(), selected.map(row => row.case_id).sort());
  const runRubrics = read('rubric.json').cases;
  for (const row of binding.cases) {
    const source = canonicalCases.find(item => item.case_id === row.case_id);
    const criteria = canonicalRubrics.find(item => item.case_id === row.case_id).criteria;
    assert.equal(hash(source.prompt), row.prompt_sha256, row.case_id);
    assert.equal(hash(JSON.stringify(sorted(criteria))), row.criteria_sha256, row.case_id);
    assert.deepEqual(runRubrics.find(item => item.case_key === row.case_key).criteria, criteria, row.case_id);
    assert.match(row.archive_request_sha256, /^[a-f0-9]{64}$/);
    assert.match(row.archive_grading_sha256, /^[a-f0-9]{64}$/);
    assert.equal(row.fixture_status, 'empty-in-authored-input-and-published-corpus');
    assert.deepEqual(row.fixture_files, [], 'missing original fixtures remain visible');
    const fixture = path.join(root, 'evals/phase5-cleanup', source.fixture_dir);
    const published = fs.existsSync(fixture) ? fs.readdirSync(fixture, { recursive: true }).filter(name => fs.statSync(path.join(fixture, name)).isFile()) : [];
    assert.deepEqual(published, [], 'the preserved empty corpus cannot silently acquire replacement fixtures');
  }
});
