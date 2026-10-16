import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Corpus integrity only, not execution or grading of the candidate agent.
const root = fileURLToPath(new URL('../../', import.meta.url));
const corpus = JSON.parse(await readFile(path.join(root, 'evals/agent-evaluation/cases.json'), 'utf8'));

test('agent evaluation corpus has two natural positives and one nontrigger', () => {
  assert.equal(corpus.format_version, 1);
  assert.equal(corpus.cases.length, 3);
  assert.equal(corpus.cases.filter(item => item.activation === 'activate').length, 2);
  assert.equal(corpus.cases.filter(item => item.activation === 'do_not_auto_activate').length, 1);
  for (const key of ['id', 'prompt', 'fixture_dir']) {
    assert.equal(new Set(corpus.cases.map(item => item[key])).size, 3);
  }
});

for (const item of corpus.cases) {
  test(`${item.id}: capabilities, scope and independent criteria are explicit`, () => {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(item.prompt.length > 100);
    assert.equal(item.prompt.includes('agent-evaluation'), false);
    assert.ok(item.tags.length >= 2);
    assert.ok(['review', 'nontrigger'].includes(item.task_mode));
    assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
    assert.deepEqual(item.capabilities, { web: false, subagents: false, commands: true });
    assert.equal(item.editable_files, undefined);
    assert.ok(item.rubric.length >= 3);
    assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
    assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
    for (const rule of item.rubric) {
      assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
      assert.ok(rule.criterion.length > 30);
    }
  });

  test(`${item.id}: complete raw fixtures remain separate from private scoring`, async () => {
    assert.match(item.fixture_dir, /^evals\/agent-evaluation\/fixtures\/[a-z0-9-]+$/);
    const project = await realpath(path.join(root, item.fixture_dir));
    const fixtureRoot = await realpath(path.join(root, 'evals/agent-evaluation/fixtures'));
    assert.ok(project.startsWith(fixtureRoot + path.sep));
    assert.ok(item.fixtures.length > 0);
    assert.equal(new Set(item.fixtures).size, item.fixtures.length);
    assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort());
    let bytes = 0;
    for (const fixture of item.fixtures) {
      assert.equal(path.isAbsolute(fixture), false);
      assert.equal(/cases\.json|rubric|scores|expected-answer/i.test(fixture), false);
      const resolved = await realpath(path.join(project, fixture));
      assert.ok(resolved.startsWith(project + path.sep));
      assert.ok((await stat(resolved)).isFile());
      const content = await readFile(resolved, 'utf8');
      assert.ok(content.trim().length >= 40);
      bytes += Buffer.byteLength(content);
    }
    assert.ok(bytes >= 100);
  });
}

test('comparison fixture retains failures, unknown evidence and a contaminated attempt', async () => {
  const project = path.join(root, 'evals/agent-evaluation/fixtures/biased-repeated-trial-report');
  const { attempts } = JSON.parse(await readFile(path.join(project, 'trials.json'), 'utf8'));
  assert.equal(attempts.length, 13);
  assert.equal(new Set(attempts.map(item => item.id)).size, attempts.length);
  assert.ok(attempts.some(item => item.outcome_pass === null));
  assert.ok(attempts.some(item => item.outcome_pass === false));
  assert.ok(attempts.some(item => item.fresh === false));
  for (const source of ['baseline-v4', 'revised-v5']) {
    const comparable = attempts.filter(item => item.source === source && item.fresh);
    assert.equal(comparable.length, 6);
    assert.deepEqual(new Set(comparable.map(item => item.task)), new Set(['eligible-refund', 'ineligible-refund']));
  }
});
