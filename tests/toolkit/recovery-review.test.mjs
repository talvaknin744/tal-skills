import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createFixture } from './fixtures.mjs';
import { buildInstallPlan, applyInstallPlan, recoverInstallation, JOURNAL } from '../../scripts/toolkit/index.mjs';
const planFor = f => buildInstallPlan({ sourceRoot: f.source, target: f.target, host: 'codex', discoveryRoots: [] });

for (const mode of [0o755, 0o600]) test(`a local chmod ${mode.toString(8)} blocks the entire upgrade`, { skip: process.platform === 'win32' }, t => {
  const f = createFixture(t); applyInstallPlan(planFor(f));
  const filename = path.join(f.target, '.agents/skills/python-backend/LICENSE');
  fs.chmodSync(filename, mode);
  const plan = planFor(f);
  assert.ok(plan.conflicts.some(item => item.path === '.agents/skills/python-backend/LICENSE'));
  assert.throws(() => applyInstallPlan(plan), /conflicts/);
  assert.equal(fs.statSync(filename).mode & 0o777, mode);
});

test('recovery restores a mode-only update with identical file bytes', { skip: process.platform === 'win32' }, t => {
  const f = createFixture(t); applyInstallPlan(planFor(f));
  fs.chmodSync(path.join(f.source, 'skills/languages/python-backend/LICENSE'), 0o755);
  assert.throws(() => applyInstallPlan(planFor(f), { failAt: 'before-manifest' }), /Simulated interruption/);
  const filename = path.join(f.target, '.agents/skills/python-backend/LICENSE');
  assert.equal(fs.statSync(filename).mode & 0o777, 0o755);
  recoverInstallation(f.target);
  assert.equal(fs.statSync(filename).mode & 0o777, 0o644);
});

test('unknown staging files survive recovery and block destructive cleanup', t => {
  const f = createFixture(t);
  assert.throws(() => applyInstallPlan(planFor(f), { failAt: 'staged' }), /Simulated interruption/);
  const journal = JSON.parse(f.read(JOURNAL)), foreign = path.join(f.target, journal.stage, 'keep-my-note.txt');
  fs.writeFileSync(foreign, 'Third-party note.\n');
  assert.throws(() => recoverInstallation(f.target), /Unexpected staging/);
  assert.equal(fs.readFileSync(foreign, 'utf8'), 'Third-party note.\n');
  assert.ok(fs.existsSync(path.join(f.target, JOURNAL)));
});

test('interrupted host removal restores restrictive directory permissions', { skip: process.platform === 'win32' }, t => {
  const f = createFixture(t);
  const plan = host => buildInstallPlan({ sourceRoot: f.source, target: f.target, host, discoveryRoots: [] });
  applyInstallPlan(plan('both'));
  const directory = path.join(f.target, '.claude');
  fs.chmodSync(directory, 0o700);
  assert.throws(() => applyInstallPlan(plan('codex'), { failAt: 'before-manifest' }), /Simulated interruption/);
  assert.equal(fs.existsSync(directory), false);
  recoverInstallation(f.target);
  assert.equal(fs.statSync(directory).mode & 0o777, 0o700);
});
