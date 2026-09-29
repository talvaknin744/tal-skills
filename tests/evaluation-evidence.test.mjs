import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { checkEvaluationEvidence } from '../scripts/check-evaluation-evidence.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-published-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, 'skills', 'attempt');
  fs.mkdirSync(directory, { recursive: true });
  const rubric = [{ id: 'scope', severity: 'critical', criterion: 'Preserve the declared task boundary.' }];
  const run = {
    run_id: 'attempt', run_evidence_sha256: sha('original run seal'), case_id: 'case',
    candidate_tree_sha256: sha('candidate'), final_workspace_tree_sha256: sha('workspace'),
    rubric_sha256: sha(JSON.stringify(rubric)), evidence_files: [{ path: 'trace.jsonl', sha256: sha('private original trace') }],
  };
  const manifest = { schema_version: 1, run_id: 'attempt', source_run_evidence_sha256: run.run_evidence_sha256, files: [] };
  const put = (name, bytes, original = bytes) => {
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true });
    fs.writeFileSync(path.join(directory, name), bytes);
    const entry = { path: name, original_sha256: sha(original), published_sha256: sha(bytes), transformed: bytes !== original };
    const index = manifest.files.findIndex(value => value.path === name);
    if (index < 0) manifest.files.push(entry); else manifest.files[index] = entry;
  };
  const save = () => fs.writeFileSync(path.join(directory, 'archive-manifest.json'), json(manifest));
  put('evidence/run.json', json(run));
  put('evidence/trace.jsonl', 'redacted public trace', 'private original trace');
  put('rubric.json', json({ case_id: run.case_id, rubric_sha256: run.rubric_sha256, rubric }));
  const { evidence_files: ignored, ...score } = run;
  put('score.json', json(score));
  save();
  return { root, directory, run, manifest, put, save };
}

test('checks published bytes while retaining the original trace and score bindings', t => {
  const f = fixture(t);
  const before = fs.readFileSync(path.join(f.directory, 'archive-manifest.json'));
  const result = checkEvaluationEvidence(f.root);
  assert.equal(result.manifests_checked, 1);
  assert.equal(result.published_artifacts_checked, 4);
  assert.ok(result.source_bindings_checked > 0);
  assert.deepEqual(fs.readFileSync(path.join(f.directory, 'archive-manifest.json')), before);
});

test('refuses missing or corrupted published artifacts', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.directory, 'evidence/trace.jsonl'), 'different bytes');
  assert.throws(() => checkEvaluationEvidence(f.root), /Published SHA256 mismatch: evidence\/trace.jsonl/);
  fs.unlinkSync(path.join(f.directory, 'evidence/trace.jsonl'));
  assert.throws(() => checkEvaluationEvidence(f.root), /ENOENT/);
});

test('refuses traversal, absolute, ambiguous and duplicate manifest paths', t => {
  const f = fixture(t), original = f.manifest.files[0].path;
  for (const unsafe of ['../outside', '/etc/passwd', 'C:\\outside', 'C:relative', 'evidence/../run.json', 'evidence//run.json', './run.json']) {
    f.manifest.files[0].path = unsafe; f.save();
    assert.throws(() => checkEvaluationEvidence(f.root), /Unsafe archive path/, unsafe);
  }
  f.manifest.files[0].path = original;
  f.manifest.files.push({ ...f.manifest.files[0] }); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Duplicate manifest entry/);
});

test('refuses symlinked files and directory traversal through symlinks', t => {
  const f = fixture(t), trace = path.join(f.directory, 'evidence/trace.jsonl');
  fs.unlinkSync(trace);
  fs.symlinkSync('run.json', trace);
  assert.throws(() => checkEvaluationEvidence(f.root), /Symlink refused/);
  fs.unlinkSync(trace);
  fs.symlinkSync('../evidence', path.join(f.directory, 'linked-evidence'));
  assert.throws(() => checkEvaluationEvidence(f.root), /Symlink refused/);
});

test('rehashing a substituted score cannot conceal its mismatched source run', t => {
  const f = fixture(t), score = JSON.parse(fs.readFileSync(path.join(f.directory, 'score.json')));
  score.run_evidence_sha256 = sha('different run');
  f.put('score.json', json(score)); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: score.json\/run_evidence_sha256/);
});

test('native score hashes bind to original evidence and published trial sources', t => {
  const f = fixture(t);
  f.manifest = { schema_version: 1, workflow: 'tal-example', files: [] };
  const base = path.join(f.root, 'native', 'attempt'); fs.mkdirSync(base, { recursive: true });
  const documents = {
    'evidence/run.json': json({ workflow: 'tal-example', final_files: [{ path: 'service.py', sha256: sha('source') }] }),
    'evidence/prepared.json': json({ workflow: 'tal-example', source_digest: sha('closure'), fixture_index_sha256: sha('index') }),
    'trial/service.py': 'source',
  };
  const score = { workflow: 'tal-example', source_digest: sha('closure'), fixture_index_sha256: sha('index'),
    bindings: { 'evidence/run.json': sha(documents['evidence/run.json']) }, candidate_sha256: { 'service.py': sha('source') } };
  documents['independent-score.json'] = json(score);
  for (const [name, bytes] of Object.entries(documents)) {
    fs.mkdirSync(path.dirname(path.join(base, name)), { recursive: true }); fs.writeFileSync(path.join(base, name), bytes);
    f.manifest.files.push({ path: name, original_sha256: sha(bytes), published_sha256: sha(bytes), transformed: false });
  }
  const save = () => fs.writeFileSync(path.join(base, 'archive-manifest.json'), json(f.manifest)); save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 2);
  score.candidate_sha256['service.py'] = sha('wrong source');
  const bytes = json(score); fs.writeFileSync(path.join(base, 'independent-score.json'), bytes);
  Object.assign(f.manifest.files.find(entry => entry.path === 'independent-score.json'), { original_sha256: sha(bytes), published_sha256: sha(bytes) }); save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: trial\/service.py/);
});

test('append-only supplements bind their base manifest and their own published bytes', t => {
  const f = fixture(t), bytes = json({ purpose: 'Clarify interpretation without replacing original score' });
  const supplement = { schema_version: 1, base_manifest_sha256: sha(fs.readFileSync(path.join(f.directory, 'archive-manifest.json'))),
    files: [{ path: 'review-note.json', original_sha256: sha(bytes), published_sha256: sha(bytes), transformed: false }] };
  fs.writeFileSync(path.join(f.directory, 'review-note.json'), bytes);
  const save = () => fs.writeFileSync(path.join(f.directory, 'scoring-supplement-manifest.json'), json(supplement)); save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 2);
  supplement.base_manifest_sha256 = sha('different manifest'); save();
  assert.throws(() => checkEvaluationEvidence(f.root), /supplement\/base manifest/);
});

test('a substituted native fixture index cannot reuse an earlier prepared-run identity', t => {
  const f = fixture(t), index = json({ cases: [{ id: 'original-case' }] });
  f.put('evidence/prepared.json', json({ fixture_index_sha256: sha(index) }));
  f.put('fixture-index.json', index); f.save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
  // Even internally consistent artifact hashes must bind the index selected
  // before execution; changing the manifest does not change that preparation.
  f.put('fixture-index.json', json({ cases: [{ id: 'replacement-case' }] })); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: fixture-index.json/);
});

test('source bindings can resolve through a runtime supplement but cannot remain unpublished', t => {
  const f = fixture(t), score = JSON.parse(fs.readFileSync(path.join(f.directory, 'score.json')));
  const name = 'trial/scratch/report.json', bytes = json({ observed: true });
  score.bindings = { [name]: sha(bytes) };
  f.put('score.json', json(score)); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Source binding has no declared artifact: trial\/scratch\/report.json/);
  fs.mkdirSync(path.dirname(path.join(f.directory, name)), { recursive: true });
  fs.writeFileSync(path.join(f.directory, name), bytes);
  // Presence alone does not establish declared publication.
  assert.throws(() => checkEvaluationEvidence(f.root), /Source binding has no declared artifact/);
  const supplement = { schema_version: 1, base_manifest_sha256: sha(fs.readFileSync(path.join(f.directory, 'archive-manifest.json'))),
    files: [{ path: name, original_sha256: sha(bytes), published_sha256: sha(bytes), transformed: false }] };
  fs.writeFileSync(path.join(f.directory, 'runtime-supplement-manifest.json'), json(supplement));
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 2);
});

test('rehashing a clarification cannot change the original score it claims to clarify', t => {
  const f = fixture(t), scoreBytes = fs.readFileSync(path.join(f.directory, 'score.json'), 'utf8');
  f.put('independent-score.json', scoreBytes); f.save();
  const clarification = { original_score_sha256: sha(scoreBytes), run_sha256: sha(fs.readFileSync(path.join(f.directory, 'evidence/run.json'))) };
  const supplement = { schema_version: 1, base_manifest_sha256: sha(fs.readFileSync(path.join(f.directory, 'archive-manifest.json'))), files: [] };
  const save = () => {
    const bytes = json(clarification);
    fs.writeFileSync(path.join(f.directory, 'scoring-clarification.json'), bytes);
    supplement.files = [{ path: 'scoring-clarification.json', original_sha256: sha(bytes), published_sha256: sha(bytes), transformed: false }];
    fs.writeFileSync(path.join(f.directory, 'scoring-supplement-manifest.json'), json(supplement));
  };
  save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 2);
  clarification.original_score_sha256 = sha('unrelated score'); save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: independent-score.json/);
});
