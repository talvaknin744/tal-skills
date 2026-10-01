import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFixture } from './fixtures.mjs';
import { MANIFEST, buildInstallPlan } from '../../scripts/toolkit/index.mjs';
import { readTree } from '../../scripts/toolkit/paths.mjs';
import { parseMenuSelection, runLauncher } from '../../scripts/tal-skills.mjs';

function fixture(t) {
  const f = createFixture(t);
  f.write('skills/engineering/architecture/SKILL.md', '---\nname: architecture\ndescription: Choose an architecture.\n---\nIdentify the constraints.\n');
  f.write('skills/engineering/architecture/LICENSE', 'MIT\n');
  return f;
}
async function run(f, argv, overrides = {}) {
  let stdout = '', stderr = '';
  const code = await runLauncher(argv, {
    sourceRoot: f.source, cwd: f.target, discoveryRoots: [], isTTY: false,
    output: { write: value => { stdout += value; } }, errorOutput: { write: value => { stderr += value; } },
    ...overrides
  });
  return { code, stdout, stderr };
}
const snapshot = root => [...readTree(root)].map(([name, file]) => [name, file.bytes.toString('base64'), file.mode]);

test('list reports independent skills, workflows and toolkit agents without writing', async t => {
  const f = fixture(t), result = await run(f, ['list', '--json']);
  assert.equal(result.code, 0);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.skills.map(item => item.name), ['architecture', 'python-backend']);
  assert.deepEqual(report.workflows[0].agents, ['tal-python']);
  assert.deepEqual(report.agents[0].skills, ['python-backend']);
  assert.deepEqual(snapshot(f.target), []);
});

test('a standalone skill defaults to the current project and Codex and retains its selection on reinstall', async t => {
  const f = fixture(t), result = await run(f, ['--skill', 'architecture', '--json']);
  assert.equal(result.code, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.target, fs.realpathSync(f.target));
  assert.deepEqual(report.hosts, ['codex']);
  assert.deepEqual(report.selection, { agents: [], workflows: [], skills: ['architecture'] });
  assert.deepEqual(report.resolved, { agents: [], skills: ['architecture'] });
  assert.equal(fs.existsSync(path.join(f.target, '.agents/skills/architecture/SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(f.target, '.codex')), false);
  const repeated = buildInstallPlan({ sourceRoot: f.source, target: f.target, host: 'codex', discoveryRoots: [] });
  assert.deepEqual(repeated.selection, report.selection);
  assert.ok(repeated.operations.every(item => item.action === 'unchanged'));
});

test('mixed selection closes dependencies for both hosts and replacing it removes obsolete owned files only', async t => {
  const f = fixture(t);
  for (const name of ['.codex/config.toml', '.claude/settings.json']) {
    fs.mkdirSync(path.dirname(path.join(f.target, name)), { recursive: true });
    fs.writeFileSync(path.join(f.target, name), 'Keep user settings.\n');
  }
  const installed = await run(f, ['install', '--host', 'both', '--workflow', 'tal-backend-delivery', '--skill', 'architecture', '--json']);
  assert.equal(installed.code, 0);
  const report = JSON.parse(installed.stdout);
  assert.deepEqual(report.resolved, { agents: ['tal-python'], skills: ['architecture', 'python-backend'] });
  for (const name of ['.codex/agents/tal-python.toml', '.claude/agents/tal-python.md', '.agents/skills/tal-backend-delivery/SKILL.md', '.claude/skills/python-backend/SKILL.md']) assert.equal(fs.existsSync(path.join(f.target, name)), true);
  const changed = await run(f, ['--host', 'both', '--skill', 'architecture', '--json']);
  assert.equal(changed.code, 0);
  for (const name of ['.codex/agents/tal-python.toml', '.tal-skills/workflows/tal-backend-delivery/WORKFLOW.md', '.claude/skills/python-backend/SKILL.md']) assert.equal(fs.existsSync(path.join(f.target, name)), false);
  for (const name of ['.codex/config.toml', '.claude/settings.json']) assert.equal(f.read(name), 'Keep user settings.\n');
});

test('dry-run is read only and local modifications block the complete install', async t => {
  const f = fixture(t);
  const dry = await run(f, ['--agent', 'tal-python', '--dry-run', '--json']);
  assert.equal(dry.code, 0);
  assert.equal(JSON.parse(dry.stdout).result, undefined);
  assert.deepEqual(snapshot(f.target), []);
  assert.equal((await run(f, ['--skill', 'architecture'])).code, 0);
  fs.appendFileSync(path.join(f.target, '.agents/skills/architecture/SKILL.md'), 'Local edit.\n');
  const before = snapshot(f.target);
  const blocked = await run(f, ['--skill', 'architecture', '--agent', 'tal-python', '--json']);
  assert.equal(blocked.code, 1);
  assert.ok(JSON.parse(blocked.stdout).conflicts.some(item => item.reason === 'Owned file has local modifications'));
  assert.deepEqual(snapshot(f.target), before);
});

test('standalone skill discovery collisions block writes', async t => {
  const f = fixture(t), discovery = path.join(f.directory, 'discovery');
  fs.mkdirSync(path.join(discovery, 'architecture'), { recursive: true });
  fs.writeFileSync(path.join(discovery, 'architecture/SKILL.md'), '---\nname: architecture\ndescription: Existing skill.\n---\nExisting.\n');
  const result = await run(f, ['--skill', 'architecture', '--json'], { discoveryRoots: [discovery] });
  assert.equal(result.code, 1);
  assert.ok(JSON.parse(result.stdout).conflicts.some(item => item.reason === 'Skill name collision: architecture'));
  assert.deepEqual(snapshot(f.target), []);
});

test('nonterminal and JSON callers must provide a selection; invalid choices do not write', async t => {
  const f = fixture(t);
  for (const argv of [[], ['--json'], ['--skill', 'missing', '--json'], ['--all', '--skill', 'architecture', '--json'], ['--host', 'unknown', '--all', '--json']]) {
    const result = await run(f, argv);
    assert.equal(result.code, 1, JSON.stringify(argv));
    assert.deepEqual(snapshot(f.target), []);
    if (argv.includes('--json')) assert.equal(typeof JSON.parse(result.stdout).error, 'string');
  }
});

test('terminal selection chooses a workflow and host, reviews the plan, and applies only after confirmation', async t => {
  const f = fixture(t), answers = ['3', '1', '1', 'y'], questions = [];
  const result = await run(f, [], { isTTY: true, ask: async question => { questions.push(question); return answers.shift(); } });
  assert.equal(result.code, 0);
  assert.equal(answers.length, 0);
  assert.equal(questions.at(-1), 'Apply this selection? [y/N]: ');
  const manifest = JSON.parse(f.read(MANIFEST));
  assert.deepEqual(manifest.hosts, ['claude', 'codex']);
  assert.deepEqual(manifest.selection.workflows, ['tal-backend-delivery']);
  assert.deepEqual(manifest.selection.skills, []);
  assert.equal(fs.existsSync(path.join(f.target, '.agents/skills/architecture')), false);
});

test('terminal cancellation and prompt EOF leave the project untouched', async t => {
  const f = fixture(t), answers = ['1', '2', '1', ''];
  const cancelled = await run(f, [], { isTTY: true, ask: async () => answers.shift() });
  assert.equal(cancelled.code, 0);
  assert.match(cancelled.stdout, /Cancelled/);
  assert.deepEqual(snapshot(f.target), []);
  let calls = 0;
  const eof = await run(f, [], { isTTY: true, ask: async () => {
    if (++calls === 1) return '1';
    throw new Error('Selection cancelled; nothing changed.');
  } });
  assert.equal(eof.code, 1);
  assert.equal(calls, 2);
  assert.deepEqual(snapshot(f.target), []);
});

test('--all includes independent packages and selecting by numbers validates bounds', async t => {
  const f = fixture(t), result = await run(f, ['--all', '--host', 'claude', '--dry-run', '--json']);
  assert.equal(result.code, 0);
  assert.deepEqual(JSON.parse(result.stdout).selection.skills, ['architecture', 'python-backend']);
  assert.deepEqual(parseMenuSelection('1, 3-4 3', 4), [0, 2, 3]);
  assert.deepEqual(parseMenuSelection('all', 3), [0, 1, 2]);
  for (const input of ['0', '4', '2-1', '-1', 'one']) assert.throws(() => parseMenuSelection(input, 3));
});

test('the launcher executes through an npm-style executable symlink', t => {
  const f = fixture(t), launcher = fileURLToPath(new URL('../../scripts/tal-skills.mjs', import.meta.url));
  const executable = path.join(f.directory, 'tal-skills');
  fs.symlinkSync(launcher, executable);
  const result = spawnSync(process.execPath, [executable, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /tal-skills list/);
});

test('npm distribution contains the executable import closure with production dependencies', t => {
  const f = fixture(t), root = fileURLToPath(new URL('../../', import.meta.url));
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', path.join(f.directory, 'npm-cache')], { cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  const packed = new Map(JSON.parse(result.stdout)[0].files.map(file => [file.path, file]));
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const pending = [metadata.bin['tal-skills']], visited = new Set();
  while (pending.length) {
    const filename = pending.pop();
    if (visited.has(filename)) continue;
    visited.add(filename);
    assert.ok(packed.has(filename), `Missing runtime module in npm package: ${filename}`);
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^;]*?\sfrom\s*)?['"]([^'"]+)['"]/g)) {
      const imported = match[1];
      if (imported.startsWith('node:')) continue;
      if (imported.startsWith('.')) pending.push(path.posix.normalize(path.posix.join(path.posix.dirname(filename), imported)));
      else {
        const packageName = imported.split('/').slice(0, imported.startsWith('@') ? 2 : 1).join('/');
        assert.ok(metadata.dependencies?.[packageName], `Runtime import must be a production dependency: ${packageName}`);
      }
    }
  }
  assert.notEqual(packed.get(metadata.bin['tal-skills']).mode & 0o111, 0, 'bin must be executable');
  assert.ok(visited.has('scripts/lib/markdown-links.mjs'));
});
