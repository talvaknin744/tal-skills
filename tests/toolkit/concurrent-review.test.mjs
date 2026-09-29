import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createFixture } from './fixtures.mjs';
import { buildInstallPlan, applyInstallPlan, recoverInstallation, MANIFEST, JOURNAL } from '../../scripts/toolkit/index.mjs';
const planFor = f => buildInstallPlan({ sourceRoot: f.source, target: f.target, host: 'codex', discoveryRoots: [] });

test('recovery preserves an atomic editor replacement after its first preflight read', t => {
  const f = createFixture(t), plan = planFor(f);
  assert.throws(() => applyInstallPlan(plan, { failAt: 'before-manifest' }), /Simulated interruption/);
  const target = path.join(plan.target, '.codex/agents/tal-python.toml');
  const originalRead = fs.readFileSync; let count = 0;
  fs.readFileSync = function (filename, ...args) {
    if (String(filename) === target && ++count === 2) {
      fs.writeFileSync(`${target}.user-replacement`, 'User edit after recovery preflight.');
      fs.renameSync(`${target}.user-replacement`, target);
    }
    return originalRead.call(this, filename, ...args);
  };
  try { assert.throws(() => recoverInstallation(f.target), /preserving local changes/); }
  finally { fs.readFileSync = originalRead; }
  assert.equal(fs.readFileSync(target, 'utf8'), 'User edit after recovery preflight.');
  assert.ok(fs.existsSync(path.join(f.target, JOURNAL)));
});

test('a package root introduced after planning cannot be adopted', t => {
  const f = createFixture(t), plan = planFor(f);
  const packageRoot = path.join(f.target, '.agents/skills/python-backend');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'user-note.txt'), 'Keep this package unowned.');
  assert.throws(() => applyInstallPlan(plan), /changed|collision/i);
  assert.equal(fs.readFileSync(path.join(packageRoot, 'user-note.txt'), 'utf8'), 'Keep this package unowned.');
  assert.equal(fs.existsSync(path.join(f.target, MANIFEST)), false);
});

test('a public-name collision introduced after planning blocks apply', t => {
  const f = createFixture(t);
  fs.mkdirSync(path.join(f.target, '.agents/skills'), { recursive: true });
  const plan = planFor(f), root = path.join(f.target, '.agents/skills/user-package');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: python-backend\ndescription: Existing user skill.\n---\nKeep me.\n');
  assert.throws(() => applyInstallPlan(plan), /collision/i);
  assert.equal(fs.existsSync(path.join(f.target, MANIFEST)), false);
});

test('a package root introduced during directory creation is preserved and not adopted', t => {
  const f = createFixture(t), plan = planFor(f);
  const root = path.join(plan.target, '.agents/skills/python-backend');
  const originalMkdir = fs.mkdirSync; let inserted = false;
  fs.mkdirSync = function (filename, ...args) {
    const result = originalMkdir.call(this, filename, ...args);
    if (String(filename) === path.dirname(root) && !inserted) {
      inserted = true; originalMkdir(root); fs.writeFileSync(path.join(root, 'user-note.txt'), 'Keep this package unowned.');
    }
    return result;
  };
  try { assert.throws(() => applyInstallPlan(plan), /Directory changed/); }
  finally { fs.mkdirSync = originalMkdir; }
  assert.equal(fs.readFileSync(path.join(root, 'user-note.txt'), 'utf8'), 'Keep this package unowned.');
  assert.equal(fs.existsSync(path.join(f.target, MANIFEST)), false);
});
