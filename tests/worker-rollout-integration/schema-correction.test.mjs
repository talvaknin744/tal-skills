import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, copyFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { REPO, sha256, loadCase, inventory, freezeCandidates, prepareTrial } from '../../scripts/evals/lib.mjs';

const execFileAsync = promisify(execFile);
const corpus = path.join(REPO, 'evals/worker-rollout-integration/schema');
const originalIds = ['backfill-recreated-identity', 'shard-publication-rollback-floor', 'migration-comment-only'];
const correctedId = 'shard-publication-rollback-floor-v2';
const originalCasesHash = 'c99f23d9abe072ce5f06d3ece979845134ff1b71cc20e9cddeed9add04a2641b';
const originalCalibrationHash = 'e8cd1d28a32d82dbc6c1a511921df504500fe2e886d584cebbe0a99d7b446709';
const originalFixtureInventoryHash = '3740087752d3d65e2002d49a302d60ee481ceb27946931e3de7ce9c754060f4b';

async function records() {
  const currentBytes = await readFile(path.join(corpus, 'cases.json'));
  const originalBytes = await readFile(path.join(corpus, 'history/cases-v1-before-status-contract-v2.json'));
  const manifest = JSON.parse(await readFile(path.join(corpus, 'history/schema-v1-inputs-manifest.json')));
  return { currentBytes, originalBytes, manifest,
    current: JSON.parse(currentBytes), original: JSON.parse(originalBytes) };
}

test('schema v2 preserves original case bytes, rubric objects, raw fixtures and calibration', async () => {
  const { currentBytes, originalBytes, manifest, current, original } = await records();
  assert.equal(sha256(originalBytes), originalCasesHash);
  assert.equal(manifest.cases_sha256, originalCasesHash);
  assert.deepEqual(original.cases.map(item => item.id), originalIds);
  assert.deepEqual(current.cases.map(item => item.id), [...originalIds, correctedId]);
  assert.deepEqual(current.cases.slice(0, 3), original.cases);
  assert.deepEqual(currentBytes.subarray(0, manifest.preserved_prefix_end_byte), originalBytes.subarray(0, manifest.preserved_prefix_end_byte));
  for (const fragment of manifest.original_case_fragments) {
    const before = originalBytes.subarray(fragment.start_byte, fragment.end_byte);
    const after = currentBytes.subarray(fragment.start_byte, fragment.end_byte);
    assert.equal(sha256(before), fragment.sha256);
    assert.deepEqual(after, before);
  }
  const canonicalInventory = JSON.stringify(manifest.original_fixture_files.map(({ mode, path, sha256 }) => ({ mode, path, sha256 })));
  assert.equal(sha256(canonicalInventory), originalFixtureInventoryHash);
  assert.equal(manifest.original_fixture_files.length, 11);
  for (const item of manifest.original_fixture_files) {
    const filename = path.join(corpus, item.path);
    assert.equal(sha256(await readFile(filename)), item.sha256, item.path);
    assert.equal((await stat(filename)).mode & 0o777, item.mode, item.path);
  }
  assert.equal(sha256(await readFile(path.join(corpus, 'calibration.json'))), originalCalibrationHash);
});

test('schema corrected input adds only an authoritative encoding contract and retains exact rubric', async () => {
  const { current, original } = await records();
  const originalReview = original.cases[1];
  const corrected = current.cases[3];
  assert.equal(corrected.task_mode, 'review');
  assert.equal(corrected.editable_files, undefined);
  assert.equal(corrected.verification_argv, undefined);
  assert.equal(corrected.activation, originalReview.activation);
  assert.deepEqual(corrected.rubric, originalReview.rubric);
  assert.deepEqual(corrected.capabilities, originalReview.capabilities);
  assert.deepEqual(corrected.fixtures, [...originalReview.fixtures, 'status-code-contract.json']);
  assert.equal(corrected.prompt, originalReview.prompt.replace('against the supplied fleet, writer and row evidence.',
    'against the supplied fleet, writer and row evidence and the authoritative status-code-contract.json.'));
  for (const name of originalReview.fixtures) {
    assert.deepEqual(await readFile(path.join(REPO, corrected.fixture_dir, name)),
      await readFile(path.join(REPO, originalReview.fixture_dir, name)));
  }
  const contract = JSON.parse(await readFile(path.join(REPO, corrected.fixture_dir, 'status-code-contract.json')));
  assert.deepEqual(contract.status_codes, { pending: 0, paid: 1, refund_pending: 2 });
  assert.match(contract.compatibility, /versions\.csv/);
  assert.equal(Object.hasOwn(contract, 'expected_rows'), false);
  assert.equal(Object.hasOwn(contract, 'missing_identities'), false);
  await loadCase(REPO, 'infrastructure-change-safety', correctedId, 'worker-rollout-integration');
});

test('schema v2 oracle derives full expected rows independently and catches same-count value defects', async () => {
  const { stdout, stderr } = await execFileAsync('python3', ['-B', path.join(corpus, 'calibrate-v2.py')], { timeout: 10000 });
  assert.equal(stderr, '');
  const observed = JSON.parse(stdout);
  assert.equal(observed.cut, 207);
  assert.deepEqual(observed.expected_authorities, ['commits.csv definitive commits/rejections', 'status-code-contract.json']);
  assert.deepEqual(observed.expected_rows, [
    { key: '11', incarnation: 'order-a', source_rev: 1, status_code: 0, mapped_rev: 1 },
    { key: '22', incarnation: 'order-b', source_rev: 2, status_code: 1, mapped_rev: 2 },
    { key: '43', incarnation: 'order-c', source_rev: 1, status_code: 1, mapped_rev: 1 },
  ]);
  assert.deepEqual(observed.comparison.missing_identities, [['43', 'order-c']]);
  assert.deepEqual(observed.comparison.extra_identities, [['99', 'order-d']]);
  assert.equal(observed.comparison.same_counts, true);
  assert.deepEqual(observed.comparison.expected_minus_actual_rows, [['43', 'order-c', 1, 1, 1]]);
  assert.deepEqual(observed.comparison.actual_minus_expected_rows, [['99', 'order-d', 1, 1, 1]]);
  assert.deepEqual(observed.comparison.common_value_differences, []);
  assert.deepEqual(observed.same_count_adverse_controls, ['status_code', 'source_rev', 'mapped_rev', 'incarnation'].map(changed_field =>
    ({ changed_field, same_counts: true, detected: true })));
});

test('schema expected mapping remains available without any derived observation', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'tal-schema-independent-oracle-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const original = path.join(corpus, 'fixtures', correctedId);
  for (const name of ['commits.csv', 'status-code-contract.json']) await copyFile(path.join(original, name), path.join(temporary, name));
  const program = [
    'import importlib.util,json,sys',
    'from pathlib import Path',
    'spec=importlib.util.spec_from_file_location("oracle",sys.argv[1])',
    'module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)',
    'root=Path(sys.argv[2]);codes=json.loads((root/"status-code-contract.json").read_text())["status_codes"]',
    'print(json.dumps(module.expected_rows(module.read_csv(root/"commits.csv"),codes,207)))',
  ].join('\n');
  const { stdout } = await execFileAsync('python3', ['-B', '-c', program, path.join(corpus, 'calibrate-v2.py'), temporary], { timeout: 10000 });
  const expected = JSON.parse(stdout);
  assert.deepEqual(expected.map(row => [row.key, row.status_code]), [['11', 0], ['22', 1], ['43', 1]]);
});

test('schema v2 staging exposes only six raw inputs and keeps correction answers private', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'tal-schema-v2-stage-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const freeze = await freezeCandidates(REPO, 'worker-rollout-integration');
  const freezePath = path.join(temporary, 'freeze.json');
  await writeFile(freezePath, JSON.stringify(freeze));
  const staged = await prepareTrial({ repo: REPO, freezePath, skill: 'infrastructure-change-safety', caseId: correctedId,
    destination: path.join(temporary, 'trial') });
  const raw = await inventory(path.join(staged.workspace, 'project'));
  assert.deepEqual(raw.map(item => item.path), ['commits.csv', 'derived.csv', 'fleet.csv', 'rollout.md', 'status-code-contract.json', 'versions.csv']);
  assert.equal(staged.run.task_mode, 'review');
  assert.deepEqual(staged.run.editable_files, []);
  assert.equal(staged.run.verification_argv, null);
  for (const item of raw) assert.equal(/calibrat|correction-record|history|rubric|cases\.json/.test(item.path), false);
});
