import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { checkRetainedEvaluationEvidence } from '../scripts/check-evaluation-evidence.mjs';
import { originalPublishedDigest } from '../scripts/lib/published-file.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-retained-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rubric = [{ id: 'scope', severity: 'critical', criterion: 'Keep the supplied scope.' }];
  const rubricHash = hash(JSON.stringify(rubric));
  const data = {
    'attempt/rubric.json': JSON.stringify({ case_id: 'case', rubric_sha256: rubricHash, rubric }),
    'attempt/score.json': JSON.stringify({ case_id: 'case', rubric_sha256: rubricHash, criteria: [{ id: 'scope', score: 0 }] }),
  };
  data['attempt/archive-manifest.json'] = JSON.stringify({ schema_version: 1, files: Object.entries(data).map(([name, bytes]) => ({ path: path.basename(name), original_sha256: hash(bytes), published_sha256: hash(bytes), transformed: false })) });
  const artifact = { name: 'tal-skills-evidence-2026-10-02.tar.zst', sha256: hash('compressed archive'), bytes: 123, release_url: 'https://example.org/release' };
  const catalog = { schema_version: 1, artifact, archived_trees: ['attempt/evidence'], retained: Object.entries(data).map(([name, bytes]) => ({ path: name, original_sha256: hash(bytes), sha256: hash(bytes) })) };
  for (const [name, bytes] of Object.entries(data)) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), bytes); }
  fs.writeFileSync(path.join(root, 'ARCHIVE.md'), Object.values(artifact).join('\n'));
  const save = () => fs.writeFileSync(path.join(root, 'release-archive.json'), JSON.stringify(catalog)); save();
  return { root, catalog, save };
}
test('retained checks preserve failed scores and distinguish absent source verification', t => {
  const f = fixture(t), before = fs.readFileSync(path.join(f.root, 'attempt/score.json'));
  const result = checkRetainedEvaluationEvidence(f.root);
  assert.equal(result.archived_source_bindings_checked, 0);
  assert.equal(result.retained_artifacts_checked, 3);
  assert.deepEqual(fs.readFileSync(path.join(f.root, 'attempt/score.json')), before);
});
test('retained artifact corruption, omission and extra files fail', t => {
  const f = fixture(t), score = path.join(f.root, 'attempt/score.json');
  fs.writeFileSync(score, 'changed score');
  assert.throws(() => checkRetainedEvaluationEvidence(f.root), /retained bytes/);
  fs.unlinkSync(score);
  assert.throws(() => checkRetainedEvaluationEvidence(f.root), /ENOENT/);
  const extra = fixture(t); fs.writeFileSync(path.join(extra.root, 'extra.json'), '{}');
  assert.throws(() => checkRetainedEvaluationEvidence(extra.root), /complete retained inventory/);
});
test('rehashing a changed score still fails its original historical binding', t => {
  const f = fixture(t), name = 'attempt/score.json';
  const bytes = JSON.stringify({ case_id: 'replacement', rubric_sha256: hash('different rubric') });
  fs.writeFileSync(path.join(f.root, name), bytes);
  Object.assign(f.catalog.retained.find(entry => entry.path === name), { sha256: hash(bytes), original_sha256: hash(bytes) }); f.save();
  assert.throws(() => checkRetainedEvaluationEvidence(f.root), /original retained binding/);
});
test('release metadata, unsafe locations and symlinks fail', t => {
  const f = fixture(t); f.catalog.artifact.sha256 = hash('another archive'); f.save();
  assert.throws(() => checkRetainedEvaluationEvidence(f.root), /ARCHIVE.md disagrees/);
  const unsafe = fixture(t); unsafe.catalog.archived_trees = ['../outside']; unsafe.save();
  assert.throws(() => checkRetainedEvaluationEvidence(unsafe.root), /Unsafe archive path/);
  const linked = fixture(t), name = path.join(linked.root, 'attempt/score.json'); fs.unlinkSync(name); fs.symlinkSync('rubric.json', name);
  assert.throws(() => checkRetainedEvaluationEvidence(linked.root), /Symlink refused/);
});
test('recorded path redactions bind exact current bytes and original identity', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-redaction-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const original = `/${'Users'}/${'alice'}/project`, published = '$HOME/project';
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs/path-redactions.json'), JSON.stringify({ schema_version: 1, files: [{ path: 'record.json', transformation: 'personal-home-path-redaction', original_sha256: hash(original), published_sha256: hash(published) }] }));
  assert.equal(originalPublishedDigest(published, 'record.json', root), hash(original));
  assert.throws(() => originalPublishedDigest('changed score', 'record.json', root), /Redacted publication changed/);
  assert.equal(originalPublishedDigest('untransformed', 'other.json', root), hash('untransformed'));
});
