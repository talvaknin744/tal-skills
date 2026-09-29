import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createFixture } from './fixtures.mjs';
import { buildInstallPlan, applyInstallPlan, publicPlan, recoverInstallation, MANIFEST } from '../../scripts/toolkit/index.mjs';
import { readTree } from '../../scripts/toolkit/paths.mjs';

const planFor = (f, options = {}) => buildInstallPlan({ sourceRoot: f.source, target: f.target, host: 'both', discoveryRoots: [], ...options });
const snapshot = root => [...readTree(root)].map(([name, value]) => [name, value.bytes.toString('base64'), value.mode]);

for (const host of ['codex', 'claude', 'both']) test(`${host} installs into a Unicode path, with exact no-op repetition`, t => {
  const f = createFixture(t), plan = planFor(f, { host });
  assert.equal(plan.conflicts.length, 0);
  assert.equal(fs.readdirSync(f.target).length, 0, 'planning is read only');
  const output = publicPlan(plan);
  assert.equal(output.native_execution.startsWith('not-run'), true);
  assert.equal(JSON.stringify(output).includes('bytes'), false);
  applyInstallPlan(plan);
  const before = snapshot(f.target), mtime = fs.statSync(path.join(f.target, MANIFEST)).mtimeMs;
  const repeat = planFor(f, { host });
  assert.ok(repeat.operations.every(entry => entry.action === 'unchanged'));
  assert.deepEqual(applyInstallPlan(repeat), { applied: false, changed_files: 0, target: fs.realpathSync(f.target) });
  assert.deepEqual(snapshot(f.target), before);
  assert.equal(fs.statSync(path.join(f.target, MANIFEST)).mtimeMs, mtime);
  assert.equal(fs.readdirSync(f.target).some(name => name.startsWith('.tal-skills-install')), false);
});

test('upgrade updates owned resources, recreates a missing file, and removes obsolete resources', t => {
  const f = createFixture(t);
  f.write('skills/languages/python-backend/obsolete.txt', 'Obsolete bytes\n');
  applyInstallPlan(planFor(f));
  fs.unlinkSync(path.join(f.source, 'skills/languages/python-backend/obsolete.txt'));
  f.write('skills/languages/python-backend/references/details.md', '# Details\nUpdated guidance.\n');
  fs.unlinkSync(path.join(f.target, '.agents/skills/python-backend/LICENSE'));
  fs.writeFileSync(path.join(f.target, 'user-notes.md'), 'Keep me.\n');
  const plan = planFor(f);
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.operations.find(x => x.path === '.agents/skills/python-backend/LICENSE').action, 'create');
  assert.equal(plan.operations.find(x => x.path === '.agents/skills/python-backend/obsolete.txt').action, 'remove');
  applyInstallPlan(plan);
  assert.equal(f.read('.agents/skills/python-backend/LICENSE'), 'MIT\n');
  assert.equal(f.read('.claude/skills/python-backend/references/details.md'), '# Details\nUpdated guidance.\n');
  assert.equal(fs.existsSync(path.join(f.target, '.agents/skills/python-backend/obsolete.txt')), false);
  assert.equal(f.read('user-notes.md'), 'Keep me.\n');
});

test('explicit selections replace prior choices while omitted selections retain them', t => {
  const f = createFixture(t);
  applyInstallPlan(planFor(f, { agents: ['tal-python'] }));
  assert.deepEqual(planFor(f).selection, { agents: ['tal-python'], workflows: [] });
  const changed = planFor(f, { workflows: ['tal-backend-delivery'] });
  assert.deepEqual(changed.selection, { agents: [], workflows: ['tal-backend-delivery'] });
  applyInstallPlan(changed);
  assert.deepEqual(planFor(f).selection, changed.selection);
});

test('interrupted host removal restores both original contents and parent directories', t => {
  const f = createFixture(t);
  applyInstallPlan(planFor(f));
  const before = snapshot(f.target), manifest = JSON.parse(f.read(MANIFEST));
  const plan = planFor(f, { host: 'codex' });
  assert.throws(() => applyInstallPlan(plan, { failAt: 'before-manifest' }), /Simulated interruption/);
  assert.equal(fs.existsSync(path.join(f.target, '.claude')), false);
  assert.equal(recoverInstallation(f.target).action, 'rolled-back');
  assert.deepEqual(snapshot(f.target), before);
  for (const dir of manifest.created_directories) assert.ok(fs.statSync(path.join(f.target, dir)).isDirectory());
  assert.ok(planFor(f).operations.every(entry => entry.action === 'unchanged'));
});

test('preexisting host settings, parent permissions and executable resource bits are preserved', t => {
  const f = createFixture(t);
  for (const filename of ['.codex/config.toml', '.claude/settings.json']) {
    const target = path.join(f.target, filename); fs.mkdirSync(path.dirname(target)); fs.writeFileSync(target, 'user settings\n');
  }
  fs.chmodSync(path.join(f.target, '.codex'), 0o700);
  f.write('skills/languages/python-backend/scripts/check.sh', '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(f.source, 'skills/languages/python-backend/scripts/check.sh'), 0o755);
  applyInstallPlan(planFor(f));
  assert.equal(f.read('.codex/config.toml'), 'user settings\n');
  assert.equal(f.read('.claude/settings.json'), 'user settings\n');
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(path.join(f.target, '.codex')).mode & 0o777, 0o700);
    assert.equal(fs.statSync(path.join(f.target, '.agents/skills/python-backend/scripts/check.sh')).mode & 0o111, 0o111);
  }
});
