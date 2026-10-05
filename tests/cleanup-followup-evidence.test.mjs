import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadCatalog, generateBundle } from '../scripts/toolkit/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = filename => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
const readRun = filename => readJson(`evals/cleanup-followup/runs/2026-10-05/${filename}`);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const pythonJson = value => Array.isArray(value) ? `[${value.map(pythonJson).join(', ')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${pythonJson(key)}: ${pythonJson(value[key])}`).join(', ')}}`
    : JSON.stringify(value).replace(/[\u007f-\uffff]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
const comparePath = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const digestRows = rows => sha256(rows.map(row => `${row.path}\0${row.sha256}\n`).join(''));

test('cleanup follow-up archive preserves every retained file by its recorded digest', () => {
  const archive = readRun('archive-manifest.json');
  assert.equal(archive.schema_version, 1);
  assert.equal(archive.release_status, 'uploaded-digest-verified');
  assert.equal(archive.asset.member_hash_verification, 'all-members-match');
  assert.match(archive.asset.archive_sha256, /^[a-f0-9]{64}$/);
  assert.ok(Object.keys(archive.retained_files).length > 0);
  for (const [filename, expected] of Object.entries(archive.retained_files)) {
    assert.ok(!filename.startsWith('/') && !filename.split(/[\\/]/).includes('..'), filename);
    assert.match(expected, /^[a-f0-9]{64}$/);
    assert.equal(sha256(fs.readFileSync(path.join(root, filename))), expected, filename);
  }
});

test('canonical versioned cases retain prompt, criteria and fixture identities', () => {
  const corpus = readJson('evals/cleanup-followup/cases.json');
  const matrix = readRun('matrix.json');
  assert.equal(corpus.schema_version, 1);
  assert.equal(corpus.cases.length, matrix.focused_cases.length);
  assert.deepEqual(corpus.cases.map(row => row.key).sort(), matrix.focused_cases.map(row => row.key).sort());
  for (const row of corpus.cases) {
    assert.equal(sha256(row.prompt), row.prompt_sha256, row.key);
    assert.equal(sha256(pythonJson(row.criteria)), row.criteria_sha256, row.key);
    assert.ok(row.fixture_dir.startsWith('fixtures/'), row.key);
    const fixtureDir = path.join(root, 'evals/cleanup-followup', row.fixture_dir);
    const actual = fs.readdirSync(fixtureDir, { recursive: true }).filter(name => fs.statSync(path.join(fixtureDir, name)).isFile()).sort();
    assert.deepEqual(actual, row.fixture_files.map(file => file.path).sort(), row.key);
    for (const fixture of row.fixture_files) {
      assert.equal(sha256(fs.readFileSync(path.join(fixtureDir, fixture.path))), fixture.sha256, `${row.key}/${fixture.path}`);
    }
  }
  const handoff = readJson('evals/cleanup-followup/handoff-fallback-cases.json');
  assert.equal(handoff.schema_version, 1);
  assert.equal(handoff.cases.length, 1);
  for (const row of handoff.cases) {
    assert.equal(sha256(row.prompt), row.prompt_sha256, row.key);
    assert.equal(row.criteria_sha256_encoding, 'criteria.json file bytes: {criteria: [...]} serialized with two-space JSON indentation and a trailing LF');
    assert.equal(sha256(JSON.stringify({ criteria: row.criteria }, null, 2) + '\n'), row.criteria_sha256, row.key);
    assert.deepEqual(row.install_skill_names, ['python-backend']);
    assert.ok(row.fixture_dir.startsWith('fixtures/'), row.key);
    const fixtureDir = path.join(root, 'evals/cleanup-followup', row.fixture_dir);
    const actual = fs.readdirSync(fixtureDir, { recursive: true }).filter(name => fs.statSync(path.join(fixtureDir, name)).isFile()).sort();
    assert.deepEqual(actual, row.fixture_files.map(file => file.path).sort(), row.key);
    for (const fixture of row.fixture_files) {
      const bytes = fs.readFileSync(path.join(fixtureDir, fixture.path));
      assert.equal(sha256(bytes), fixture.sha256, `${row.key}/${fixture.path}`);
      assert.deepEqual(bytes, fs.readFileSync(path.join(root, row.fixture_source, fixture.path)));
    }
  }
});

test('retained source prompts and rubrics still match their original case files', () => {
  const matrix = readRun('matrix.json');
  for (const row of matrix.existing_cases) {
    const filename = row.source_case_file;
    assert.equal(sha256(fs.readFileSync(path.join(root, filename))), row.source_case_file_sha256, filename);
    const source = readJson(filename).cases.find(item => (item.id ?? item.case_id) === row.case_id);
    assert.ok(source, row.key);
    assert.equal(sha256(source.prompt), row.prompt_sha256, row.key);
    const criteria = row.skill === 'phase5-cleanup'
      ? readJson('evals/phase5-cleanup/rubric.json').cases.find(item => item.case_id === row.case_id).criteria
      : source.rubric;
    assert.ok(criteria?.length, row.key);
    assert.equal(sha256(pythonJson(criteria)), row.criteria_sha256, row.key);
    const fixtureDir = path.join(root, source.fixture_dir.startsWith('evals/')
      ? source.fixture_dir : path.join(path.dirname(filename), source.fixture_dir));
    for (const fixture of row.fixture.files) {
      assert.equal(sha256(fs.readFileSync(path.join(fixtureDir, fixture.path))), fixture.sha256, `${row.key}/${fixture.path}`);
    }
  }
});

test('current published candidate matches the generated and canonical package identities', () => {
  const historicalIdentity = readRun('candidate-identity-r3.json');
  const historicalManifest = readRun('identities/revised-r3.json');
  assert.equal(digestRows(historicalIdentity.canonical.files), historicalIdentity.canonical.source_digest);
  assert.equal(historicalIdentity.codex.source_digest, historicalManifest.frozen_bundle_digest);
  assert.equal(digestRows(historicalManifest.files), historicalManifest.source_digest);
  const current = readJson('evals/current-candidate.json');
  assert.equal(current.schema_version, 1);
  for (const filename of [current.identity_path, current.manifest_path]) {
    assert.ok(filename.startsWith('evals/') && !filename.split(/[\\/]/).includes('..'), filename);
  }
  const identity = readJson(current.identity_path);
  const manifest = readJson(current.manifest_path);
  const generated = generateBundle(loadCatalog(root), { host: 'codex', skills: identity.skills });
  assert.equal(generated.sourceDigest, identity.codex.generator_source_digest);
  const currentFiles = [...generated.files]
    .filter(([filename]) => filename.startsWith('.agents/skills/'))
    .map(([filename, file]) => ({ path: filename.slice('.agents/skills/'.length), sha256: sha256(file.bytes) }))
    .sort((a, b) => comparePath(a.path, b.path));
  const manifestFiles = manifest.files.map(({ path: filename, sha256: digest }) => ({ path: filename, sha256: digest }))
    .sort((a, b) => comparePath(a.path, b.path));
  assert.deepEqual(currentFiles, manifestFiles);
  assert.equal(digestRows(currentFiles), manifest.source_digest);
  assert.equal(identity.codex.source_digest, manifest.frozen_bundle_digest);
  const frozenCodex = identity.codex.files.map(file => ({ path: file.path, sha256: file.sha256 }))
    .sort((a, b) => comparePath(a.path, b.path));
  const currentFrozen = [...generated.files]
    .filter(([filename]) => filename.startsWith('.agents/skills/'))
    .map(([filename, file]) => ({ path: filename, sha256: sha256(file.bytes) }))
    .sort((a, b) => comparePath(a.path, b.path));
  assert.deepEqual(currentFrozen, frozenCodex);
  const catalog = loadCatalog(root);
  const canonical = identity.skills.flatMap(name => {
    const skill = catalog.skills.get(name);
    return [...skill.files].map(([filename, file]) => ({
      path: `.agents/skills/${name}/${filename.slice(skill.prefix.length + 1)}`,
      sha256: sha256(file.bytes),
    }));
  }).sort((a, b) => comparePath(a.path, b.path));
  assert.deepEqual(canonical, [...identity.canonical.files].sort((a, b) => comparePath(a.path, b.path)));
  assert.equal(digestRows(identity.canonical.files), identity.canonical.source_digest);
});

test('score records cover all criterion IDs and weighted totals, including retained capacity retry', () => {
  const report = readRun('report.json');
  assert.equal(report.total_attempts, 120);
  assert.equal(report.grading.scored_runs, 119);
  const finalScores = report.grading.full_scores.flatMap(readRun);
  assert.equal(finalScores.length, 119);
  assert.equal(new Set(finalScores.map(row => `${row.candidate}/${row.case_key}`)).size, 119);
  for (const row of finalScores) {
    const result = report.cases.flatMap(item => item.runs.map(run => ({ case_key: item.case_key, ...run })))
      .find(run => run.case_key === row.case_key && run.candidate === row.candidate);
    assert.ok(result, row.case_key);
    const expected = corpusCriteria(row.case_key);
    assert.deepEqual(row.criteria.map(item => item.id).sort(), expected.map(item => item.id).sort(), row.case_key);
    assert.ok(row.criteria.every(item => [0, 1, 2].includes(item.score)), row.case_key);
    assert.deepEqual(row.critical_results, row.criteria.filter(item => item.severity === 'critical').map(({ id, score }) => ({ id, score })));
    assert.equal(row.unsuccessful_due_to_critical_failure, row.critical_results.some(item => item.score === 0));
    assert.equal(row.critical_partial, row.critical_results.some(item => item.score === 1));
    for (const severity of ['major', 'minor']) {
      const criteria = row.criteria.filter(item => item.severity === severity);
      const total = row[`${severity}_weighted`];
      const weight = severity === 'major' ? 2 : 1;
      assert.equal(total.maximum, criteria.length * 2 * weight, `${row.case_key}/${severity} maximum`);
      assert.equal(total.earned, criteria.reduce((sum, item) => sum + item.score * weight, 0), `${row.case_key}/${severity} earned`);
    }
    assert.deepEqual(result.score.criteria.map(item => item.id).sort(), expected.map(item => item.id).sort(), row.case_key);
  }
  const capacity = report.cases.flatMap(item => item.runs.map(run => ({ case_key: item.case_key, ...run })))
    .find(run => run.candidate === 'revised-r2-capacity-retry');
  assert.ok(capacity, 'the capacity retry attempt remains represented');
  assert.equal(capacity.execution_status, 'executed');
  assert.equal(capacity.score_status, 'scored');
  assert.ok(readRun('scores/revised-r2-capacity-retry.json').some(row => row.case_key === capacity.case_key));
  const originalCapacityFailure = report.cases.flatMap(item => item.runs.map(run => ({ case_key: item.case_key, ...run })))
    .find(run => run.case_key === capacity.case_key && run.candidate === 'revised-r2' && run.execution_status !== 'executed');
  assert.ok(originalCapacityFailure, 'the original capacity failure remains alongside the retry');
  const r1Root = 'evals/cleanup-followup/runs/2026-10-05-r1/';
  const r1 = readJson(`${r1Root}report.json`);
  const r1Scores = r1.grading.full_scores.flatMap(filename => readJson(r1Root + filename));
  assert.equal(r1.total_attempts, 39);
  assert.equal(r1.grading.scored_runs, 39);
  assert.equal(r1Scores.length, 39);
  assert.equal(new Set(r1Scores.map(row => row.case_key)).size, 39);
  const r1Matrix = readJson(`${r1Root}matrix.json`);
  assert.deepEqual(r1Scores.map(row => row.case_key).sort(),
    [...r1Matrix.existing_cases, ...r1Matrix.focused_cases].map(row => row.key).sort());
  for (const row of r1Scores) {
    const expected = readJson('evals/cleanup-followup/handoff-fallback-cases.json').cases.find(item => item.key === row.case_key)?.criteria
      ?? corpusCriteria(row.case_key);
    assert.deepEqual(row.criteria.map(item => [item.id, item.severity]).sort(), expected.map(item => [item.id, item.severity]).sort(), row.case_key);
    assert.ok(row.criteria.every(item => [0, 1, 2].includes(item.score)), row.case_key);
    assert.equal(row.unsuccessful_due_to_critical_failure, row.criteria.some(item => item.severity === 'critical' && item.score === 0));
    assert.equal(row.critical_partial, row.criteria.some(item => item.severity === 'critical' && item.score === 1));
    for (const severity of ['major', 'minor']) {
      const criteria = row.criteria.filter(item => item.severity === severity);
      const weight = severity === 'major' ? 2 : 1;
      assert.deepEqual(row[`${severity}_weighted`], { earned: criteria.reduce((sum, item) => sum + item.score * weight, 0), maximum: criteria.length * 2 * weight });
    }
  }
  assert.equal(r1.critical_failures, r1Scores.filter(row => row.unsuccessful_due_to_critical_failure).length);
  assert.equal(r1.critical_partials, r1Scores.filter(row => row.critical_partial).length);
  assert.deepEqual(r1.grading.numerical_regrade_changes.map(row => [row.case_key, row.criterion, row.initial_score, row.regrade_score]).sort(), [
    ['failure-oriented-testing--race-clean-lost-update', 'retain-and-limit', 2, 1],
    ['microservice-data--saga-interleaving', 'read-only', 1, 2],
  ].sort());
  const absent = r1Scores.find(row => row.case_key === 'followup-v3--standalone-absent-idempotency-sibling-v3');
  assert.equal(absent.critical_partial, true, 'the missing-sibling partial remains visible');
  const archive = readJson(`${r1Root}archive-manifest.json`);
  assert.equal(archive.release_status, 'prepared-not-uploaded');
  assert.equal(archive.inventory_verified, true);
  for (const [filename, digest] of Object.entries(archive.retained_files)) {
    assert.equal(sha256(fs.readFileSync(path.join(root, filename))), digest, filename);
  }
});

function corpusCriteria(caseKey) {
  const authored = readJson('evals/cleanup-followup/cases.json').cases.find(row => row.key === caseKey);
  if (authored) return authored.criteria;
  const matrixCase = readRun('matrix.json').existing_cases.find(row => row.key === caseKey);
  if (!matrixCase) throw new Error(`No canonical criteria for ${caseKey}`);
  const source = readJson(matrixCase.source_case_file).cases.find(row => (row.id ?? row.case_id) === matrixCase.case_id);
  return matrixCase.skill === 'phase5-cleanup'
    ? readJson('evals/phase5-cleanup/rubric.json').cases.find(row => row.case_id === matrixCase.case_id).criteria
    : source.rubric;
}
