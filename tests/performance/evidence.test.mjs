import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, lstat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { originalPublishedDigest } from '../../scripts/lib/published-file.mjs';

// Historical artifact integrity, not a rerun or independent grading of answers.
const archive = fileURLToPath(new URL('../../evals/performance/runs/2026-10-01/', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const relative = value => typeof value === 'string' && value.length > 0
  && !path.isAbsolute(value) && !value.includes('\\')
  && value.split('/').every(part => part && part !== '.' && part !== '..');

const candidatePath = name => /^[^/]+\/candidate\//.test(name);
const originalManifest = async () => JSON.parse(await readFile(path.join(archive, 'manifest.json'), 'utf8'));

test('performance retained archive binds all present artifacts and locates every candidate in the release', async () => {
  const manifest = JSON.parse(await readFile(path.join(archive, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.kind, 'adapted-forward-tests');
  assert.ok(manifest.files.length > 0);
  assert.equal(new Set(manifest.files.map(item => item.path)).size, manifest.files.length);
  const actual = [];
  async function visit(prefix = '') {
    for (const entry of await readdir(path.join(archive, prefix), { withFileTypes: true })) {
      assert.ok(!entry.isSymbolicLink());
      const filename = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(filename);
      else actual.push(filename);
    }
  }
  await visit();
  assert.deepEqual(actual.filter(name => name !== 'manifest.json').sort(),
    manifest.files.filter(item => !candidatePath(item.path)).map(item => item.path).sort());
  const releaseRoot = new URL('../../evals/engineering-toolkit/runs/', import.meta.url);
  const catalog = JSON.parse(await readFile(new URL('release-archive.json', releaseRoot), 'utf8'));
  const archiveDoc = await readFile(new URL('ARCHIVE.md', releaseRoot), 'utf8');
  assert.ok(archiveDoc.includes(catalog.artifact.name));
  assert.ok(archiveDoc.includes(catalog.artifact.sha256));
  assert.equal(new Set(manifest.files.filter(item => candidatePath(item.path)).map(item => item.path.split('/')[0])).size, 6);
  for (const item of manifest.files) {
    assert.ok(relative(item.path));
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    if (candidatePath(item.path)) continue; // Raw candidate checks run against a restored release with check-performance-archive.mjs.
    assert.ok((await lstat(path.join(archive, item.path))).isFile());
    assert.equal(originalPublishedDigest(await readFile(path.join(archive, item.path)), `evals/performance/runs/2026-10-01/${item.path}`), item.sha256);
  }
});

test('forward-test inputs retain candidate, fixture and selected rubric bindings', async () => {
  const manifest = await originalManifest();
  const records = JSON.parse(await readFile(path.join(archive, 'index.json'), 'utf8'));
  assert.equal(new Set(records.map(item => item.skill)).size, records.length);
  for (const item of records) {
    assert.ok(relative(item.skill));
    const run = JSON.parse(await readFile(path.join(archive, item.skill, 'run-input.json'), 'utf8'));
    assert.equal(run.skill, item.skill);
    assert.equal(run.case_id, item.case_id);
    assert.ok(run.capability_deviations.length > 0);
    for (const [folder, files] of [['candidate', run.candidate_files], ['project', run.fixture_files]]) {
      assert.ok(Object.keys(files).length > 0);
      for (const [filename, expected] of Object.entries(files)) {
        assert.ok(relative(filename));
        if (folder === 'candidate') {
          assert.equal(manifest.files.find(entry => entry.path === `${item.skill}/${folder}/${filename}`)?.sha256, expected);
        } else assert.equal(digest(await readFile(path.join(archive, item.skill, folder, filename))), expected);
      }
    }
    const rubric = JSON.parse(await readFile(path.join(archive, item.skill, 'rubric.json'), 'utf8'));
    assert.equal(digest(Buffer.from(JSON.stringify(rubric))), run.source_rubric_sha256);
  }
});
