import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  loadCatalog,
  buildInstallPlan,
  applyInstallPlan,
  recoverInstallation,
  MANIFEST,
  JOURNAL,
  LOCK,
} from '../../scripts/toolkit/index.mjs';
import { createFixture } from './fixtures.mjs';

const selected = { host: 'codex', agents: ['tal-python'], workflows: [], discoveryRoots: [] };

function plan(fixture, options = {}) {
  return buildInstallPlan({ sourceRoot: fixture.source, target: fixture.target, ...selected, ...options });
}

function install(fixture, options = {}) {
  const candidate = plan(fixture, options);
  assert.deepEqual(candidate.conflicts, []);
  applyInstallPlan(candidate);
  return candidate;
}

function snapshot(root) {
  const entries = {};
  function visit(directory, prefix = '') {
    for (const name of fs.readdirSync(directory).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const absolute = path.join(directory, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) entries[relative] = ['symlink', fs.readlinkSync(absolute)];
      else if (stat.isDirectory()) {
        entries[relative] = ['directory'];
        visit(absolute, relative);
      } else {
        entries[relative] = ['file', createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')];
      }
    }
  }
  visit(root);
  return entries;
}

function writeTarget(fixture, relative, contents) {
  const filename = path.join(fixture.target, relative);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, contents);
}

function manifest(fixture) {
  return JSON.parse(fs.readFileSync(path.join(fixture.target, MANIFEST), 'utf8'));
}

function assertDenied(operation) {
  let result;
  try {
    result = operation();
  } catch (error) {
    assert.ok(error instanceof Error);
    return;
  }
  assert.ok(result?.conflicts?.length > 0, 'the unsafe request must fail or report a conflict');
}

test('identical bytes in an unowned package are not implicitly adopted', (t) => {
  const fixture = createFixture(t);
  const initial = install(fixture);
  const installed = manifest(fixture);
  // Remove only ownership state: all candidate bytes still happen to match.
  fs.rmSync(path.join(fixture.target, '.tal-skills'), { recursive: true });
  assert.ok(installed.files.some((entry) => entry.path.includes('/python-backend/')));
  const before = snapshot(fixture.target);
  const candidate = plan(fixture);
  assert.ok(candidate.conflicts.length > 0);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(fixture.target), before);
  assert.ok(initial.operations.some((entry) => entry.action === 'create'));
});

test('a public skill name at a different package path is a collision', (t) => {
  const fixture = createFixture(t);
  writeTarget(fixture, '.agents/skills/other-name/SKILL.md',
    '---\nname: python-backend\ndescription: An existing user package.\n---\nKeep this package.\n');
  const before = snapshot(fixture.target);
  const candidate = plan(fixture);
  assert.ok(candidate.conflicts.length > 0);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(fixture.target), before);
});

test('an explicitly scanned external discovery collision stays untouched', (t) => {
  const fixture = createFixture(t);
  const external = path.join(fixture.source, 'external-discovery');
  fs.mkdirSync(path.join(external, 'elsewhere'), { recursive: true });
  fs.writeFileSync(path.join(external, 'elsewhere', 'SKILL.md'),
    '---\nname: python-backend\ndescription: An external package.\n---\nKeep me.\n');
  const before = snapshot(external);
  const candidate = plan(fixture, { discoveryRoots: [external] });
  assert.ok(candidate.conflicts.length > 0);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(external), before);
  assert.deepEqual(snapshot(fixture.target), {});
});

test('symlinked host roots cannot redirect the installation outside the target', (t) => {
  const fixture = createFixture(t);
  const outside = path.join(fixture.source, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'unrelated bytes');
  fs.symlinkSync(outside, path.join(fixture.target, '.agents'), 'dir');
  const before = snapshot(outside);
  assertDenied(() => plan(fixture));
  assert.deepEqual(snapshot(outside), before);
});

test('apply rechecks a destination component that became a symlink after planning', (t) => {
  const fixture = createFixture(t);
  const candidate = plan(fixture);
  assert.deepEqual(candidate.conflicts, []);
  const outside = path.join(fixture.source, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'unrelated bytes');
  fs.symlinkSync(outside, path.join(fixture.target, '.agents'), 'dir');
  const before = snapshot(outside);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(outside), before);
});

test('source package resources cannot be symlinks to unrelated files', (t) => {
  const fixture = createFixture(t);
  loadCatalog(fixture.source);
  const outside = path.join(fixture.source, 'private-input.txt');
  fs.writeFileSync(outside, 'do not copy this');
  const skill = findSkillDirectory(fixture.source);
  fs.symlinkSync(outside, path.join(skill, 'linked-input.txt'));
  assertDenied(() => plan(fixture));
  assert.deepEqual(snapshot(fixture.target), {});
});

function findSkillDirectory(source) {
  function search(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const found = search(filename);
        if (found) return found;
      } else if (entry.name === 'SKILL.md') return directory;
    }
    return undefined;
  }
  const found = search(path.join(source, 'skills'));
  assert.ok(found, 'fixture must provide a canonical skill');
  return found;
}

const hostilePaths = [
  '../outside.txt',
  '/absolute.txt',
  'C:/outside.txt',
  '\\\\server\\share\\outside.txt',
  '.agents/skills/python-backend/../outside.txt',
  '.agents/skills/python-backend//x',
  '.agents/skills/python-backend/./x',
  '.agents/skills/python-backend/AUX',
  '.agents/skills/python-backend/a.',
  '.agents/skills/python-backend/a ',
  '.agents/skills/python-backend/\u0000x',
  '.codex/config.toml',
  '.claude/settings.json',
  '.git/config',
];

for (const hostilePath of hostilePaths) {
  test(`forged manifest cannot authorize destination ${JSON.stringify(hostilePath)}`, (t) => {
    const fixture = createFixture(t);
    install(fixture);
    const state = manifest(fixture);
    state.files[0].path = hostilePath;
    writeTarget(fixture, MANIFEST, JSON.stringify(state));
    const before = snapshot(fixture.target);
    assertDenied(() => plan(fixture));
    assert.deepEqual(snapshot(fixture.target), before);
  });
}

test('case-equivalent owned destinations are rejected before an upgrade', (t) => {
  const fixture = createFixture(t);
  install(fixture);
  const state = manifest(fixture);
  const entry = state.files.find((file) => file.path.includes('/python-backend/'));
  assert.ok(entry);
  state.files.push({ ...entry, path: entry.path.replace('python-backend', 'PYTHON-BACKEND') });
  writeTarget(fixture, MANIFEST, JSON.stringify(state));
  const before = snapshot(fixture.target);
  assertDenied(() => plan(fixture));
  assert.deepEqual(snapshot(fixture.target), before);
});

for (const field of ['package_roots', 'created_directories']) {
  test(`forged manifest cannot claim protected ${field}`, (t) => {
    const fixture = createFixture(t);
    install(fixture);
    const state = manifest(fixture);
    state[field].push('.git');
    writeTarget(fixture, MANIFEST, JSON.stringify(state));
    const before = snapshot(fixture.target);
    assertDenied(() => plan(fixture));
    assert.deepEqual(snapshot(fixture.target), before);
  });
}

test('one edited owned file blocks updates to every other managed file', (t) => {
  const fixture = createFixture(t);
  install(fixture);
  const state = manifest(fixture);
  const edited = state.files.find((file) => file.path.endsWith('.toml'));
  assert.ok(edited);
  fs.appendFileSync(path.join(fixture.target, edited.path), '\n# user edit\n');
  fs.appendFileSync(path.join(findSkillDirectory(fixture.source), 'SKILL.md'), '\nNew canonical guidance.\n');
  const before = snapshot(fixture.target);
  const candidate = plan(fixture);
  assert.ok(candidate.conflicts.length > 0);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(fixture.target), before);
});

test('an owned file edited after planning aborts apply before any managed update', (t) => {
  const fixture = createFixture(t);
  install(fixture);
  fs.appendFileSync(path.join(findSkillDirectory(fixture.source), 'SKILL.md'), '\nNew canonical guidance.\n');
  const candidate = plan(fixture);
  assert.deepEqual(candidate.conflicts, []);
  const state = manifest(fixture);
  const edited = state.files.find((file) => file.path.endsWith('.toml'));
  assert.ok(edited);
  fs.appendFileSync(path.join(fixture.target, edited.path), '\n# concurrent customization\n');
  const before = snapshot(fixture.target);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(fixture.target), before);
});

test('host removal preserves an edited owned file and does not partially remove its peers', (t) => {
  const fixture = createFixture(t);
  install(fixture, { host: 'both' });
  const state = manifest(fixture);
  const edited = state.files.find((file) => file.path.startsWith('.claude/agents/'));
  assert.ok(edited);
  fs.appendFileSync(path.join(fixture.target, edited.path), '\nUser customization.\n');
  const before = snapshot(fixture.target);
  const candidate = plan(fixture, { host: 'codex' });
  assert.ok(candidate.conflicts.length > 0);
  assert.throws(() => applyInstallPlan(candidate));
  assert.deepEqual(snapshot(fixture.target), before);
});

test('removing and later restoring a host does not collide with leftover installer directories', (t) => {
  const fixture = createFixture(t);
  install(fixture, { host: 'both' });
  install(fixture, { host: 'codex' });
  const candidate = plan(fixture, { host: 'both' });
  assert.deepEqual(candidate.conflicts, []);
  applyInstallPlan(candidate);
  assert.deepEqual(manifest(fixture).hosts, ['claude', 'codex']);
  assert.ok(fs.existsSync(path.join(fixture.target, '.claude/skills/python-backend/SKILL.md')));
});

test('removing a host preserves unowned files inside its old package', (t) => {
  const fixture = createFixture(t);
  install(fixture, { host: 'both' });
  writeTarget(fixture, '.claude/skills/python-backend/user-notes.txt', 'keep local notes');
  install(fixture, { host: 'codex' });
  assert.equal(fixture.read('.claude/skills/python-backend/user-notes.txt'), 'keep local notes');
  assert.equal(fs.existsSync(path.join(fixture.target, '.claude/skills/python-backend/SKILL.md')), false);
});

for (const failAt of ['staged', 'after-write:1', 'before-manifest']) {
  test(`interruption at ${failAt} is recoverable without treating it as success`, (t) => {
    const fixture = createFixture(t);
    writeTarget(fixture, 'user-file.txt', 'keep unrelated project data');
    const before = snapshot(fixture.target);
    const candidate = plan(fixture);
    assert.throws(() => applyInstallPlan(candidate, { failAt }));
    assert.ok(fs.existsSync(path.join(fixture.target, JOURNAL)));
    assert.ok(fs.existsSync(path.join(fixture.target, LOCK)));
    assertDenied(() => plan(fixture));
    recoverInstallation(fixture.target);
    assert.deepEqual(snapshot(fixture.target), before);
    install(fixture);
  });
}

test('recovery keeps a third-party edit and leaves unresolved recovery state', (t) => {
  const fixture = createFixture(t);
  const candidate = plan(fixture);
  assert.throws(() => applyInstallPlan(candidate, { failAt: 'before-manifest' }));
  const managed = candidate.operations.find((entry) => entry.action === 'create');
  assert.ok(managed);
  writeTarget(fixture, managed.path, 'third-party change after interruption');
  assertDenied(() => recoverInstallation(fixture.target));
  assert.equal(fs.readFileSync(path.join(fixture.target, managed.path), 'utf8'),
    'third-party change after interruption');
  assert.ok(fs.existsSync(path.join(fixture.target, JOURNAL)));
  assert.ok(fs.existsSync(path.join(fixture.target, LOCK)));
  assertDenied(() => plan(fixture));
});

test('malformed recovery journal is not permission to delete project files', (t) => {
  const fixture = createFixture(t);
  writeTarget(fixture, 'user-file.txt', 'must survive');
  writeTarget(fixture, JOURNAL, '{"schema_version":999,"files":[{"path":"../outside"}]}');
  writeTarget(fixture, LOCK, 'unrecognized transaction');
  const before = snapshot(fixture.target);
  assertDenied(() => recoverInstallation(fixture.target));
  assert.deepEqual(snapshot(fixture.target), before);
});
