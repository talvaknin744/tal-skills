import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO, SKILLS, inventory, safeRelative } from '../../scripts/evals/lib.mjs';

const index = JSON.parse(await readFile(path.join(REPO, 'evals/engineering-toolkit/scenario-index.json'), 'utf8'));
test('toolkit index names three cases and two required first observations per skill', () => {
  assert.deepEqual(new Set(index.skills), new Set(Object.keys(SKILLS)));
  assert.equal(index.new_cases.length, Object.keys(SKILLS).length * 3);
  assert.equal(index.new_cases.filter(item => item.required_first_pass).length, Object.keys(SKILLS).length * 2);
  assert.equal(new Set(index.new_cases.map(item => `${item.skill}/${item.case_id}`)).size, Object.keys(SKILLS).length * 3);
});
for (const skill of Object.keys(SKILLS)) {
  const corpus = JSON.parse(await readFile(path.join(REPO, 'evals', skill, 'cases.json'), 'utf8'));
  test(`${skill}: exactly two positives and one nontrigger`, () => {
    assert.equal(corpus.format_version, 1);
    assert.equal(corpus.cases.length, 3);
    assert.equal(corpus.cases.filter(item => item.activation === 'activate').length, 2);
    assert.equal(corpus.cases.filter(item => item.activation === 'do_not_auto_activate').length, 1);
    for (const key of ['id', 'prompt', 'fixture_dir']) assert.equal(new Set(corpus.cases.map(item => item[key])).size, 3);
  });
  for (const item of corpus.cases) {
    test(`${skill}/${item.id}: raw inputs and scoring contract are separate`, async () => {
      assert.match(item.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(item.prompt.length > 50);
      assert.ok(item.tags.length >= 2);
      assert.ok(['review', 'implementation', 'nontrigger'].includes(item.task_mode));
      assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
      assert.deepEqual(item.capabilities, { web: false, subagents: false, commands: true });
      assert.equal(item.prompt.includes(`$${skill}`), false, 'selection should be natural');
      assert.equal(item.prompt.includes(skill), false, 'candidate name is not a natural nontrigger/positive hint');
      assert.ok(item.rubric.length >= 3);
      assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
      assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
      for (const rule of item.rubric) {
        assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
        assert.ok(rule.criterion.length > 30);
      }
      assert.ok(item.fixture_dir.startsWith(`evals/${skill}/fixtures/`));
      safeRelative(item.fixture_dir);
      const files = await inventory(path.join(REPO, item.fixture_dir));
      assert.deepEqual(files.map(entry => entry.path).sort(), [...item.fixtures].sort());
      assert.ok(!item.fixtures.some(name => /cases\.json|rubric|score|answer/i.test(name)));
      let bytes = 0;
      for (const file of files) bytes += (await readFile(path.join(REPO, item.fixture_dir, file.path))).length;
      assert.ok(bytes >= 80);
      assert.deepEqual((await readdir(path.join(REPO, item.fixture_dir))).sort(), [...item.fixtures].sort());
      if (item.task_mode === 'implementation' || item.execution_mode === 'implementation') {
        assert.ok(item.editable_files.length > 0);
        for (const filename of item.editable_files) {
          safeRelative(filename);
          assert.ok(item.fixtures.includes(filename));
          assert.equal(/verify|models|go\.mod/.test(filename), false);
        }
        if (item.task_mode === 'implementation') {
          assert.ok(Array.isArray(item.verification_argv) && item.verification_argv.length >= 2);
          assert.ok(item.rubric.some(rule => rule.id === 'executed-verification'));
        }
      } else assert.equal(item.editable_files, undefined);
      assert.ok(index.new_cases.some(entry => entry.skill === skill && entry.case_id === item.id));
    });
  }
}
for (const reference of index.cross_cutting_cases) {
  test(`cross-cutting case resolves: ${reference.case_id}`, async () => {
    const corpus = JSON.parse(await readFile(path.join(REPO, reference.corpus), 'utf8'));
    assert.ok(corpus.cases.some(item => item.id === reference.case_id));
  });
}
