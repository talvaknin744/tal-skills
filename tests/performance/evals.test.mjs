import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Corpus integrity only: these checks do not execute or grade an agent.
const root = fileURLToPath(new URL('../../', import.meta.url));
const skills = (await readdir(path.join(root, 'skills/performance'), { withFileTypes: true }))
  .filter(entry => entry.isDirectory()).map(entry => entry.name);
const inside = (parent, child) => child.startsWith(parent + path.sep);

for (const name of skills) {
  const corpus = JSON.parse(await readFile(path.join(root, 'evals', name, 'cases.json'), 'utf8'));

  test(`${name}: corpus includes substantive and nontrigger requests`, () => {
    assert.equal(corpus.format_version, 1);
    assert.ok(corpus.cases.length >= 3);
    for (const key of ['id', 'prompt', 'fixture_dir']) {
      assert.equal(new Set(corpus.cases.map(item => item[key])).size, corpus.cases.length);
    }
    assert.deepEqual(new Set(corpus.cases.map(item => item.activation)),
      new Set(['activate', 'do_not_auto_activate']));
  });

  for (const item of corpus.cases) {
    test(`${name}/${item.id}: scope and observable scoring criteria are declared`, () => {
      assert.match(item.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(item.title.length > 10 && item.prompt.length > 50);
      assert.ok(item.tags.length >= 2);
      assert.equal(new Set(item.tags).size, item.tags.length);
      assert.ok(['review', 'planning', 'implementation', 'nontrigger'].includes(item.task_mode));
      assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
      for (const capability of ['web', 'subagents', 'commands']) {
        assert.equal(typeof item.capabilities[capability], 'boolean');
      }
      assert.ok(item.rubric.length >= 3);
      assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
      assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
      for (const rule of item.rubric) {
        assert.match(rule.id, /^[a-z][a-z0-9-]+$/);
        assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
        assert.ok(rule.criterion.length > 20);
      }
    });

    test(`${name}/${item.id}: fixture is complete and isolated from the rubric`, async () => {
      assert.ok(item.fixture_dir.startsWith(`evals/${name}/fixtures/`));
      const fixtureRoot = await realpath(path.join(root, 'evals', name, 'fixtures'));
      const project = await realpath(path.join(root, item.fixture_dir));
      assert.ok(inside(fixtureRoot, project));
      assert.ok(item.fixtures.length > 0);
      assert.equal(new Set(item.fixtures).size, item.fixtures.length);
      assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort());
      let bytes = 0;
      for (const filename of item.fixtures) {
        assert.ok(!/(?:cases\.json|rubric|results)/i.test(filename));
        const resolved = await realpath(path.join(project, filename));
        assert.ok(inside(project, resolved));
        assert.ok((await stat(resolved)).isFile());
        const content = await readFile(resolved, 'utf8');
        assert.ok(content.trim().length >= 40);
        bytes += Buffer.byteLength(content);
      }
      assert.ok(bytes >= 150);
    });
  }
}
