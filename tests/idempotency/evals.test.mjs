import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// These checks validate authored evaluation inputs, not the skill's behavior.
const root = fileURLToPath(new URL('../../', import.meta.url));
const corpus = JSON.parse(await readFile(path.join(root, 'evals/idempotency/cases.json'), 'utf8'));
const inside = (parent, child) => child.startsWith(parent + path.sep);

test('idempotency evaluation corpus has unique cases and distinct task modes', () => {
  assert.equal(corpus.format_version, 1);
  assert.ok(Array.isArray(corpus.cases) && corpus.cases.length >= 6);
  for (const key of ['id', 'prompt', 'fixture_dir']) {
    assert.equal(new Set(corpus.cases.map(item => item[key])).size, corpus.cases.length, `${key} must be unique`);
  }
  assert.deepEqual(new Set(corpus.cases.map(item => item.activation)), new Set(['activate', 'do_not_auto_activate']));
  assert.deepEqual(new Set(corpus.cases.map(item => item.task_mode)), new Set(['review', 'implementation', 'nontrigger']));
});

for (const item of corpus.cases) {
  test(`${item.id}: evaluation prompt, capabilities, and observable rubric are declared`, () => {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(typeof item.title === 'string' && item.title.trim().length > 10);
    assert.ok(typeof item.prompt === 'string' && item.prompt.trim().length > 50);
    assert.ok(Array.isArray(item.tags) && item.tags.length >= 2);
    assert.equal(new Set(item.tags).size, item.tags.length);
    assert.ok(item.tags.every(tag => typeof tag === 'string' && tag.length > 0));
    assert.ok(['activate', 'do_not_auto_activate'].includes(item.activation));
    assert.ok(['review', 'implementation', 'nontrigger'].includes(item.task_mode));
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
      assert.ok(typeof rule.criterion === 'string' && rule.criterion.trim().length > 20);
    }
  });

  test(`${item.id}: evaluation fixtures stay inside their isolated project`, async () => {
    assert.match(item.fixture_dir, /^evals\/idempotency\/fixtures\/[a-z0-9-]+$/);
    const fixturesRoot = await realpath(path.join(root, 'evals/idempotency/fixtures'));
    const project = await realpath(path.join(root, item.fixture_dir));
    assert.ok(inside(fixturesRoot, project));
    assert.ok(Array.isArray(item.fixtures) && item.fixtures.length > 0);
    assert.equal(new Set(item.fixtures).size, item.fixtures.length);
    let bytes = 0;
    for (const fixture of item.fixtures) {
      assert.equal(typeof fixture, 'string');
      assert.ok(!path.isAbsolute(fixture), 'fixture paths must be relative');
      const resolved = await realpath(path.join(project, fixture));
      assert.ok(inside(project, resolved), 'fixture cannot escape its project');
      assert.ok((await stat(resolved)).isFile());
      const content = await readFile(resolved, 'utf8');
      assert.ok(content.trim().length >= 40, 'fixtures need substantive task evidence');
      bytes += Buffer.byteLength(content);
    }
    assert.ok(bytes >= 150, 'project must contain meaningful task context');
    assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort(), 'all supplied project files must be declared');
    assert.ok(!item.fixtures.some(name => /(?:cases\.json|rubric|results)/i.test(name)), 'scoring material stays outside fixture projects');
  });
}
