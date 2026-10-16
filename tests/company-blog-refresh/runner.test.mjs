import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { registerRefreshSuites, stageRefresh } from '../../scripts/evals/company-blog-refresh.mjs';
import { inventory, prepareTrial, sha256, treeDigest } from '../../scripts/evals/lib.mjs';

let sequence = 0;
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tal-refresh-runner-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.join(root, 'origin');
  const files = {
    'package.json': '{"type":"module"}\n',
    'package-lock.json': '{}\n',
    'scripts/evals/fixture.mjs': 'export const fixture = true;\n',
    'skills/test/candidate/SKILL.md': '---\nname: candidate\ndescription: Review supplied project evidence when asked to diagnose the candidate scenario. Keep local formatting requests within their narrow scope.\n---\nInspect the supplied evidence and report its limits.\n',
    'skills/test/candidate/references/context.md': 'Preserve the complete installable package.\n',
    'evals/candidate/fixtures/check/incident.md': 'Observed input only.\n',
    'evals/candidate/cases.json': '{"historical":"unchanged"}\n',
    'evals/candidate/cases-v2.json': JSON.stringify({ format_version: 1, cases: [{
      id: 'check', fixture_dir: 'evals/candidate/fixtures/check', fixtures: ['incident.md'],
      prompt: 'Review incident.md and keep files unchanged.', activation: 'activate', task_mode: 'review',
      capabilities: { commands: true, web: false, subagents: false },
      rubric: [{ id: 'bounded', severity: 'critical', criterion: 'Keeps the result within supplied evidence.' }],
    }] }) + '\n',
  };
  for (const [relative, body] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(repo, relative)), { recursive: true });
    await writeFile(path.join(repo, relative), body);
  }
  const suite = `company-refresh-fixture-${++sequence}`;
  const definitions = { [suite]: { candidate: ['skills/test/candidate', 'evals/candidate/cases-v2.json'] } };
  registerRefreshSuites(definitions);
  return { root, repo, suite, definitions, files };
}

test('supplemental corpus aliases preserve original bytes and complete candidate identity', { timeout: 180000 }, async t => {
  const state = await fixture(t), destination = path.join(state.root, 'staged');
  const manifest = await stageRefresh({ ...state, destination });
  const record = manifest.suites[state.suite];
  const view = path.join(destination, record.source_view);
  assert.equal(await readFile(path.join(state.repo, 'evals/candidate/cases.json'), 'utf8'), state.files['evals/candidate/cases.json']);
  assert.equal(await readFile(path.join(view, 'evals/candidate/cases.json'), 'utf8'), state.files['evals/candidate/cases-v2.json']);
  assert.equal(record.corpus_aliases[0].sha256, sha256(state.files['evals/candidate/cases-v2.json']));
  assert.equal(await readFile(path.join(destination, 'inputs', state.suite, 'evals/candidate/cases-v2.json'), 'utf8'), state.files['evals/candidate/cases-v2.json']);
  assert.equal(record.candidate_hashes.candidate, treeDigest(await inventory(path.join(state.repo, 'skills/test/candidate'))));
  const staged = await prepareTrial({ repo: view, freezePath: path.join(destination, record.freeze_path), skill: 'candidate', caseId: 'check', destination: path.join(state.root, 'trial') });
  const paths = (await inventory(staged.workspace)).map(entry => entry.path);
  assert.deepEqual(paths, ['.agents/skills/candidate/SKILL.md', '.agents/skills/candidate/references/context.md', 'project/incident.md']);
  assert.equal(staged.run.candidate_tree_sha256, record.candidate_hashes.candidate);
  assert.equal(staged.run.model_selection, 'Inherited; no model or reasoning override passed.');
});

test('mutating a staged package or corpus cannot retain its frozen identity', { timeout: 180000 }, async t => {
  const state = await fixture(t), destination = path.join(state.root, 'staged');
  const manifest = await stageRefresh({ ...state, destination });
  const record = manifest.suites[state.suite], view = path.join(destination, record.source_view);
  const options = { repo: view, freezePath: path.join(destination, record.freeze_path), skill: 'candidate', caseId: 'check', destination: path.join(state.root, 'trial') };
  await writeFile(path.join(view, 'skills/test/candidate/references/context.md'), 'Altered candidate.\n');
  await assert.rejects(prepareTrial(options), /Candidate changed after freeze/);
});

test('refresh staging refuses source directories and reused attempt roots', { timeout: 180000 }, async t => {
  const state = await fixture(t);
  await assert.rejects(stageRefresh({ ...state, destination: path.join(state.repo, 'evidence') }), /outside the repository/);
  await symlink(state.repo, path.join(state.root, 'source-alias'));
  await assert.rejects(stageRefresh({ ...state, destination: path.join(state.root, 'source-alias', 'evidence') }), /outside the repository/);
  const destination = path.join(state.root, 'staged');
  await stageRefresh({ ...state, destination });
  await assert.rejects(stageRefresh({ ...state, destination }), error => error.code === 'EEXIST');
});
