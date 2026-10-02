import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const helper = fileURLToPath(new URL('../docs/research/worker-rollout-integration/2026-10-02/archive-evaluations.py', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const python = `import importlib.util,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('exporter',sys.argv[1])
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
module.OUTPUT=Path(sys.argv[2])
module.REPO=module.OUTPUT.parent
module.archive(sys.argv[3],'attempt',sys.argv[4],sys.argv[5])
`;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-native-score-export-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const trial = path.join(root, 'trial-root'), scoring = path.join(root, 'scoring');
  const fixtures = path.join(root, 'fixtures'), output = path.join(root, 'output');
  const write = (name, bytes) => { fs.mkdirSync(path.dirname(name), { recursive: true }); fs.writeFileSync(name, bytes); };
  const run = path.join(trial, 'evidence/run.json'), index = path.join(fixtures, 'case-index.json');
  write(run, json({ workflow: 'tal-worker-rollout', case_compliant: false }));
  write(index, json({ cases: [{ id: 'tal-worker-rollout' }] }));
  const raw = path.join(fixtures, 'tal-worker-rollout/rawfiles/deployment.json');
  const prompt = path.join(fixtures, 'tal-worker-rollout/prompt.md');
  write(raw, json({ grace: 90 })); write(prompt, 'Review the rollout.\n');
  const inventory = [];
  for (const [name, bytes] of [
    ['deployment.json', fs.readFileSync(raw)], ['prompt.md', fs.readFileSync(prompt)],
    ['.agents/skills/sample/SKILL.md', Buffer.from('Sample immutable skill.\n')],
  ]) {
    write(path.join(trial, 'trial', name), bytes);
    inventory.push({ path: name, sha256: sha(bytes), mode: 0o644 });
  }
  const score = {
    workflow: 'tal-worker-rollout', trial_root: trial, status: 'blocked_host_capability',
    acceptance: 'not_accepted', candidate_quality_verdict: 'not_inferable_from_host_invalid_attempt',
    case_compliant: false, pass: false,
    criteria: [{ id: 'native_loading', score: 0, status: 'not_observed_host_blocked' }],
    summary: { meaning: 'Evidence coverage only, not candidate quality.' },
    source_identity: { concurrency_package_tree_sha256: sha('historical candidate') },
    source_artifacts: [run, index].map(name => ({ path: name, sha256: sha(fs.readFileSync(name)) })),
    original_inputs: [[raw, 'deployment.json'], [prompt, 'prompt.md']].map(([name, relative]) => ({
      path: name, trial_path: path.join(trial, 'trial', relative), sha256: sha(fs.readFileSync(name)), mode: 0o644,
    })),
    complete_final_inventory: inventory,
  };
  write(path.join(scoring, 'review.md'), 'Host blocked; transport completion is not acceptance.\n');
  const execute = () => {
    write(path.join(scoring, 'score.json'), json(score));
    const before = fs.readFileSync(path.join(scoring, 'score.json'));
    const result = spawnSync('python3', ['-B', '-c', python, helper, output, trial, scoring, fixtures], { encoding: 'utf8', timeout: 10000 });
    assert.deepEqual(fs.readFileSync(path.join(scoring, 'score.json')), before, 'raw score unchanged');
    return result;
  };
  return { root, trial, scoring, fixtures, output, score, write, execute, destination: path.join(output, 'attempt') };
}

test('exports explicit native source inventories as checked bindings while retaining blocked grade fields', t => {
  const f = fixture(t), result = f.execute();
  assert.equal(result.status, 0, result.stderr);
  const score = JSON.parse(fs.readFileSync(path.join(f.destination, 'score.json')));
  const { bindings, ...originalFields } = score;
  assert.deepEqual(originalFields, JSON.parse(JSON.stringify(f.score).split(f.trial).join('/TRIAL').split(f.root).join('/SOURCE')));
  const manifest = JSON.parse(fs.readFileSync(path.join(f.destination, 'archive-manifest.json')));
  assert.equal(Object.keys(bindings).length, 7);
  for (const [name, hash] of Object.entries(bindings)) {
    assert.equal(manifest.files.find(row => row.path === name)?.original_sha256, hash, name);
  }
  assert.equal(bindings['candidate-dependencies/.agents/skills/sample/SKILL.md'], f.score.complete_final_inventory[2].sha256);
  assert.ok(manifest.transformation_notes.some(note => note.includes('derived from its explicit source_artifacts')));
});

test('existing native bindings retain their mapping path without requiring or deriving new inventories', t => {
  const f = fixture(t);
  f.score.bindings = { [f.score.source_artifacts[0].path]: f.score.source_artifacts[0].sha256 };
  delete f.score.trial_root;
  delete f.score.source_artifacts; delete f.score.original_inputs; delete f.score.complete_final_inventory;
  const result = f.execute(); assert.equal(result.status, 0, result.stderr);
  const published = JSON.parse(fs.readFileSync(path.join(f.destination, 'score.json')));
  assert.deepEqual(published.bindings, { 'evidence/run.json': Object.values(f.score.bindings)[0] });
  const { bindings: ignored, ...rest } = published;
  const { bindings: ignoredRaw, ...expected } = f.score;
  assert.deepEqual(rest, expected);
  const manifest = JSON.parse(fs.readFileSync(path.join(f.destination, 'archive-manifest.json')));
  assert.ok(!manifest.transformation_notes.some(note => note.includes('derived from its explicit source_artifacts')));
});

test('grading records preserve reasoning-named criteria while event payloads remain omitted', t => {
  const f = fixture(t);
  f.score.criteria.push({ type: 'reasoning_quality', id: 'reasoning_quality', score: 0, status: 'not_observed_host_blocked', reason: 'No task evidence.' });
  f.write(path.join(f.trial, 'evidence/events.jsonl'), `${JSON.stringify({ type: 'reasoning', id: 'hidden-event', text: 'hidden payload must be omitted' })}\n`);
  const result = f.execute(); assert.equal(result.status, 0, result.stderr);
  const published = JSON.parse(fs.readFileSync(path.join(f.destination, 'score.json')));
  assert.deepEqual(published.criteria, f.score.criteria);
  assert.equal(published.status, 'blocked_host_capability');
  assert.equal(published.pass, false);
  const event = JSON.parse(fs.readFileSync(path.join(f.destination, 'evidence/events.jsonl')));
  assert.deepEqual(event, { type: 'reasoning', id: 'hidden-event', payload_omitted: true, omission_reason: 'reasoning payload' });
  assert.ok(!fs.readFileSync(path.join(f.destination, 'evidence/events.jsonl'), 'utf8').includes('hidden payload must be omitted'));
});

test('rejects colliding copied destinations before creating or overwriting an archive', t => {
  const f = fixture(t);
  f.write(path.join(f.fixtures, 'tal-worker-rollout/rawfiles/prompt.md'), 'Different colliding raw input.\n');
  const result = f.execute();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Duplicate archive copy destination: original-project\/prompt.md/);
  assert.equal(fs.existsSync(f.destination), false);
});

const rejectionCases = [
  ['wrong content hash', f => { f.score.source_artifacts[0].sha256 = sha('wrong'); }, /source hash mismatch/],
  ['undeclared source path', f => { f.score.source_artifacts[0].path = '/unpublished/evidence.json'; }, /not a declared copy source/],
  ['conflicting duplicate binding', f => { f.score.source_artifacts.push({ ...f.score.source_artifacts[0], sha256: sha('different') }); }, /Conflicting native score binding/],
  ['inventory root mismatch', f => { f.score.trial_root = path.join(f.trial, 'other'); }, /inventory root mismatch/],
  ['absolute traversal alias', f => { f.score.source_artifacts[0].path = `${f.trial}/evidence/../evidence/run.json`; }, /Unsafe native score path/],
  ['relative inventory traversal', f => { f.score.complete_final_inventory[0].path = '../deployment.json'; }, /Unsafe native score path/],
  ['absolute inventory path', f => { f.score.complete_final_inventory[0].path = f.score.original_inputs[0].trial_path; }, /Unsafe native score path/],
  ['omitted inventory file', f => { f.score.complete_final_inventory.pop(); }, /complete final inventory differs/],
  ['duplicate inventory file', f => { f.score.complete_final_inventory.push({ ...f.score.complete_final_inventory[0] }); }, /Duplicate native score inventory path/],
  ['missing explicit source inventory', f => { delete f.score.source_artifacts; }, /Missing or invalid native score inventory/],
  ['missing original trial path', f => { delete f.score.original_inputs[0].trial_path; }, /Unsafe native score path/],
  ['original input alias used as trial path', f => { f.score.original_inputs[0].trial_path = f.score.original_inputs[0].path; }, /corresponding trial copy source/],
  ['different same-byte trial path', f => {
    const row = f.score.original_inputs[0], bytes = fs.readFileSync(row.trial_path);
    f.write(path.join(f.trial, 'trial/other.json'), bytes);
    f.score.complete_final_inventory.push({ path: 'other.json', sha256: sha(bytes), mode: 0o644 });
    row.trial_path = path.join(f.trial, 'trial/other.json');
  }, /corresponding trial copy source/],
  ['scorer projection used as trial path', f => {
    const row = f.score.original_inputs[0], projected = path.join(f.scoring, 'trial/deployment.json');
    f.write(projected, fs.readFileSync(row.trial_path)); row.trial_path = projected;
  }, /corresponding trial copy source/],
];
for (const [name, mutate, message] of rejectionCases) {
  test(`rejects ${name} before creating a partial archive`, t => {
    const f = fixture(t); mutate(f); const result = f.execute();
    assert.notEqual(result.status, 0); assert.match(result.stderr, message);
    assert.equal(fs.existsSync(f.destination), false);
  });
}
