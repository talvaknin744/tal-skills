import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// These checks validate book-inspired skill evaluation inputs, not agent behavior.
const root = fileURLToPath(new URL('../../', import.meta.url));
const skillNames = [
  'microservice-boundaries',
  'microservice-extraction',
  'microservice-integration',
  'microservice-data',
  'microservice-testing',
  'microservice-operations',
  'legacy-code-changes',
  'pragmatic-programming',
  'enterprise-application-patterns',
  'distributed-system-patterns',
  'object-design-patterns',
];
const inside = (parent, child) => child.startsWith(parent + path.sep);

for (const name of skillNames) {
  const corpus = JSON.parse(await readFile(path.join(root, 'evals', name, 'cases.json'), 'utf8'));

  test(`${name}: corpus declares positive and nontrigger cases`, () => {
    assert.equal(corpus.format_version, 1);
    assert.ok(Array.isArray(corpus.cases) && corpus.cases.length >= 3);
    for (const key of ['id', 'prompt', 'fixture_dir']) {
      assert.equal(new Set(corpus.cases.map(item => item[key])).size, corpus.cases.length, key);
    }
    assert.deepEqual(
      new Set(corpus.cases.map(item => item.activation)),
      new Set(['activate', 'do_not_auto_activate']),
    );
  });

  for (const item of corpus.cases) {
    test(`${name}/${item.id}: capabilities and observable rubric are declared`, () => {
      assert.match(item.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(typeof item.title === 'string' && item.title.length > 10);
      assert.ok(typeof item.prompt === 'string' && item.prompt.length > 50);
      assert.ok(Array.isArray(item.tags) && item.tags.length >= 2);
      assert.equal(new Set(item.tags).size, item.tags.length);
      assert.ok(item.tags.every(tag => typeof tag === 'string' && tag.length > 0));
      assert.ok(['activate', 'do_not_auto_activate'].includes(item.activation));
      assert.ok(['review', 'planning', 'implementation', 'nontrigger'].includes(item.task_mode));
      assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
      for (const capability of ['web', 'subagents', 'commands']) {
        assert.equal(typeof item.capabilities[capability], 'boolean');
      }
      assert.ok(Array.isArray(item.rubric) && item.rubric.length >= 3);
      assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
      assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
      for (const rule of item.rubric) {
        assert.match(rule.id, /^[a-z][a-z0-9-]+$/);
        assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
        assert.ok(typeof rule.criterion === 'string' && rule.criterion.length > 20);
      }
    });

    test(`${name}/${item.id}: fixture inputs remain isolated from scoring material`, async () => {
      assert.match(item.fixture_dir, new RegExp(`^evals/${name}/fixtures/[a-z0-9-]+$`));
      const fixturesRoot = await realpath(path.join(root, 'evals', name, 'fixtures'));
      const project = await realpath(path.join(root, item.fixture_dir));
      assert.ok(inside(fixturesRoot, project));
      assert.ok(Array.isArray(item.fixtures) && item.fixtures.length > 0);
      assert.equal(new Set(item.fixtures).size, item.fixtures.length);
      let bytes = 0;
      for (const filename of item.fixtures) {
        const resolved = await realpath(path.join(project, filename));
        assert.ok(inside(project, resolved), 'fixture must not escape its project');
        assert.ok((await stat(resolved)).isFile());
        const content = await readFile(resolved, 'utf8');
        assert.ok(content.trim().length >= 40, 'fixture must contain substantive evidence');
        bytes += Buffer.byteLength(content);
      }
      assert.ok(bytes >= 150, 'project must contain meaningful task context');
      assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort());
      assert.ok(!item.fixtures.some(filename => /(?:cases\.json|rubric|results)/i.test(filename)));
    });
  }
}
