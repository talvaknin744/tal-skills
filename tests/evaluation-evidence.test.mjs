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
const treeHash = records => sha(JSON.stringify([...records].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
function completeFixture(t, native = false) {
  const f = fixture(t);
  const records = contents => Object.entries(contents).map(([name, bytes]) => ({ path: name, sha256: sha(bytes), mode: 0o644 }));
  const candidate = native ? { '.agents/skills/sample/SKILL.md': 'skill', '.codex/agents/sample.toml': 'agent' } : { 'SKILL.md': 'skill', 'references/checks.md': 'checks' };
  const original = { 'service.py': 'old source', 'removed.py': 'removed source' };
  const final = { 'service.py': 'new source', 'added.py': 'added source' };
  if (native) {
    f.prepared = { baseline: records({ ...candidate, ...original }) };
    f.run.final_files = records({ ...candidate, ...final });
    f.put('evidence/prepared.json', json(f.prepared));
    f.manifest.complete_source_trees = ['candidate-dependencies', 'original-project', 'trial'];
  } else {
    f.run.skill = 'sample';
    const stagedCandidate = Object.fromEntries(Object.entries(candidate).map(([name, bytes]) => [`.agents/skills/sample/${name}`, bytes]));
    const project = contents => Object.fromEntries(Object.entries(contents).map(([name, bytes]) => [`project/${name}`, bytes]));
    f.source = { candidate_files: records(candidate), fixture_files: records(original), workspace_before: records({ ...stagedCandidate, ...project(original) }) };
    Object.assign(f.source, { candidate_tree_sha256: treeHash(f.source.candidate_files), fixture_tree_sha256: treeHash(f.source.fixture_files), workspace_before_sha256: treeHash(f.source.workspace_before) });
    f.changes = { workspace_after: records({ ...stagedCandidate, ...project(final) }) };
    Object.assign(f.run, { candidate_tree_sha256: f.source.candidate_tree_sha256, fixture_tree_sha256: f.source.fixture_tree_sha256, final_workspace_tree_sha256: treeHash(f.changes.workspace_after) });
    f.put('evidence/manifest.json', json(f.source));
    f.put('evidence/workspace-changes.json', json(f.changes));
    f.run.evidence_files.push(...['manifest.json', 'workspace-changes.json'].map(name => ({ path: name, sha256: sha(fs.readFileSync(path.join(f.directory, 'evidence', name))) })));
    f.manifest.complete_source_trees = ['candidate', 'original-project', 'final-project'];
  }
  for (const [tree, contents] of [[native ? 'candidate-dependencies' : 'candidate', candidate], ['original-project', original], [native ? 'trial' : 'final-project', final]]) {
    for (const [name, bytes] of Object.entries(contents)) f.put(`${tree}/${name}`, bytes);
  }
  f.put('evidence/run.json', json(f.run));
  const { evidence_files: ignored, ...score } = f.run;
  f.put('score.json', json(score)); f.save();
  return f;
}
function removeSource(f, name) {
  fs.rmSync(path.join(f.directory, name), { recursive: true, force: true });
  f.manifest.files = f.manifest.files.filter(entry => entry.path !== name && !entry.path.startsWith(`${name}/`));
  f.save();
}
function linuxFixture(t, keepRunFinal = false) {
  const f = completeFixture(t, true);
  f.linuxHost = { final_files: structuredClone(f.run.final_files) };
  if (!keepRunFinal) delete f.run.final_files;
  f.saveLinuxHost = (bind = true) => {
    const bytes = json(f.linuxHost);
    f.put('evidence/linux-host.json', bytes);
    const score = JSON.parse(fs.readFileSync(path.join(f.directory, 'score.json')));
    score.bindings = bind ? { 'evidence/linux-host.json': sha(bytes) } : {};
    f.put('score.json', json(score));
    f.put('evidence/run.json', json(f.run)); f.save();
  };
  f.saveLinuxHost();
  return f;
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

test('complete single-skill and native trees bind source inventories including additions and removals', t => {
  for (const native of [false, true]) {
    const f = completeFixture(t, native);
    assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
    const name = native ? 'candidate-dependencies/.codex/agents/sample.toml' : 'candidate/references/checks.md';
    const original = fs.readFileSync(path.join(f.directory, name), 'utf8');
    f.put(name, 'redacted publication', original); f.save();
    assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
  }
});

test('complete declarations reject omitted source trees even after deleting and rehashing archive entries', t => {
  for (const native of [false, true]) {
    for (const tree of native ? ['candidate-dependencies', 'original-project', 'trial'] : ['candidate', 'original-project', 'final-project']) {
      const f = completeFixture(t, native);
      removeSource(f, tree);
      assert.throws(() => checkEvaluationEvidence(f.root), new RegExp(`complete source tree/${tree}`));
    }
  }
});

test('present source files bind to their recorded hashes even without completeness declarations', t => {
  for (const native of [false, true]) {
    for (const tree of native ? ['candidate-dependencies', 'original-project', 'trial'] : ['candidate', 'original-project', 'final-project']) {
      const f = completeFixture(t, native);
      delete f.manifest.complete_source_trees;
      const name = f.manifest.files.find(entry => entry.path.startsWith(`${tree}/`)).path;
      f.put(name, 'substituted source'); f.save();
      assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch:/);
    }
  }
});

test('legacy partial archives remain valid but a declaration requires the whole inventory', t => {
  const f = completeFixture(t);
  removeSource(f, 'candidate/references/checks.md');
  delete f.manifest.complete_source_trees; f.save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
  f.manifest.complete_source_trees = ['candidate']; f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /complete source tree\/candidate/);
});

test('native project dotfiles remain project sources in complete and legacy partial archives', t => {
  const f = completeFixture(t, true);
  for (const name of ['.gitignore', '.github/workflows/ci.yml']) {
    const bytes = `project source: ${name}`;
    const record = { path: name, sha256: sha(bytes), mode: 0o644 };
    f.prepared.baseline.push(record); f.run.final_files.push(record);
    f.put(`original-project/${name}`, bytes); f.put(`trial/${name}`, bytes);
  }
  f.put('evidence/prepared.json', json(f.prepared)); f.put('evidence/run.json', json(f.run)); f.save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
  delete f.manifest.complete_source_trees; f.save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
});

test('complete source trees reject extra declared or undeclared on-disk files', t => {
  for (const declared of [false, true]) {
    const f = completeFixture(t);
    if (declared) f.put('candidate/unrecorded.md', 'extra source');
    else fs.writeFileSync(path.join(f.directory, 'candidate/unrecorded.md'), 'extra source');
    f.save();
    assert.throws(() => checkEvaluationEvidence(f.root), declared ? /absent from recorded inventory/ : /complete source directory\/candidate/);
  }
});

test('source inventory paths and aggregate identities cannot be replaced by rehashing publication rows', t => {
  for (const corrupt of [
    f => { f.source.candidate_files.push({ ...f.source.candidate_files[0] }); },
    f => { f.source.fixture_files[0].path = '../escape'; },
    f => { f.source.candidate_files[0].sha256 = sha('different candidate'); },
    f => { f.changes.workspace_after[0].sha256 = sha('different workspace'); },
    f => { f.source.workspace_before[0].mode = -1; },
  ]) {
    const f = completeFixture(t); corrupt(f);
    // Rehash both the exported metadata and its recorded evidence hash, so the
    // source-tree checks themselves must detect the inconsistent inventory.
    f.put('evidence/manifest.json', json(f.source));
    f.put('evidence/workspace-changes.json', json(f.changes));
    for (const entry of f.run.evidence_files.filter(entry => ['manifest.json', 'workspace-changes.json'].includes(entry.path))) entry.sha256 = sha(fs.readFileSync(path.join(f.directory, 'evidence', entry.path)));
    f.put('evidence/run.json', json(f.run)); f.save();
    assert.throws(() => checkEvaluationEvidence(f.root), /Duplicate source inventory|Unsafe archive path|Binding mismatch: (manifest\/candidate tree|run\/workspace after)|Invalid source mode/);
  }
});

test('native final dependency metadata cannot silently disagree with its published source', t => {
  const f = completeFixture(t, true);
  f.run.final_files[0].sha256 = sha('mutated dependency');
  f.put('evidence/run.json', json(f.run)); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: candidate-dependencies/);
});

test('an honestly recorded dependency change remains archivable without implying behavioral acceptance', t => {
  const f = completeFixture(t, true), entry = f.run.final_files[0];
  entry.sha256 = sha('changed dependency');
  f.put(`candidate-dependencies/${entry.path}`, 'changed dependency');
  f.put('evidence/run.json', json(f.run)); f.save();
  assert.notEqual(entry.sha256, f.prepared.baseline[0].sha256);
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
});

test('completeness declarations are typed, known, base-only and require recorded inventories', t => {
  for (const declaration of [null, true, ['unknown'], ['candidate', 'candidate']]) {
    const f = fixture(t); f.manifest.complete_source_trees = declaration; f.save();
    assert.throws(() => checkEvaluationEvidence(f.root), /Invalid complete_source_trees/);
  }
  const f = fixture(t); f.manifest.complete_source_trees = ['candidate']; f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /requires recorded inventory/);
  const g = fixture(t);
  const supplement = { schema_version: 1, base_manifest_sha256: sha(fs.readFileSync(path.join(g.directory, 'archive-manifest.json'))), complete_source_trees: ['candidate'], files: [g.manifest.files[0]] };
  fs.writeFileSync(path.join(g.directory, 'source-supplement-manifest.json'), json(supplement));
  assert.throws(() => checkEvaluationEvidence(g.root), /Only the base archive/);
});

test('a complete inventory may resolve through a bound supplement but not an unpublished file', t => {
  const f = completeFixture(t), name = 'candidate/references/checks.md';
  const entry = f.manifest.files.find(value => value.path === name);
  f.manifest.files = f.manifest.files.filter(value => value.path !== name); f.save();
  assert.throws(() => checkEvaluationEvidence(f.root), /complete source tree\/candidate/);
  const supplement = { schema_version: 1, base_manifest_sha256: sha(fs.readFileSync(path.join(f.directory, 'archive-manifest.json'))), files: [entry] };
  fs.writeFileSync(path.join(f.directory, 'source-supplement-manifest.json'), json(supplement));
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 2);
});

test('complete Linux native trees use the source-bound host inventory without rewriting the run', t => {
  const f = linuxFixture(t);
  const before = fs.readFileSync(path.join(f.directory, 'evidence/run.json'));
  assert.equal(JSON.parse(before).final_files, undefined);
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
  assert.deepEqual(fs.readFileSync(path.join(f.directory, 'evidence/run.json')), before);
  // The fallback retains exact project/dependency completeness, not just hashes
  // of whichever source files happen to be exported.
  removeSource(f, 'candidate-dependencies/.codex/agents/sample.toml');
  assert.throws(() => checkEvaluationEvidence(f.root), /complete source tree\/candidate-dependencies/);
});

test('matching run and Linux host inventories compare as path/hash/mode sets', t => {
  const f = linuxFixture(t, true);
  f.linuxHost.final_files.reverse(); f.saveLinuxHost();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
});

test('Linux host inventory can be bound by the run evidence list instead of score bindings', t => {
  const f = linuxFixture(t);
  f.saveLinuxHost(false);
  f.run.evidence_files.push({ path: 'linux-host.json', sha256: sha(fs.readFileSync(path.join(f.directory, 'evidence/linux-host.json'))) });
  f.put('evidence/run.json', json(f.run)); f.save();
  assert.equal(checkEvaluationEvidence(f.root).manifests_checked, 1);
});

test('conflicting dual native inventories fail even after rebinding the Linux artifact', t => {
  for (const corrupt of [
    f => { f.linuxHost.final_files[0].path = '.agents/skills/sample/OTHER.md'; },
    f => { f.linuxHost.final_files[0].sha256 = sha('different contents'); },
    f => { f.linuxHost.final_files[0].mode = 0o755; },
    f => { f.linuxHost.final_files.pop(); },
    f => { delete f.run.final_files[0].mode; },
  ]) {
    const f = linuxFixture(t, true); corrupt(f); f.saveLinuxHost();
    assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch: run\/linux-host final inventory/);
  }
});

test('Linux final inventories require well-formed unique safe paths, hashes and modes', t => {
  for (const corrupt of [
    f => { delete f.linuxHost.final_files; },
    f => { f.linuxHost.final_files = null; },
    f => { f.linuxHost.final_files = {}; },
    f => { f.linuxHost.final_files.push({ ...f.linuxHost.final_files[0] }); },
    f => { f.linuxHost.final_files[0].path = '../escape'; },
    f => { f.linuxHost.final_files[0].sha256 = 'not a digest'; },
    f => { delete f.linuxHost.final_files[0].mode; },
    f => { f.linuxHost.final_files[0].mode = 0o100644; },
  ]) {
    const f = linuxFixture(t); corrupt(f); f.saveLinuxHost();
    assert.throws(() => checkEvaluationEvidence(f.root), /requires recorded inventory|Invalid source inventory|Duplicate source inventory|Unsafe archive path|Invalid SHA256|Invalid source mode/);
  }
  const f = linuxFixture(t, true);
  f.linuxHost.final_files = null; f.saveLinuxHost();
  assert.throws(() => checkEvaluationEvidence(f.root), /Invalid source inventory/);
});

test('Linux fallback rejects missing evidence and inventories outside source hash bindings', t => {
  const missing = linuxFixture(t);
  const score = JSON.parse(fs.readFileSync(path.join(missing.directory, 'score.json')));
  delete score.bindings; missing.put('score.json', json(score));
  removeSource(missing, 'evidence/linux-host.json');
  assert.throws(() => checkEvaluationEvidence(missing.root), /requires recorded inventory/);
  const unbound = linuxFixture(t);
  unbound.saveLinuxHost(false);
  assert.throws(() => checkEvaluationEvidence(unbound.root), /requires a source hash binding/);
  const wrongHash = linuxFixture(t);
  const wrongScore = JSON.parse(fs.readFileSync(path.join(wrongHash.directory, 'score.json')));
  wrongScore.bindings['evidence/linux-host.json'] = sha('unrelated host evidence');
  wrongHash.put('score.json', json(wrongScore)); wrongHash.save();
  assert.throws(() => checkEvaluationEvidence(wrongHash.root), /Binding mismatch: evidence\/linux-host.json/);
  const otherScope = linuxFixture(t);
  const hostBytes = fs.readFileSync(path.join(otherScope.directory, 'evidence/linux-host.json'), 'utf8');
  otherScope.put('evidence/other-host.json', hostBytes);
  const otherScore = JSON.parse(fs.readFileSync(path.join(otherScope.directory, 'score.json')));
  otherScore.bindings = { 'evidence/other-host.json': sha(hostBytes) };
  otherScope.put('score.json', json(otherScore)); otherScope.save();
  assert.throws(() => checkEvaluationEvidence(otherScope.root), /requires a source hash binding/);
  const malformed = linuxFixture(t);
  malformed.put('evidence/linux-host.json', '{not JSON');
  const malformedScore = JSON.parse(fs.readFileSync(path.join(malformed.directory, 'score.json')));
  malformedScore.bindings['evidence/linux-host.json'] = sha('{not JSON');
  malformed.put('score.json', json(malformedScore)); malformed.save();
  assert.throws(() => checkEvaluationEvidence(malformed.root), /JSON/);
});

test('bound Linux inventories still bind every published project and dependency source hash', t => {
  for (const tree of ['trial', 'candidate-dependencies']) {
    const f = linuxFixture(t);
    const name = f.manifest.files.find(entry => entry.path.startsWith(`${tree}/`)).path;
    f.put(name, 'replaced publication'); f.save();
    assert.throws(() => checkEvaluationEvidence(f.root), /Binding mismatch:/);
  }
});
