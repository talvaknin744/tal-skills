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
const compactPythonJson = value => Array.isArray(value) ? `[${value.map(compactPythonJson).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${compactPythonJson(key)}:${compactPythonJson(value[key])}`).join(',')}}`
    : pythonJson(value);
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
  const activation = readJson('evals/cleanup-followup/activation-cases.json');
  assert.equal(activation.cases.length, 1);
  const marker = activation.cases[0];
  const originalExplicit = corpus.cases.find(row => row.key === marker.source_explicit_case_key);
  assert.equal(marker.prompt, originalExplicit.prompt);
  assert.equal(sha256(marker.prompt), marker.prompt_sha256);
  assert.deepEqual(marker.content_criteria, originalExplicit.criteria);
  for (const kind of ['content', 'marker']) {
    const compact = compactPythonJson(marker[`${kind}_criteria`]);
    assert.equal(sha256(compact), marker[`${kind}_criteria_sha256`]);
  }
  assert.deepEqual(marker.marker_criteria.map(row => row.id), ['decision-boundary-semantic-marker', 'semantic-completion-conditions']);
  for (const fixture of marker.fixture_files) {
    const bytes = fs.readFileSync(path.join(root, 'evals/cleanup-followup', marker.fixture_dir, fixture.path));
    assert.equal(sha256(bytes), fixture.sha256);
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, marker.fixture_source, fixture.path)));
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
  const claude = readJson('evals/cleanup-followup/claude-code-cases.json');
  assert.equal(claude.schema_version, 1);
  assert.equal(claude.cases.length, 5);
  assert.deepEqual(claude.cases.map(row => row.key), [
    'claude-code--python-idempotency-handoff-v4',
    'claude-code--architecture-plugin-unqualified-v1',
    'claude-code--architecture-plugin-namespaced-v1',
    'claude-code--architecture-plugin-unqualified-v2',
    'claude-code--architecture-plugin-namespaced-v2',
  ]);
  const byKey = new Map(claude.cases.map(row => [row.key, row]));
  for (const row of claude.cases) {
    assert.equal(sha256(row.prompt), row.prompt_sha256, row.key);
    assert.equal(sha256(JSON.stringify({ criteria: row.criteria }, null, 2) + '\n'), row.criteria_sha256, row.key);
    assert.ok(row.fixture_dir.startsWith('evals/cleanup-followup/fixtures/'), row.key);
    const fixtureDir = path.join(root, row.fixture_dir);
    const actual = fs.readdirSync(fixtureDir, { recursive: true }).filter(name => fs.statSync(path.join(fixtureDir, name)).isFile()).sort();
    assert.deepEqual(actual, row.fixture_files.map(file => file.path).sort(), row.key);
    const digest = sha256(row.fixture.files.map(file => `${file.path}\0${file.sha256}\n`).join(''));
    assert.equal(digest, row.fixture.source_digest, row.key);
    for (const fixture of row.fixture_files) {
      const bytes = fs.readFileSync(path.join(fixtureDir, fixture.path));
      assert.equal(sha256(bytes), fixture.sha256, `${row.key}/${fixture.path}`);
      assert.equal(bytes.length, fixture.bytes, `${row.key}/${fixture.path}`);
      assert.deepEqual(bytes, fs.readFileSync(path.join(root, row.fixture_source, fixture.path)), `${row.key}/${fixture.path} source copy`);
    }
  }
  const unqualified = byKey.get('claude-code--architecture-plugin-unqualified-v1');
  const namespaced = byKey.get('claude-code--architecture-plugin-namespaced-v1');
  assert.deepEqual(unqualified.criteria, namespaced.criteria);
  assert.deepEqual(unqualified.fixture, namespaced.fixture);
  assert.equal(unqualified.prompt.replace('/architecture', '/tal-skills:architecture'), namespaced.prompt);
  const unqualifiedV2 = byKey.get('claude-code--architecture-plugin-unqualified-v2');
  const namespacedV2 = byKey.get('claude-code--architecture-plugin-namespaced-v2');
  assert.deepEqual(unqualifiedV2.criteria, namespacedV2.criteria);
  assert.deepEqual(unqualifiedV2.fixture, unqualified.fixture);
  assert.ok(unqualifiedV2.prompt.startsWith('/architecture '), 'v2 places the command first');
  assert.ok(namespacedV2.prompt.startsWith('/tal-skills:architecture '), 'v2 places the namespaced command first');
  assert.equal(unqualifiedV2.prompt.replace('/architecture', '/tal-skills:architecture'), namespacedV2.prompt);
  assert.equal(unqualifiedV2.criteria[0].id, 'host-command-resolution');
  assert.notDeepEqual(unqualifiedV2.criteria, unqualified.criteria, 'v1 criteria are retained unchanged beside the v2 contract');
  assert.equal(byKey.get('claude-code--python-idempotency-handoff-v4').criteria[0].id, 'actual-python-skill');
  assert.equal(byKey.get('claude-code--python-idempotency-handoff-v4').criteria[1].id, 'actual-idempotency-handoff');
});

test('Claude Code R4 report retains blocked counts and a verifiable external archive receipt', () => {
  const report = fs.readFileSync(path.join(root, 'evals/cleanup-followup/claude-code-report.md'), 'utf8');
  const review = fs.readFileSync(path.join(root, 'evals/claude-code/runs/2026-10-05/review.md'), 'utf8');
  const manifest = readJson('evals/claude-code/runs/2026-10-05/archive-manifest.json');
  assert.match(report, /\.\.\/claude-code\/runs\/2026-10-05\/review\.md/);
  assert.match(report, /\.\.\/claude-code\/runs\/2026-10-05\/archive-manifest\.json/);
  assert.match(review, /\*\*Status: blocked\.\*\*/);
  assert.equal(manifest.status, 'blocked');
  assert.equal(manifest.execution.completed_runs, 0);
  assert.equal(manifest.execution.graded_runs, 0);
  assert.equal(manifest.execution.auth_blocked_model_attempts, 2);
  assert.equal(manifest.execution.canonical_plugin_cases_started, 0);
  assert.equal(manifest.execution.architecture_syntax_cases_started, 0);
  assert.equal(manifest.execution.generated_v4_skill_catalog_observed, true);
  assert.equal(manifest.installation.declared_skill_paths, 35);
  assert.equal(manifest.installation.all_35_skill_trees_match_marketplace, true);
  assert.match(manifest.external_archive.filename, /^remaining-claude-code-r4-2026-10-05\.tar\.zst$/);
  assert.match(manifest.external_archive.sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.external_archive.zstd_test, 'passed');
  for (const hash of Object.values(manifest.receipt_hashes_sha256)) assert.match(hash, /^[a-f0-9]{64}$/);
  const publication = readJson('evals/claude-code/runs/2026-10-05/publication-receipt.json');
  assert.equal(publication.format_version, 1);
  assert.equal(publication.original_archive.sha256, manifest.external_archive.sha256);
  assert.equal(publication.original_archive.filename, manifest.external_archive.filename);
  assert.deepEqual(publication.archive_sha256_binding, {
    original_sha256: publication.original_archive.sha256,
    public_sha256: publication.public_archive.sha256,
  });
  assert.equal(publication.public_archive.filename, 'tal-skills-claude-code-2026-10-05.tar.zst');
  assert.match(publication.public_archive.sha256, /^[a-f0-9]{64}$/);
  const inventory = publication.inventory;
  assert.equal(inventory.total_members, manifest.external_archive.tar_member_count);
  assert.equal(inventory.members.length, inventory.total_members);
  assert.equal(inventory.regular_file_mappings.length, inventory.regular_files);
  assert.equal(inventory.regular_files + inventory.directories + inventory.other_members, inventory.total_members);
  assert.equal(inventory.same_paths_and_types_as_original, true);
  assert.equal(new Set(inventory.members.map(row => row.path)).size, inventory.total_members);
  const mappings = new Map(inventory.regular_file_mappings.map(row => [row.path, row]));
  assert.equal(mappings.size, inventory.regular_files);
  for (const member of inventory.members) {
    assert.ok(!member.path.startsWith('/') && !member.path.split(/[\\/]/).includes('..'), member.path);
    if (member.type === 'regular') {
      const mapping = mappings.get(member.path);
      assert.ok(mapping, member.path);
      assert.equal(mapping.original_sha256, member.original_sha256, member.path);
      assert.equal(mapping.public_sha256, member.public_sha256, member.path);
      for (const hash of [mapping.original_sha256, mapping.public_sha256]) assert.match(hash, /^[a-f0-9]{64}$/);
      assert.equal(mapping.redacted, mapping.original_sha256 !== mapping.public_sha256, member.path);
    }
  }
  assert.equal(inventory.regular_file_mappings.filter(row => row.redacted).length, publication.redaction.regular_files_changed);
  assert.equal(publication.redaction.binary_files_modified, false);
  assert.equal(publication.redaction.text_files_only, true);
  assert.deepEqual(Object.values(publication.content_scan_counts_only), [0, 0, 0, 0]);
  assert.equal(Object.keys(publication.receipt_hashes_sha256).length, Object.keys(manifest.receipt_hashes_sha256).length);
  for (const [filename, hash] of Object.entries(manifest.receipt_hashes_sha256)) {
    const memberPath = `remaining-claude-code/${filename}`;
    const receipt = publication.receipt_hashes_sha256[memberPath];
    assert.ok(receipt, filename);
    assert.equal(receipt.original_sha256, hash, filename);
    assert.equal(receipt.public_member_present, true, filename);
    assert.equal(receipt.public_sha256, mappings.get(memberPath).public_sha256, filename);
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
  const r3Root = 'evals/cleanup-followup/runs/2026-10-05-activation/';
  const r3 = readJson(`${r3Root}report.json`);
  const identity = readJson(r3Root + r3.candidate.candidate_identity_path);
  const manifest = readJson(r3Root + r3.candidate.codex_manifest_path);
  assert.equal(r3.candidate.canonical_source_digest, identity.canonical.source_digest);
  assert.equal(r3.candidate.codex_package_digest, identity.codex.source_digest);
  assert.equal(r3.candidate.codex_package_digest, manifest.frozen_bundle_digest);
  assert.equal(r3.candidate.source_equivalent_commit, identity.source_equivalent_commit);
  assert.equal(r3.candidate.candidate_identity_file_sha256, sha256(fs.readFileSync(path.join(root, r3Root, r3.candidate.candidate_identity_path))));
  assert.equal(r3.candidate.codex_manifest_file_sha256, sha256(fs.readFileSync(path.join(root, r3Root, r3.candidate.codex_manifest_path))));
  const table = readJson(`${r3Root}mixed-stage-34-activation-table.json`).rows;
  const selected = readRun('matrix.json').existing_cases.filter(row => row.group === 'positive' && row.skill !== 'architecture');
  assert.equal(table.length, 34);
  assert.deepEqual(table.map(row => row.case_key).sort(), selected.map(row => row.key).sort());
  assert.equal(new Set(table.map(row => row.case_key)).size, 34);
  for (const row of table) {
    assert.equal(row.latest_attempts, 3, row.case_key);
    assert.ok(row.latest_body_reads >= 2 && row.latest_body_reads <= 3, row.case_key);
    assert.equal(row.latest_rate, row.latest_body_reads / 3, row.case_key);
    assert.equal(row.prompt_sha256_unchanged, true, row.case_key);
    if (row.updated_case_retested) {
      assert.equal(row.retest_prompt_sha256, selected.find(item => item.key === row.case_key).prompt_sha256, row.case_key);
    } else {
      assert.equal(row.latest_stage, 'initial', row.case_key);
    }
  }
  assert.deepEqual(table.filter(row => row.updated_case_retested).map(row => row.skill).sort(), [
    'failure-oriented-testing', 'idempotency', 'microservice-testing', 'technical-deprecation',
  ]);
  const initial = readJson(`${r3Root}initial-activation-table.json`);
  assert.equal(initial.planned_attempts, 102);
  assert.equal(initial.executed_attempts, 101);
  assert.equal(initial.timed_out_attempts, 1);
  assert.equal(initial.rows.filter(row => row.observed_body_reads >= 2).length, 30);
  const r3Scores = r3.grading.full_scores.flatMap(filename => readJson(r3Root + filename).rows);
  assert.ok(r3Scores.length >= 57, 'complete description and architecture score vectors are retained');
  for (const row of r3Scores) {
    const expected = activationCriteria(row);
    assert.deepEqual(row.criteria.map(item => [item.id, item.severity]).sort(), expected.map(item => [item.id, item.severity]).sort(), `${row.candidate}/${row.case_key}`);
    assert.ok(row.criteria.every(item => [0, 1, 2].includes(item.score)), row.case_key);
    assert.deepEqual(row.critical_results, row.criteria.filter(item => item.severity === 'critical').map(({ id, score }) => ({ id, score })));
    assert.equal(row.unsuccessful_due_to_critical_failure, row.critical_results.some(item => item.score === 0), row.case_key);
    assert.equal(row.critical_partial, row.critical_results.some(item => item.score === 1), row.case_key);
    for (const severity of ['major', 'minor']) {
      const criteria = row.criteria.filter(item => item.severity === severity);
      const weight = severity === 'major' ? 2 : 1;
      assert.deepEqual(row[`${severity}_weighted`], { earned: criteria.reduce((sum, item) => sum + item.score * weight, 0), maximum: criteria.length * 2 * weight }, `${row.candidate}/${row.case_key}/${severity}`);
    }
  }
  const descriptions = readJson(`${r3Root}scores/description-finalblind-57-normalized.json`).rows;
  assert.equal(descriptions.length, 57);
  assert.equal(new Set(descriptions.map(row => `${row.candidate}/${row.replicate}`)).size, 57);
  assert.equal(descriptions.filter(row => row.unsuccessful_due_to_critical_failure).length, 1, 'the failed earlier candidate remains visible');
  const chosenCandidates = new Set(['codex-desc-02', 'codex-desc-03', 'codex-desc-04', 'codex-desc-08']);
  const chosen = descriptions.filter(row => chosenCandidates.has(row.candidate));
  assert.equal(chosen.length, 43);
  assert.ok(chosen.every(row => !row.unsuccessful_due_to_critical_failure));
  assert.equal(chosen.filter(row => row.critical_partial).length, r3.grading.selected_description_summary.critical_partial_rows);
  assert.equal(chosen.flatMap(row => row.criteria).filter(row => !row.quote_audit_passed).length, r3.grading.selected_description_summary.criterion_quote_audit_gaps);
  const finalArchitecture = readJson(`${r3Root}scores/architecture-stage12-final-scores-normalized.json`).rows;
  assert.equal(finalArchitecture.length, 4, 'four distinct score views over three responders');
  assert.ok(finalArchitecture.every(row => row.criteria.every(item => item.score === 2)));
  assert.ok(finalArchitecture.every(row => row.candidate_codex_digest === identity.codex.source_digest));
  assert.equal(finalArchitecture.find(row => row.view === 'explicit-marker').quote_audit_passed, true);
  const nontriggers = chosen.filter(row => {
    const [skill, id] = row.case_key.split('--');
    return readJson(`evals/${skill}/cases.json`).cases.find(item => item.id === id).activation === 'do_not_auto_activate';
  });
  assert.equal(nontriggers.length, 4);
  assert.ok(nontriggers.every(row => row.criteria.every(item => item.score === 2)));
  for (const row of descriptions) {
    const binding = row.source_binding;
    assert.equal(sha256(fs.readFileSync(path.join(root, binding.source_case_file))), binding.source_case_file_sha256, row.case_key);
    const source = readJson(binding.source_case_file).cases.find(item => `${binding.source_case_file.split('/')[1]}--${item.id ?? item.case_id}` === row.case_key);
    assert.ok(source, row.case_key);
    assert.equal(sha256(source.prompt), binding.prompt_sha256, row.case_key);
  }
  const r3Archive = readJson(`${r3Root}archive-manifest.json`);
  assert.equal(r3Archive.archive_name, 'tal-skills-activation-rate-2026-10-05.tar.zst');
  assert.match(r3Archive.archive_sha256, /^[a-f0-9]{64}$/);
  assert.equal(r3Archive.outer_archive_assembled, true);
  assert.equal(r3Archive.uploaded_to_v1_1, false, 'the preparation-time receipt remains immutable');
  assert.deepEqual(r3Archive.pending_components, []);
  assert.equal(r3Archive.component_archives.length, 19);
  assert.ok(r3Archive.component_archives.every(row => row.verified));
  assert.equal(new Set(r3.retained_files.map(row => row.path)).size, r3.retained_files.length);
  const retained = new Map(r3.retained_files.map(row => [row.path, row]));
  for (const filename of [...r3.grading.full_scores, ...r3.grading.source_score_vectors, 'review.md', 'activation.md', r3.candidate.candidate_identity_path, r3.candidate.codex_manifest_path]) {
    assert.ok(retained.has(r3Root + filename), filename);
  }
  for (const { path: filename, sha256: digest, bytes } of r3.retained_files) {
    assert.ok(!filename.startsWith('/') && !filename.split(/[\\/]/).includes('..'), filename);
    const contents = fs.readFileSync(path.join(root, filename));
    assert.equal(sha256(contents), digest, filename);
    assert.equal(contents.length, bytes, filename);
  }
});

function activationCriteria(row) {
  const marker = readJson('evals/cleanup-followup/activation-cases.json').cases[0];
  if (row.case_key.startsWith(marker.key)) {
    return row.view === 'marker' || row.view?.endsWith('-marker') || row.case_key.endsWith('-marker') ? marker.marker_criteria : marker.content_criteria;
  }
  return corpusCriteria(row.case_key.replace(/-final-r3$/, ''));
}

function corpusCriteria(caseKey) {
  const authored = readJson('evals/cleanup-followup/cases.json').cases.find(row => row.key === caseKey);
  if (authored) return authored.criteria;
  const matrixCase = readRun('matrix.json').existing_cases.find(row => row.key === caseKey);
  if (!matrixCase) {
    const [skill, id] = caseKey.split('--');
    const source = readJson(`evals/${skill}/cases.json`).cases.find(row => (row.id ?? row.case_id) === id);
    if (!source) throw new Error(`No canonical criteria for ${caseKey}`);
    return source.rubric;
  }
  const source = readJson(matrixCase.source_case_file).cases.find(row => (row.id ?? row.case_id) === matrixCase.case_id);
  return matrixCase.skill === 'phase5-cleanup'
    ? readJson('evals/phase5-cleanup/rubric.json').cases.find(row => row.case_id === matrixCase.case_id).criteria
    : source.rubric;
}

test('Claude Code 2026-10-06 executed record is internally consistent and keeps its counts visible', () => {
  const dir = 'evals/claude-code/runs/2026-10-06';
  const report = readJson(`${dir}/report.json`);
  const manifest = readJson(`${dir}/archive-manifest.json`);
  const review = fs.readFileSync(path.join(root, `${dir}/review.md`), 'utf8');
  const claudeReport = fs.readFileSync(path.join(root, 'evals/cleanup-followup/claude-code-report.md'), 'utf8');
  assert.match(claudeReport, /\.\.\/claude-code\/runs\/2026-10-06\/review\.md/);
  assert.match(review, /\*\*Status: executed\.\*\*/);
  assert.equal(report.status, 'executed');
  assert.equal(report.candidate.commit_mac_clone, '594ff61');
  assert.equal(report.candidate_refinement.commit_cloud_clone, '2d9312f');
  assert.deepEqual(Object.keys(report.score_sets), ['claude-code-haiku', 'changed-skills-haiku', 'sonnet-comparison', 'refinement-rerun']);
  assert.equal(manifest.external_archive.filename, 'tal-skills-claude-code-2026-10-06.tar.zst');
  assert.match(manifest.external_archive.sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.external_archive.zstd_test, 'passed');
  assert.deepEqual(report.archive_manifest, manifest.external_archive);
  assert.equal(manifest.members.length, manifest.external_archive.tar_member_count);
  for (const member of manifest.members) {
    assert.match(member.original_sha256, /^[a-f0-9]{64}$/);
    assert.match(member.published_sha256, /^[a-f0-9]{64}$/);
    assert.equal(member.transformed, member.original_sha256 !== member.published_sha256, member.path);
  }
  let totalRows = 0;
  let totalGaps = 0;
  for (const [name, summary] of Object.entries(report.score_sets)) {
    const { rows } = readJson(`${dir}/scores/${name}-normalized.json`);
    assert.equal(rows.length, summary.rows, name);
    assert.equal(rows.filter(row => row.execution_status === 'completed').length, summary.completed_runs, name);
    assert.equal(rows.filter(row => row.grader).length, summary.graded_runs, name);
    assert.equal(rows.filter(row => row.unsuccessful_due_to_critical_failure).length, summary.critical_zero_rows, name);
    assert.equal(rows.filter(row => row.critical_partial).length, summary.critical_partial_rows, name);
    assert.equal(rows.filter(row => row.result === 'pass').length, summary.pass_rows, name);
    assert.equal(rows.flatMap(row => row.criteria).filter(item => !item.quote_audit_passed).length, summary.criterion_quote_audit_gaps, name);
    assert.equal(rows.flatMap(row => row.criteria).length, summary.criteria_graded, name);
    for (const row of rows) {
      assert.equal(sha256(fs.readFileSync(path.join(root, row.source_binding.source_case_file))), row.source_binding.source_case_file_sha256, row.replicate);
      const corpus = readJson(row.source_binding.source_case_file).cases;
      const source = corpus.find(item => `${row.source_binding.source_case_file.split('/')[1]}--${item.id ?? item.case_id}` === row.case_key);
      assert.ok(source, row.case_key);
      assert.equal(sha256(source.prompt), row.source_binding.prompt_sha256, row.replicate);
      const rubric = source.rubric ?? source.criteria;
      assert.deepEqual(row.criteria.map(item => [item.id, item.severity]).sort(), rubric.map(item => [item.id, item.severity]).sort(), row.replicate);
      assert.ok(row.criteria.every(item => [0, 1, 2].includes(item.score)), row.replicate);
      assert.deepEqual(row.critical_results, row.criteria.filter(item => item.severity === 'critical').map(({ id, score }) => ({ id, score })));
      assert.equal(row.unsuccessful_due_to_critical_failure, row.critical_results.some(item => item.score === 0), row.replicate);
      assert.equal(row.critical_partial, row.critical_results.some(item => item.score === 1), row.replicate);
      assert.equal(row.grader.independence.saw_candidate_skill_body, false, row.replicate);
      assert.ok(Object.values(row.artifact_paths).every(value => value.startsWith(`${name}/`)), row.replicate);
      for (const item of row.criteria) {
        assert.equal(item.quote_audit_passed, item.evidence_quotes.every(quote => quote.exact_match) && (item.evidence_quotes.length > 0 || item.score === 0), `${row.replicate}/${item.id}`);
      }
    }
    totalRows += rows.length;
    totalGaps += summary.criterion_quote_audit_gaps;
  }
  assert.equal(totalRows, 169);
  assert.equal(totalGaps, 38);
  const sonnet = readJson(`${dir}/scores/sonnet-comparison-normalized.json`).rows;
  const refinement = readJson(`${dir}/scores/refinement-rerun-normalized.json`).rows;
  const sonnetScores = (rows, caseKey, criterion) => rows.filter(row => row.case_key === caseKey && row.responder_model.startsWith('claude-sonnet')).map(row => row.criteria.find(item => item.id === criterion).score);
  assert.deepEqual(sonnetScores(sonnet, 'microservice-testing--unknown-api-consumers', 'breaking-change'), [2, 2, 2]);
  assert.deepEqual(sonnetScores(sonnet, 'technical-deprecation--periodic-export-client', 'removal-and-recovery-gates'), [2, 2, 2]);
  assert.deepEqual(sonnetScores(refinement, 'idempotency--scoped-transfer-identity', 'scoped-auth'), [2, 2, 2]);
  assert.deepEqual(sonnetScores(refinement, 'idempotency--scoped-transfer-identity', 'intent-binding'), [2, 2, 2]);
  assert.deepEqual(sonnetScores(refinement, 'failure-oriented-testing--race-clean-lost-update', 'oracle'), [2, 2, 2]);
  assert.deepEqual(sonnetScores(sonnet, 'failure-oriented-testing--race-clean-lost-update', 'oracle'), [1, 2, 2], 'the pre-refinement Sonnet partial stays visible');
  const haiku = readJson(`${dir}/scores/claude-code-haiku-normalized.json`).rows;
  const v2 = haiku.filter(row => row.case_key.endsWith('-v2') && row.case_key.includes('architecture-plugin'));
  assert.equal(v2.length, 6);
  assert.ok(v2.every(row => row.activation.command_expansions.includes('/tal-skills:architecture')));
  const v1 = haiku.filter(row => row.case_key.endsWith('-v1') && row.case_key.includes('architecture-plugin'));
  assert.equal(v1.length, 6);
  assert.equal(v1.filter(row => row.unsuccessful_due_to_critical_failure).length, 5, 'the v1 mid-sentence form keeps its failures visible');
});


test('focused reporting cases retain attributed fixture bytes and cover compatible widening separately', () => {
  const corpus = readJson('evals/cleanup-followup/reporting-gates-cases.json');
  assert.equal(corpus.cases.length, 4);
  assert.equal(new Set(corpus.cases.map(row => row.id)).size, 4);
  assert.deepEqual(corpus.cases.map(row => row.skill).sort(), [
    'failure-oriented-testing', 'idempotency', 'microservice-testing', 'technical-deprecation',
  ]);
  for (const row of corpus.cases) {
    assert.ok(row.fixture_dir.startsWith('evals/cleanup-followup/fixtures/reporting-gates/'));
    const actual = fs.readdirSync(path.join(root, row.fixture_dir)).sort();
    assert.deepEqual(actual, [...row.fixtures].sort(), row.id);
    assert.ok(row.rubric.length >= 3 && row.rubric.every(item => item.severity === 'critical'));
    assert.equal(row.capabilities.web, false);
    assert.equal(row.capabilities.subagents, false);
    if (row.source_attribution.fixture_reused_without_changes) {
      const source = readJson(row.source_attribution.source_case_file).cases.find(item => item.id === row.source_attribution.source_case_id);
      assert.ok(source, row.id);
      for (const filename of row.fixtures) {
        assert.equal(sha256(fs.readFileSync(path.join(root, row.fixture_dir, filename))),
          sha256(fs.readFileSync(path.join(root, source.fixture_dir, filename))), `${row.id}/${filename}`);
      }
    }
  }
  const boundary = corpus.cases.find(row => row.id === 'compatible-request-widening');
  assert.deepEqual(boundary.rubric.map(item => item.id), ['compatible-widening', 'breaking-controls', 'read-only-limits']);
  assert.equal(boundary.task_mode, 'review');
});

test('Codex critical-gate stages retain complete independent vectors and every failed gate', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-06-codex-critical-gates';
  const stages = [['codex-critical-02', 43], ['codex-critical-03', 43], ['codex-reporting-04', 55]];
  for (const [candidate, expected] of stages) {
    const scores = readJson(`${directory}/scores/${candidate}-normalized.json`);
    const source = readJson(`${directory}/scores/${candidate}-independent-source.json`);
    assert.equal(scores.candidate, candidate);
    assert.equal(scores.rows.length, expected);
    assert.equal(new Set(scores.rows.map(row => row.replicate)).size, expected);
    assert.equal(source.attempt_score_count, expected);
    assert.equal(scores.summary.graded_criteria, scores.rows.reduce((sum, row) => sum + row.criteria.length, 0));
    assert.equal(scores.summary.critical_zero_rows, scores.rows.filter(row => row.unsuccessful_due_to_critical_failure).length);
    assert.equal(scores.summary.critical_partial_rows, scores.rows.filter(row => row.critical_partial).length);
    assert.equal(scores.summary.criterion_quote_audit_gaps, scores.rows.reduce((sum, row) => sum + row.criteria.filter(item => !item.quote_audit_passed).length, 0));
    assert.equal(scores.summary.gate_misses, scores.gate_misses.length);
    assert.equal(scores.summary.all_registered_gates_passed, false);
    assert.ok(scores.gate_misses.length > 0, candidate);
    for (const row of scores.rows) {
      assert.equal(row.execution_status, 'executed');
      assert.match(row.candidate_commit, /^[a-f0-9]{40}$/);
      assert.match(row.candidate_package_digest, /^[a-f0-9]{64}$/);
      assert.equal(sha256(fs.readFileSync(path.join(root, row.source_binding.source_case_file))), row.source_binding.source_case_file_sha256);
      assert.equal(row.grader.independence.authored_candidate, false);
      assert.equal(row.grader.independence.authored_response, false);
      assert.equal(row.grader.independence.saw_candidate_skill_body, false);
      assert.equal(row.grader.same_model_independent_session, row.responder_model === row.grader.model);
      const original = source.groups.find(group => group.grader === row.grader.id).runs.find(run => run.label === row.blind_label);
      assert.deepEqual(row.criteria.map(({ severity, ...item }) => item), original.criteria);
      assert.deepEqual(row.critical_results, row.criteria.filter(item => item.severity === 'critical').map(({ id, score }) => ({ id, score })));
      assert.equal(row.result, row.criteria.every(item => item.score === 2) ? 'pass' : row.critical_results.some(item => item.score === 0) ? 'fail' : 'partial');
      for (const filename of Object.values(row.artifact_paths)) assert.ok(!filename.startsWith('/') && !filename.split('/').includes('..'), filename);
      for (const digest of Object.values(row.artifact_hashes)) assert.match(digest, /^[a-f0-9]{64}$/);
    }
    const activation = readJson(`${directory}/${candidate}-activation-table.json`);
    assert.deepEqual(activation, scores.activation_rows);
    for (const item of activation) {
      const rows = scores.rows.filter(row => row.case_key === item.case_key);
      assert.equal(item.attempts, rows.length);
      assert.equal(item.target_body_reads, rows.filter(row => row.activation.target_body_read_observed).length);
      assert.equal(item.activation_gate_passed, rows.length === item.expected_attempts && (item.group === 'nontrigger' ? item.target_body_reads === 0 : item.target_body_reads >= 2));
    }
  }
  const original = readJson(`${directory}/gates.json`);
  const reporting = readJson(`${directory}/reporting-gates.json`);
  assert.equal(original.baseline_rows.length, 17);
  assert.deepEqual(reporting.baseline_rows, original.baseline_rows);
  assert.equal(reporting.parent_gate_file_sha256, sha256(fs.readFileSync(path.join(root, `${directory}/gates.json`))));
});

test('versioned quote re-audit retains the original 43 rows and all 33 unresolved quotes', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-05-activation';
  const audit = readJson(`${directory}/scores/description-quote-reaudit-v2.json`);
  const bytes = fs.readFileSync(path.join(root, audit.original_score_file));
  assert.equal(sha256(bytes), 'ef3f7a2b71ebbda87511ee93ecf86b255c94d32e17d477071da84081945904c3');
  assert.equal(audit.original_score_file_sha256, sha256(bytes));
  const original = JSON.parse(bytes).rows;
  assert.equal(original.length, 43);
  assert.equal(audit.rows.length, 33);
  assert.equal(audit.criteria_reaudited, 33);
  assert.equal(audit.criteria_now_passing, 0);
  assert.equal(audit.criteria_still_failing, 33);
  assert.equal(audit.scores_changed, false);
  const gaps = original.flatMap(row => row.criteria.filter(item => !item.quote_audit_passed).map(item => ({ row, item })));
  assert.equal(gaps.length, audit.rows.length);
  for (const { row, item } of gaps) {
    const found = audit.rows.find(entry => entry.candidate === row.candidate && entry.replicate === row.replicate && entry.criterion_id === item.id);
    assert.ok(found, `${row.replicate}/${item.id}`);
    assert.equal(found.original_score, item.score);
    assert.equal(found.original_reason, item.reason);
    assert.deepEqual(found.quotes.map(entry => entry.quote), item.evidence_quotes);
    assert.equal(found.re_audit_passed, found.quotes.length > 0 && found.quotes.every(entry => entry.quote.length > 0 && entry.exact_packet_match));
    assert.equal(found.re_audit_passed, false);
    for (const [key, digest] of Object.entries(found.evidence_binding)) if (key.endsWith('_sha256')) assert.match(digest, /^[a-f0-9]{64}$/);
  }
  const release = readJson(`${directory}/release-upload-verification-2026-10-06.json`);
  assert.equal(release.expected_sha256, audit.archive_sha256);
  assert.equal(release.download_sha256, audit.archive_sha256);
  assert.equal(release.status, 'verified_existing_asset');
  assert.equal(release.historical_preparation_manifest_changed, false);
});

test('versioned reporting corrections preserve original fixtures and isolate truthful context extensions', () => {
  const corpus = readJson('evals/cleanup-followup/reporting-gates-v2-cases.json');
  assert.equal(corpus.cases.length, 5);
  assert.equal(corpus.replacement_notes.length, 2);
  const byId = new Map(corpus.cases.map(row => [row.id, row]));
  assert.ok(byId.has('counterexample-final-report-v2'));
  assert.ok(byId.has('compatible-request-widening-v2'));
  assert.ok(byId.has('uncertain-commit-model-report'));
  assert.ok(byId.has('existing-claim-guarantee'));
  assert.ok(byId.has('provider-fake-limit-report'));
  for (const row of corpus.cases) {
    const origin = row.source_attribution;
    const sourceFile = origin.source_focused_case_file ?? origin.source_case_file;
    const sourceId = origin.source_focused_case_id ?? origin.source_case_id;
    const source = readJson(sourceFile).cases.find(item => item.id === sourceId);
    assert.ok(source, row.id);
    assert.equal(row.capabilities.web, false);
    assert.equal(row.capabilities.subagents, false);
    assert.ok(row.rubric.every(item => item.severity === 'critical'));
    const directory = path.join(root, row.fixture_dir);
    const files = fs.readdirSync(directory, { recursive: true }).filter(name => fs.statSync(path.join(directory, name)).isFile()).sort();
    assert.deepEqual(files, [...row.fixtures].sort());
    for (const filename of files) {
      const current = fs.readFileSync(path.join(directory, filename));
      const prior = fs.readFileSync(path.join(root, source.fixture_dir, filename));
      if (row.id === 'counterexample-final-report-v2' && filename === 'request.md') {
        assert.equal(origin.fixture_reused_without_changes, false);
        assert.ok(current.subarray(0, prior.length).equals(prior));
        assert.match(current.toString(), /one JavaScript agent/);
        assert.match(current.toString(), /No two memory accesses to value overlap/);
        assert.match(current.toString(), /none has run/);
      } else assert.deepEqual(current, prior, `${row.id}/${filename}`);
    }
  }
  const counterexample = byId.get('counterexample-final-report-v2');
  assert.ok(!/semantic|protected/.test(counterexample.prompt));
  const gates = readJson('evals/cleanup-followup/runs/2026-10-06-codex-critical-gates/reporting-v2-gates.json');
  assert.equal(gates.planned_attempts, 70);
  assert.deepEqual(gates.baseline_rows, readJson('evals/cleanup-followup/runs/2026-10-06-codex-critical-gates/gates.json').baseline_rows);
  assert.deepEqual(gates.versioned_authoring_corrections, corpus.replacement_notes);
});

test('complete corrected Sol and blind Fable vectors retain the same 70 attempts and separate gate failures', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-06-codex-critical-gates';
  const sol = readJson(`${directory}/scores/codex-reporting-05-normalized.json`);
  const fable = readJson(`${directory}/scores/codex-reporting-05-fable-normalized.json`);
  assert.equal(sol.rows.length, 70);
  assert.equal(fable.rows.length, 70);
  assert.deepEqual(sol.rows.map(row => row.replicate), fable.rows.map(row => row.replicate));
  assert.deepEqual(sol.activation_rows, fable.activation_rows);
  for (const [scores, sourceFile] of [[sol, 'codex-reporting-05-independent-source.json'], [fable, 'codex-reporting-05-fable-independent-source.json']]) {
    const source = readJson(`${directory}/scores/${sourceFile}`);
    assert.equal(source.attempt_score_count, 70);
    assert.equal(scores.summary.all_registered_gates_passed, false);
    assert.equal(scores.summary.governing_candidate_gates_passed, false);
    assert.equal(scores.summary.governing_gate_misses, scores.governing_gate_misses.length);
    const excluded = new Set(scores.authoring_corrections.map(item => item.original));
    assert.deepEqual(scores.governing_gate_misses, scores.gate_misses.filter(item => !(excluded.has(item.case_key) && ['activation', 'target'].includes(item.gate))));
    assert.deepEqual(scores.authoring_corrections, readJson(`${directory}/reporting-v2-gates.json`).versioned_authoring_corrections);
    for (const row of scores.rows) {
      const raw = source.groups.find(group => group.grader === row.grader.id).runs.find(run => run.label === row.blind_label);
      assert.deepEqual(row.criteria.map(({ severity, ...item }) => item), raw.criteria);
      assert.ok(row.criteria.every(item => item.evidence_quotes.every(quote => quote.length > 0)));
      assert.equal(row.candidate_commit, '77aa852a206f5fc0472a6d6c7c38d87fc979e75f');
      assert.equal(row.candidate_package_digest, '4cfcadc6274d23fdbab10de31fb8a3d539a65a612df0c3de2849e3a235e0f689');
    }
  }
  assert.equal(fable.grader_model, 'claude-fable-5-1');
  assert.equal(fable.grading_independence.saw_sol_scores, false);
  assert.equal(fable.grading_independence.saw_candidate_package_guidance, false);
  assert.equal(fable.same_model_grading_coverage_gap, false);
  assert.equal(sol.same_model_grading_coverage_gap, true);
});

test('final reporting prompts restore source requests without changing any earlier rubric or fixture', () => {
  const corpus = readJson('evals/cleanup-followup/reporting-gates-v3-cases.json');
  const prior = readJson('evals/cleanup-followup/reporting-gates-v2-cases.json');
  const existing = readJson('evals/idempotency/cases.json');
  assert.equal(corpus.cases.length, 3);
  assert.equal(corpus.replacement_notes.length, 3);
  for (const row of corpus.cases) {
    const source = prior.cases.find(item => item.id === row.source_attribution.source_focused_case_id);
    assert.ok(source, row.id);
    assert.deepEqual(row.rubric, source.rubric);
    assert.deepEqual(row.capabilities, source.capabilities);
    assert.equal(row.source_attribution.fixture_reused_without_changes, true);
    for (const filename of row.fixtures) assert.deepEqual(fs.readFileSync(path.join(root, row.fixture_dir, filename)), fs.readFileSync(path.join(root, source.fixture_dir, filename)));
    if (row.id === 'existing-claim-guarantee-v3') assert.equal(row.prompt, existing.cases.find(item => item.id === 'expired-lease-owner').prompt);
    if (row.id === 'provider-fake-limit-report-v3') assert.equal(row.prompt, existing.cases.find(item => item.id === 'bounded-webhook-edit').prompt);
    if (row.id === 'counterexample-final-report-v3') assert.equal(row.prompt, source.prompt.replace('nature of the failure and whether a race detector ran', 'nature of the failure, whether a race detector ran and limits of the checks actually run'));
  }
  const gates = readJson('evals/cleanup-followup/runs/2026-10-06-codex-critical-gates/final-gates.json');
  assert.equal(gates.planned_attempts, 79);
  assert.equal(gates.versioned_authoring_corrections.length, 5);
  assert.deepEqual(gates.baseline_rows, readJson('evals/cleanup-followup/runs/2026-10-06-codex-critical-gates/gates.json').baseline_rows);
  assert.equal(gates.models.fallback_on_any_primary_governing_miss, 'gpt-6-astra');
});

test('final frozen Sol and Astra retain all 79 attempts and both independent grader vectors', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-06-codex-critical-gates';
  const expected = [
    ['codex-final-06', 'gpt-6.1-sol', 6, 0],
    ['codex-final-07', 'gpt-6-astra', 0, 1],
  ];
  for (const [candidate, model, solMisses, fableMisses] of expected) {
    let previous;
    for (const [suffix, misses] of [['', solMisses], ['-fable', fableMisses]]) {
      const scores = readJson(`${directory}/scores/${candidate}${suffix}-normalized.json`);
      const source = readJson(`${directory}/scores/${candidate}${suffix}-independent-source.json`);
      assert.equal(scores.rows.length, 79);
      assert.equal(source.attempt_score_count, 79);
      assert.equal(new Set(scores.rows.map(row => row.replicate)).size, 79);
      assert.equal(scores.responder_model, model);
      assert.equal(scores.summary.graded_criteria, 333);
      assert.equal(scores.summary.all_registered_gates_passed, false);
      assert.equal(scores.summary.governing_gate_misses, misses);
      assert.equal(scores.summary.governing_candidate_gates_passed, misses === 0);
      assert.equal(scores.governing_gate_misses.length, misses);
      const corrected = new Set(scores.authoring_corrections.map(item => item.original));
      assert.equal(corrected.size, 5);
      assert.deepEqual(scores.governing_gate_misses, scores.gate_misses.filter(item => !(corrected.has(item.case_key) && ['activation', 'target'].includes(item.gate))));
      assert.deepEqual(scores.authoring_corrections, readJson(`${directory}/final-gates.json`).versioned_authoring_corrections);
      assert.equal(scores.summary.criterion_quote_audit_gaps, scores.rows.reduce((sum, row) => sum + row.criteria.filter(item => !item.quote_audit_passed).length, 0));
      for (const row of scores.rows) {
        assert.equal(row.execution_status, 'executed');
        assert.equal(row.candidate_commit, '08a45e8f38ad88c6c28e9b0caefdf443739941aa');
        assert.equal(row.candidate_package_digest, 'a0ed4d1358ad22aaf1f6edc445b7f7a5b0a7e4696ea7b435d9eb965073f695bb');
        assert.equal(sha256(fs.readFileSync(path.join(root, row.source_binding.source_case_file))), row.source_binding.source_case_file_sha256);
        const raw = source.groups.find(group => group.grader === row.grader.id).runs.find(run => run.label === row.blind_label);
        assert.deepEqual(row.criteria.map(({ severity, ...item }) => item), raw.criteria);
        assert.equal(row.grader.independence.authored_candidate, false);
        assert.equal(row.grader.independence.authored_response, false);
        assert.equal(row.grader.independence.saw_candidate_skill_body, false);
        if (row.independent_verification) assert.equal(row.independent_verification.exit_code, 0);
      }
      assert.deepEqual(readJson(`${directory}/${candidate}${suffix}-activation-table.json`), scores.activation_rows);
      if (previous) {
        assert.deepEqual(scores.rows.map(row => row.replicate), previous.rows.map(row => row.replicate));
        assert.deepEqual(scores.activation_rows, previous.activation_rows);
        assert.equal(scores.grader_model, 'claude-fable-5-1');
        assert.equal(scores.grading_independence.saw_sol_scores, false);
        assert.equal(scores.grading_independence.saw_candidate_package_guidance, false);
      }
      previous = scores;
    }
  }
});

test('Astra quote adjudication preserves the failed original audit and supports only a scoped adequacy claim', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-06-codex-critical-gates';
  const scores = readJson(`${directory}/scores/codex-final-07-fable-normalized.json`);
  const audit = readJson(`${directory}/scores/astra-retained-proof-quote-reaudit-v2.json`);
  const approval = readJson(`${directory}/scores/astra-retained-proof-quote-reaudit-v2-approval.json`);
  const row = scores.rows.find(item => item.replicate === audit.replicate);
  const original = row.criteria.find(item => item.id === audit.criterion_id);
  assert.equal(original.score, 2);
  assert.equal(original.quote_audit_passed, false);
  assert.deepEqual(audit.original_evidence_quotes, original.evidence_quotes);
  assert.equal(audit.original_quote_audit_passed, false);
  assert.equal(audit.numeric_score_changed, false);
  assert.equal(audit.original_numeric_score, original.score);
  assert.equal(audit.new_exact_quotes_passed, true);
  assert.deepEqual(audit.replacement_quote_audit.map(item => item.quote), original.evidence_quotes.filter(quote => quote !== '1 file changed'));
  assert.equal(audit.replacement_quote_audit.length, 7);
  assert.ok(audit.replacement_quote_audit.every(item => item.exact_packet_match));
  assert.deepEqual(audit.observable_scope.changed_paths, ['scenario.mjs']);
  assert.deepEqual(audit.observable_scope.untracked_files, []);
  assert.equal(audit.observable_scope.independent_verification.exit_code, 0);
  assert.equal(approval.verdict, 'ACCEPT');
  assert.equal(approval.model, 'claude-fable-5-1');
  assert.equal(approval.audit_sha256, sha256(fs.readFileSync(path.join(root, `${directory}/scores/astra-retained-proof-quote-reaudit-v2.json`))));
  const report = readJson(`${directory}/report-v2-final.json`);
  assert.equal(report.scored_responder_attempts, 369);
  assert.equal(report.final_grading.governing_attempts, 64);
  assert.equal(report.final_grading.fallback_fable_original_governing_misses, 1);
  assert.equal(report.final_grading.fallback_fable_adjudicated_governing_misses, 0);
  assert.equal(report.final_grading.all_registered_gates_passed, false);
  assert.equal(report.model_adequacy.selected, 'gpt-6-astra');
  const reruns = readJson(`${directory}/independent-webhook-reruns.json`);
  assert.equal(reruns.executed_reruns, 24);
  assert.equal(reruns.runs.length, 24);
  for (const model of ['gpt-6.1-sol', 'gpt-6-astra']) assert.equal(reruns.runs.filter(item => item.model === model).length, 12);
  assert.ok(reruns.runs.every(item => item.result.exit_code === 0 && item.result.argv.join(' ') === 'node --test deliver.test.mjs'));
});

test('final archive receipt binds immutable source records and reports verified redaction without hiding prior failures', () => {
  const directory = 'evals/cleanup-followup/runs/2026-10-06-codex-critical-gates';
  const manifest = readJson(`${directory}/archive-manifest.json`);
  const report = readJson(`${directory}/report-v2-final.json`);
  assert.equal(manifest.status, 'verified_held_for_next_release');
  assert.deepEqual(manifest.external_archive, report.archive);
  assert.equal(manifest.external_archive.archive_sha256, 'd9080cb19fe408a4a758648b587e0cc4c93b488ebbeddc2f4758e4e0128b3670');
  assert.equal(manifest.external_archive.inventory_sha256, '3af6b8d4b475922abc753ba5f61a264811b8deebaa84cb3759c67f8cc5eec93e');
  assert.equal(manifest.external_archive.member_hash_verification, 'all-members-match');
  assert.equal(manifest.external_archive.zstd_test, 'passed');
  assert.equal(manifest.external_archive.personal_home_literal_scan_matches, 0);
  assert.equal(manifest.external_archive.decoded_json_personal_home_scan_matches, 0);
  assert.equal(manifest.external_archive.regular_files, 104311);
  assert.ok(manifest.files.length > 50);
  assert.equal(new Set(manifest.files.map(item => item.path)).size, manifest.files.length);
  for (const item of manifest.files) {
    assert.ok(!item.path.startsWith('/') && !item.path.split('/').includes('..'));
    const bytes = fs.readFileSync(path.join(root, directory, item.path));
    assert.ok(bytes.length < 1000000, item.path);
    assert.equal(sha256(bytes), item.published_sha256, item.path);
    assert.equal(item.original_sha256, item.published_sha256);
    assert.equal(item.transformed, false);
    assert.equal(manifest.retained_files[item.path], item.published_sha256);
  }
  assert.equal(report.stages.length, 6);
  assert.equal(report.scored_responder_attempts, report.stages.reduce((sum, stage) => sum + stage.summary.rows, 0));
  assert.ok(report.stages.every(stage => stage.summary.all_registered_gates_passed === false));
  const bindings = readJson(`${directory}/publication-bindings-verification.json`);
  assert.equal(bindings.artifact_bindings_checked, 3582);
  assert.equal(bindings.distinct_bound_artifacts, 1922);
});
