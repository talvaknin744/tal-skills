import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Input integrity only: these checks do not establish candidate skill behavior.
const root = fileURLToPath(new URL('../../', import.meta.url));
const corpus = JSON.parse(await readFile(path.join(root, 'evals/distributed-correctness/cases.json'), 'utf8'));
const inside = (parent, child) => child.startsWith(parent + path.sep);
const skills = new Set(['graceful-draining', 'concurrency-correctness']);

test('distributed correctness cases have unique projects, two candidates, and distinct modes', () => {
  assert.equal(corpus.format_version, 1);
  assert.equal(corpus.cases.length, 11);
  for (const key of ['id', 'prompt', 'fixture_dir']) {
    assert.equal(new Set(corpus.cases.map(item => item[key])).size, corpus.cases.length);
  }
  assert.deepEqual(new Set(corpus.cases.map(item => item.skill)), skills);
  assert.deepEqual(new Set(corpus.cases.map(item => item.task_mode)), new Set(['review', 'implementation', 'nontrigger']));
});

for (const item of corpus.cases) {
  test(`${item.id}: execution contract and observable rubric are declared`, () => {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(skills.has(item.skill));
    assert.ok(typeof item.title === 'string' && item.title.trim().length > 10);
    assert.ok(typeof item.prompt === 'string' && item.prompt.trim().length > 50);
    assert.ok(Array.isArray(item.tags) && item.tags.length >= 2);
    assert.equal(new Set(item.tags).size, item.tags.length);
    assert.ok(item.tags.every(tag => typeof tag === 'string' && tag.length > 0));
    assert.ok(['activate', 'do_not_auto_activate'].includes(item.activation));
    assert.ok(['review', 'implementation', 'nontrigger'].includes(item.task_mode));
    assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
    assert.deepEqual(item.capabilities, { web: false, subagents: false, commands: true });
    assert.ok(Array.isArray(item.rubric) && item.rubric.length >= 3);
    assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
    assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
    for (const rule of item.rubric) {
      assert.match(rule.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
      assert.ok(typeof rule.criterion === 'string' && rule.criterion.trim().length > 20);
    }
  });

  test(`${item.id}: raw project is complete and isolated from scoring material`, async () => {
    assert.match(item.fixture_dir, /^evals\/distributed-correctness\/fixtures\/[a-z0-9-]+$/);
    const fixturesRoot = await realpath(path.join(root, 'evals/distributed-correctness/fixtures'));
    const project = await realpath(path.join(root, item.fixture_dir));
    assert.ok(inside(fixturesRoot, project));
    assert.ok(Array.isArray(item.fixtures) && item.fixtures.length > 0);
    assert.equal(new Set(item.fixtures).size, item.fixtures.length);
    let bytes = 0;
    for (const fixture of item.fixtures) {
      assert.equal(typeof fixture, 'string');
      assert.ok(!path.isAbsolute(fixture));
      const resolved = await realpath(path.join(project, fixture));
      assert.ok(inside(project, resolved));
      assert.ok((await stat(resolved)).isFile());
      const content = await readFile(resolved, 'utf8');
      assert.ok(content.trim().length >= 40);
      bytes += Buffer.byteLength(content);
    }
    assert.ok(bytes >= 150);
    assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort());
    assert.ok(!item.fixtures.some(name => /(?:cases\.json|rubric|results)/i.test(name)));
  });
}
