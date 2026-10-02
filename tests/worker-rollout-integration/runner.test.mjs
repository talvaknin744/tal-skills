import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  REPO, evaluationSuite, inventory, copySnapshot, loadCase, freezeCandidates,
  validateFreeze, prepareTrial, loadControlledCase, runTrial,
  sha256, canonical,
} from '../../scripts/evals/lib.mjs';

const suite = 'worker-rollout-integration';
async function fixture(t) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'tal-rollout-suite-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const repo = path.join(base, 'repo');
  await mkdir(repo);
  await copySnapshot(path.join(REPO, 'scripts/evals'), path.join(repo, 'scripts/evals'), await inventory(path.join(REPO, 'scripts/evals')));
  for (const filename of ['package.json', 'package-lock.json']) await writeFile(path.join(repo, filename), await readFile(path.join(REPO, filename)));
  for (const [skill, [source, corpus]] of Object.entries(evaluationSuite(suite))) {
    await mkdir(path.join(repo, source), { recursive: true });
    await writeFile(path.join(repo, source, 'SKILL.md'), `---\nname: ${skill}\ndescription: Review the supplied synthetic service.\n---\nRead raw evidence.\n`);
    const fixture_dir = `${corpus}/fixtures/review`;
    await mkdir(path.join(repo, fixture_dir), { recursive: true });
    await writeFile(path.join(repo, fixture_dir, 'service.md'), 'Observed raw service behavior.\n');
    await writeFile(path.join(repo, corpus, 'cases.json'), JSON.stringify({ format_version: 1, cases: [{
      id: 'review', prompt: 'Review service.md without changing files.', fixture_dir, fixtures: ['service.md'],
      task_mode: 'review', activation: 'activate', capabilities: { commands: true, web: false, subagents: false },
      rubric: [{ id: 'scope', severity: 'critical', criterion: 'Respect the supplied service boundary.' }],
    }] }));
  }
  const freezePath = path.join(base, 'freeze.json');
  const freeze = await freezeCandidates(repo, suite);
  await writeFile(freezePath, JSON.stringify(freeze));
  return { base, repo, freezePath, freeze };
}
test('suite selection is explicit and unknown suites fail closed', () => {
  assert.throws(() => evaluationSuite('typo'), /Unknown evaluation suite/);
  assert.equal(Object.keys(evaluationSuite(suite)).length, 4);
  assert.equal(Object.hasOwn(evaluationSuite(), 'concurrency-correctness'), false);
});
test('legacy regression routing preserves shared-corpus skill ownership', async () => {
  const legacy = 'worker-rollout-regression';
  assert.equal((await loadCase(REPO, 'graceful-draining', 'rolling-worker-drain', legacy)).item.skill, 'graceful-draining');
  await assert.rejects(loadCase(REPO, 'graceful-draining', 'cache-fill-invalidation', legacy), /different skill/);
  const frozen = await freezeCandidates(REPO, legacy);
  assert.ok(frozen.corpora['graceful-draining']['rolling-worker-drain']);
  assert.equal(Object.hasOwn(frozen.corpora['graceful-draining'], 'cache-fill-invalidation'), false);
  assert.ok(frozen.corpora['concurrency-correctness']['cache-fill-invalidation']);
});
test('legacy execution controls preserve raw case identity and protect the verifier', async t => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'tal-legacy-controls-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const legacy = 'worker-rollout-regression';
  const freeze = await freezeCandidates(REPO, legacy);
  const { item } = await loadCase(REPO, 'concurrency-correctness', 'cache-fill-invalidation', legacy);
  const entry = freeze.corpora['concurrency-correctness'][item.id];
  assert.equal(entry.case_sha256, sha256(canonical(item)));
  assert.equal(item.editable_files, undefined);
  assert.equal(item.verification_argv, undefined);
  assert.deepEqual(entry.execution_controls.editable_files, ['service.mjs']);
  assert.deepEqual(entry.execution_controls.verification_argv, ['node', 'verify.mjs']);
  const freezePath = path.join(base, 'freeze.json');
  await writeFile(freezePath, JSON.stringify(freeze));
  const staged = await prepareTrial({ repo: REPO, freezePath, skill: 'concurrency-correctness', caseId: item.id, destination: path.join(base, 'trial') });
  assert.deepEqual(staged.run.editable_files, ['project/service.mjs']);
  assert.deepEqual(staged.run.verification_argv, ['node', 'verify.mjs']);
  assert.equal(staged.run.editable_files.includes('project/verify.mjs'), false);
  const control = JSON.parse(await readFile(path.join(staged.trial, 'control.json')));
  const alteredControl = structuredClone(control);
  alteredControl.frozen_case.execution_controls.editable_files.push('verify.mjs');
  await assert.rejects(loadControlledCase(staged.trial, alteredControl), /differs from its frozen suite/);
  for (const change of [
    { editable_files: ['project/service.mjs', 'project/verify.mjs'] },
    { verification_argv: null },
    { execution_control_derivation: 'Different task scope.' },
  ]) {
    await writeFile(path.join(staged.trial, 'evidence/run.json'), JSON.stringify({ ...staged.run, ...change }));
    await assert.rejects(loadControlledCase(staged.trial, control), /execution controls differ from its frozen case/);
    await assert.rejects(runTrial({ trial: staged.trial, execute: false }), /execution controls differ from its frozen case/);
  }
});
test('a frozen suite binds its selection and refuses a replaced or deleted identity', async t => {
  const { freeze } = await fixture(t);
  validateFreeze(freeze);
  assert.throws(() => validateFreeze({ ...freeze, evaluation_suite: 'engineering-toolkit' }), /digest mismatch/);
  const changed = { ...freeze }; delete changed.evaluation_suite;
  assert.throws(() => validateFreeze(changed), /digest mismatch/);
});
test('cross-concern fixture paths are rejected even when files are declared', async t => {
  const { repo } = await fixture(t);
  const corpus = path.join(repo, evaluationSuite(suite)['overload-control'][1], 'cases.json');
  const cases = JSON.parse(await readFile(corpus));
  cases.cases[0].fixture_dir = `${evaluationSuite(suite)['concurrency-correctness'][1]}/fixtures/review`;
  await writeFile(corpus, JSON.stringify(cases));
  await assert.rejects(loadCase(repo, 'overload-control', 'review', suite), /outside its skill corpus/);
});
test('staging keeps private rubric outside the raw project and binds controls', async t => {
  const state = await fixture(t);
  const staged = await prepareTrial({ ...state, skill: 'overload-control', caseId: 'review', destination: path.join(state.base, 'trial') });
  const files = await inventory(staged.workspace);
  assert.equal(files.some(x => ['cases.json', 'rubric.json', 'control.json'].includes(path.basename(x.path))), false);
  assert.ok(files.some(x => x.path === 'project/service.md'));
  const control = JSON.parse(await readFile(path.join(staged.trial, 'control.json')));
  assert.equal((await loadControlledCase(staged.trial, control)).item.id, 'review');
  await assert.rejects(loadControlledCase(staged.trial, { ...control, evaluation_suite: undefined }), /suite binding mismatch/);
  await assert.rejects(loadControlledCase(staged.trial, { ...control, skill: 'concurrency-correctness' }), /differs from its frozen suite/);
  const changed = { ...control }; delete changed.evaluation_suite;
  await writeFile(path.join(staged.trial, 'control.json'), JSON.stringify(changed));
  await assert.rejects(runTrial({ trial: staged.trial, binary: '/missing-native-host', execute: true }), /suite binding mismatch/);
});
test('suite corpus changes after freeze prevent staging', async t => {
  const state = await fixture(t);
  const filename = path.join(state.repo, evaluationSuite(suite)['overload-control'][1], 'cases.json');
  const cases = JSON.parse(await readFile(filename)); cases.cases[0].prompt += ' Different request.';
  await writeFile(filename, JSON.stringify(cases));
  await assert.rejects(prepareTrial({ ...state, skill: 'overload-control', caseId: 'review', destination: path.join(state.base, 'trial') }), /changed after freeze/);
});

for (const skill of Object.keys(evaluationSuite(suite))) {
  test(`${skill}: integration cases have complete raw fixtures and bounded modes`, async () => {
    const corpus = JSON.parse(await readFile(path.join(REPO, evaluationSuite(suite)[skill][1], 'cases.json')));
    assert.equal(corpus.format_version, 1);
    // Schema keeps its original cases and adds a versioned contract correction.
    const count = skill === 'infrastructure-change-safety' ? 4 : 3;
    assert.equal(corpus.cases.length, count);
    assert.equal(new Set(corpus.cases.map(x => x.id)).size, count);
    assert.equal(corpus.cases.filter(x => x.activation === 'activate').length, count - 1);
    assert.equal(corpus.cases.filter(x => x.activation === 'do_not_auto_activate').length, 1);
    for (const item of corpus.cases) {
      await loadCase(REPO, skill, item.id, suite);
      assert.ok(['review', 'planning', 'implementation', 'nontrigger'].includes(item.task_mode));
      assert.equal(item.capabilities.web, false);
      assert.equal(item.capabilities.subagents, false);
      assert.equal(new Set(item.rubric.map(x => x.id)).size, item.rubric.length);
      assert.ok(item.rubric.some(x => x.severity === 'critical'));
      if (item.task_mode === 'implementation') assert.ok(item.editable_files.length && item.verification_argv.length);
    }
  });
}
