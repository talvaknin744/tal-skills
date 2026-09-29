import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import TOML from '@iarna/toml';
import { parse } from 'yaml';
import { loadCatalog, generateBundle, adapterFiles } from '../../scripts/toolkit/index.mjs';
import { contained, assertDistinctPaths, safeRelative } from '../../scripts/toolkit/paths.mjs';
import { createFixture } from './fixtures.mjs';

const role = 'agents/languages/tal-python.md';
function replace(f, filename, from, to) { f.write(filename, fs.readFileSync(path.join(f.source, filename), 'utf8').replace(from, to)); }
function yamlFrontmatter(bytes) { return parse(bytes.toString().match(/^---\n([\s\S]*?)\n---/)[1]); }

test('both native formats inherit settings, resolve relevant dependencies, and keep resources exact', t => {
  const f = createFixture(t);
  const resource = Buffer.from([0, 255, 13, 10, 71]);
  f.write('skills/languages/python-backend/data.bin', resource);
  const catalog = loadCatalog(f.source), bundle = generateBundle(catalog, { host: 'both' });
  const codex = TOML.parse(bundle.files.get('.codex/agents/tal-python.toml').bytes.toString());
  assert.deepEqual(Object.keys(codex).sort(), ['description', 'developer_instructions', 'name']);
  assert.match(codex.developer_instructions, /\.tal-skills\/agents\/CONTRACT\.md/);
  assert.match(codex.developer_instructions, /\.agents\/skills\/python-backend\/SKILL\.md/);
  assert.deepEqual(yamlFrontmatter(bundle.files.get('.claude/agents/tal-python.md').bytes), {
    name: 'tal-python', description: 'Python implementation and review.', model: 'inherit', skills: ['python-backend'],
  });
  for (const root of ['.agents/skills', '.claude/skills']) {
    assert.deepEqual(bundle.files.get(`${root}/python-backend/data.bin`).bytes, resource);
    assert.ok(bundle.files.has(`${root}/python-backend/LICENSE`));
    assert.ok(bundle.files.has(`${root}/tal-backend-delivery/SKILL.md`));
  }
  const adapters = adapterFiles(catalog);
  assert.equal(adapters.size, 4);
  assert.equal([...adapters.keys()].filter(name => name.endsWith('/SKILL.md.template')).length, 2);
  assert.equal([...adapters.keys()].some(name => name.endsWith('/SKILL.md') || name.includes('/python-backend/')), false);
});

test('role-only selection includes the common contract and excludes workflows and unrelated packages', t => {
  const f = createFixture(t);
  f.write('skills/productivity/unused/SKILL.md', '---\nname: unused\ndescription: An unrelated skill.\n---\nDo unrelated work.\n');
  const catalog = loadCatalog(f.source);
  const bundle = generateBundle(catalog, { host: 'codex', agents: ['tal-python'] });
  assert.deepEqual(bundle.resolved, { agents: ['tal-python'], skills: ['python-backend'] });
  assert.ok(bundle.files.has('.tal-skills/agents/CONTRACT.md'));
  assert.equal([...bundle.files.keys()].some(name => name.includes('workflows/') || name.includes('/unused/')), false);
  assert.deepEqual(generateBundle(catalog, { host: 'codex', workflows: ['tal-backend-delivery'] }).resolved, bundle.resolved);
});

test('generation is pure after catalog loading, deterministic, and normalizes native CRLF', t => {
  const f = createFixture(t);
  const catalog = loadCatalog(f.source), first = adapterFiles(catalog);
  for (const name of ['agents/languages/tal-python.md', 'workflows/tal-backend-delivery/WORKFLOW.md']) {
    const text = fs.readFileSync(path.join(f.source, name), 'utf8'); f.write(name, text.replaceAll('\n', '\r\n'));
  }
  const second = adapterFiles(loadCatalog(f.source));
  assert.deepEqual(second, first);
  fs.rmSync(f.source, { recursive: true });
  assert.deepEqual(adapterFiles(catalog), first);
});

for (const [title, mutate, pattern] of [
  ['unknown metadata', f => replace(f, role, 'schema_version: 1', 'schema_version: 1\nmodel: anything'), /Unknown metadata/],
  ['duplicate YAML keys', f => replace(f, role, 'schema_version: 1', 'schema_version: 1\nschema_version: 1'), /Invalid YAML/],
  ['unsupported schema', f => replace(f, role, 'schema_version: 1', 'schema_version: 2'), /schema_version/],
  ['non-array dependencies', f => replace(f, role, 'skills:\n  - python-backend', 'skills: python-backend'), /Expected unique/],
  ['duplicate dependencies', f => replace(f, role, '  - python-backend', '  - python-backend\n  - python-backend'), /Expected unique/],
  ['missing dependency', f => replace(f, role, '  - python-backend', '  - absent'), /Missing skill/],
  ['name mismatch', f => replace(f, role, 'name: tal-python', 'name: tal-other'), /mismatched agent/],
  ['local role link', f => replace(f, role, 'Implement the assigned Python work.', 'Read [common](../CONTRACT.md).'), /Local role links/],
  ['standalone skill escape', f => replace(f, 'skills/languages/python-backend/SKILL.md', 'references/details.md', '../../../other.md'), /escapes or is missing/],
]) test(`catalog rejects ${title} before generation`, t => { const f = createFixture(t); mutate(f); assert.throws(() => loadCatalog(f.source), pattern); });

test('an unselected workflow resource cannot be borrowed from a sibling workflow', t => {
  const f = createFixture(t);
  f.write('workflows/tal-other/WORKFLOW.md', '---\nschema_version: 1\nname: tal-other\ndescription: Other workflow.\nagents: []\nskills: []\n---\nOther instructions.\n');
  replace(f, 'workflows/tal-backend-delivery/WORKFLOW.md', '../_shared/handoff.md', '../tal-other/WORKFLOW.md');
  const catalog = loadCatalog(f.source);
  assert.throws(() => generateBundle(catalog, { host: 'both', workflows: ['tal-backend-delivery'] }), /Missing or unselected/);
});

test('path safety works with Windows drives and UNC roots, including prefix aliases', () => {
  assert.equal(contained('C:\\project', 'skills/thing.md', path.win32), 'C:\\project\\skills\\thing.md');
  assert.equal(contained('\\\\server\\share\\project', 'skills/thing.md', path.win32), '\\\\server\\share\\project\\skills\\thing.md');
  for (const value of ['../project-other/thing', 'C:/thing', '//server/share', 'a\\b', 'COM1.txt', 'refs/..']) assert.throws(() => safeRelative(value));
  assert.throws(() => assertDistinctPaths(['refs/a.md', 'REFS/b.md']), /collision/);
  assert.throws(() => assertDistinctPaths(['réfs/a.md', 're\u0301fs/b.md']), /collision/);
});

test('generation CLI detects drift without repair, then restores checked artifacts', t => {
  const f = createFixture(t);
  const invoke = (...args) => spawnSync(process.execPath, ['scripts/generate-adapters.mjs', '--source', f.source, ...args], { encoding: 'utf8' });
  assert.equal(invoke().status, 0);
  assert.equal(invoke('--check').status, 0);
  const filename = path.join(f.source, 'adapters/codex/.codex/agents/tal-python.toml');
  fs.appendFileSync(filename, '# hand edit\n');
  assert.equal(invoke('--check').status, 1);
  assert.match(fs.readFileSync(filename, 'utf8'), /hand edit/);
  assert.equal(invoke().status, 0);
  assert.equal(invoke('--check').status, 0);
  const check = spawnSync(process.execPath, ['scripts/check-toolkit.mjs', '--source', f.source], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
});
