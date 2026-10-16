import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { REFRESH_SUITES } from '../../scripts/evals/company-blog-refresh.mjs';
import { inventory, safeRelative, sha256 } from '../../scripts/evals/lib.mjs';

// Corpus and path integrity only. These checks do not execute or grade an agent.
const root = await realpath(fileURLToPath(new URL('../../', import.meta.url)));
const metadata = 'evals/company-blog-refresh/netflix-mechanisms-corpus-manifest-v1.json';
const manifest = JSON.parse(await readFile(path.join(root, metadata), 'utf8'));
const corpora = new Map();
for (const entry of manifest.corpora) {
  corpora.set(entry.path, JSON.parse(await readFile(path.join(root, entry.path), 'utf8')));
}
const inside = (parent, child) => child.startsWith(parent + path.sep);

for (const entry of manifest.corpora) {
  const corpus = corpora.get(entry.path);
  test(`${entry.path}: exact corpus bytes, unique projects and the exercised suite definition`, async () => {
    assert.equal(sha256(await readFile(path.join(root, entry.path))), entry.sha256);
    assert.equal(corpus.format_version, 1);
    assert.deepEqual(corpus.cases.map(item => item.id), entry.case_ids);
    assert.deepEqual(REFRESH_SUITES[entry.suite], {
      [entry.skill]: [entry.package_path, entry.path],
    });
    for (const key of ['id', 'prompt', 'fixture_dir']) {
      assert.equal(new Set(corpus.cases.map(item => item[key])).size, corpus.cases.length);
    }
    assert.equal(corpus.cases.filter(item => item.activation === 'activate').length, entry.positive_cases);
    assert.equal(corpus.cases.filter(item => item.activation === 'do_not_auto_activate').length, entry.nontrigger_cases);
  });

  for (const item of corpus.cases) {
    test(`${entry.suite}/${item.id}: declared contract is separate from the exact raw project`, async () => {
      assert.match(item.id, /^[a-z][a-z0-9-]+$/);
      assert.ok(item.skill === undefined || item.skill === entry.skill);
      assert.ok(typeof item.prompt === 'string' && item.prompt.length > 50);
      assert.ok(['activate', 'do_not_auto_activate'].includes(item.activation));
      assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
      assert.deepEqual(item.capabilities, entry.capabilities);
      assert.ok(item.rubric.length >= 3);
      assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
      assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
      for (const rule of item.rubric) {
        assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
        assert.ok(typeof rule.criterion === 'string' && rule.criterion.length > 20);
      }
      const corpusRoot = path.posix.dirname(entry.path);
      safeRelative(item.fixture_dir);
      assert.ok(item.fixture_dir.startsWith(`${corpusRoot}/fixtures/`));
      const fixturesRoot = await realpath(path.join(root, corpusRoot, 'fixtures'));
      const project = await realpath(path.join(root, item.fixture_dir));
      assert.equal(fixturesRoot, path.resolve(root, corpusRoot, 'fixtures'));
      assert.equal(project, path.resolve(root, item.fixture_dir));
      assert.ok(inside(fixturesRoot, project));
      assert.equal(new Set(item.fixtures).size, item.fixtures.length);
      const files = await inventory(project);
      assert.deepEqual(files.map(file => file.path).sort(), [...item.fixtures].sort());
      assert.ok(!files.some(file => /(?:^|\/)(?:cases[^/]*\.json|.*rubric.*|.*score.*|.*answer.*|.*correction.*)$/i.test(file.path)));
      for (const file of files) {
        safeRelative(file.path);
        const resolved = await realpath(path.join(project, file.path));
        assert.ok(inside(project, resolved));
        const raw = await readFile(resolved);
        assert.ok(raw.length > 0 && raw.length < 1_000_000);
      }
      if (entry.kind === 'review_capability') {
        assert.ok(['review', 'nontrigger'].includes(item.task_mode));
        assert.equal(item.editable_files, undefined);
        assert.equal(item.verification_argv, undefined);
      } else {
        assert.equal(item.task_mode, 'implementation');
        assert.deepEqual(item.editable_files, ['service.mjs']);
        assert.equal(item.verification_argv, undefined);
      }
    });
  }
}

test('all exact source inputs and established corpora and fixture bytes retain their pins', async () => {
  for (const entry of [...manifest.exact_input_files, ...manifest.protected_existing_files]) {
    safeRelative(entry.path);
    const raw = await readFile(path.join(root, entry.path));
    assert.equal(raw.length, entry.bytes, entry.path);
    assert.equal(sha256(raw), entry.sha256, entry.path);
  }
});

test('query revision preserves every original field except its explicit criterion and path correction', async () => {
  const history = 'evals/distributed-correctness/history/';
  const original = JSON.parse(await readFile(path.join(root, history, 'query-freshness-original-r01.json'), 'utf8'));
  const correction = JSON.parse(await readFile(path.join(root, history, 'query-freshness-answerability-correction-r02.json'), 'utf8'));
  const criterionDiff = JSON.parse(await readFile(path.join(root, history, 'query-freshness-criterion-diff-r02.json'), 'utf8'));
  const pathDiff = JSON.parse(await readFile(path.join(root, history, 'query-freshness-staging-path-diff-r02.json'), 'utf8'));
  const revised = corpora.get('evals/distributed-correctness/query-freshness-cases-r02.json');
  const before = original.cases.find(item => item.id === correction.case_id);
  const rule = before.rubric.find(item => item.id === correction.rubric_id);
  assert.equal(rule.severity, 'critical');
  assert.equal(rule.criterion, correction.original_criterion);
  assert.equal(correction.raw_facts_changed, false);
  assert.equal(correction.hidden_ack_assumed, false);
  assert.equal(correction.new_ack_observation_added, false);
  assert.deepEqual(criterionDiff, [{ path: '/cases/0/rubric/2/criterion', before: rule.criterion, after: correction.revised_criterion }]);
  rule.criterion = correction.revised_criterion;
  assert.equal(pathDiff.length, 4);
  for (const change of pathDiff) {
    const match = change.path.match(/^\/cases\/(\d+)\/fixture_dir$/);
    assert.ok(match);
    assert.equal(original.cases[Number(match[1])].fixture_dir, change.before);
    original.cases[Number(match[1])].fixture_dir = change.after;
  }
  assert.deepEqual(original, revised);
});

test('explicit cache metadata is only the original case plus its authorized service edit scope', async () => {
  const original = JSON.parse(await readFile(path.join(root, 'evals/distributed-correctness/cases.json'), 'utf8'));
  const before = original.cases.find(item => item.id === 'cache-fill-invalidation');
  const corrected = corpora.get('evals/distributed-correctness/cache-fill-invalidation-cases-r02.json');
  assert.equal(corrected.cases.length, 1);
  assert.deepEqual(corrected.cases[0], { ...before, editable_files: ['service.mjs'] });
  assert.equal(corrected.cases[0].verification_argv, undefined);
  assert.equal(corrected.cases[0].fixture_dir, before.fixture_dir);
});

test('snapshot paths reject traversal and symlink escapes instead of copying private controls', async t => {
  for (const input of ['../private/rubric.json', '/private/cases.json', 'raw/../rubric.json', 'raw\\rubric.json']) {
    assert.throws(() => safeRelative(input), /Unsafe relative path/);
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'tal-netflix-corpus-path-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const project = path.join(temporary, 'project');
  await mkdir(project);
  await writeFile(path.join(temporary, 'private.json'), '{}\n');
  await symlink(path.join(temporary, 'private.json'), path.join(project, 'unexpected.json'));
  await assert.rejects(inventory(project), /Symlink is not a snapshot input/);
});
