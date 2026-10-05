import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const readJson = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const ledger = await readJson('docs/temporal/customer-stories.json');
const upstream = await readJson('integrations/temporal/upstream-lock.json');

// Integrity of the reviewed snapshot and attribution, not verification of
// customer claims, current web availability, or production Temporal behavior.
test('Temporal ledger accounts for every entry in the reviewed index snapshot', () => {
  assert.equal(ledger.schema_version, 1);
  assert.equal(ledger.index_url, 'https://temporal.io/in-use');
  assert.match(ledger.reviewed_at, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(ledger.index_html_sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(ledger.stories.map(story => story.index), Array.from({ length: 70 }, (_, i) => i + 1));
  assert.equal(new Set(ledger.stories.map(story => story.url)).size, 70);
});

test('Temporal evidence preserves the difference between full text, summaries, and unavailable content', () => {
  const counts = {};
  for (const story of ledger.stories) {
    counts[story.evidence_type] = (counts[story.evidence_type] ?? 0) + 1;
    assert.equal(new URL(story.url).protocol, 'https:');
    assert.match(story.source_text_sha256, /^[a-f0-9]{64}$/);
    for (const field of ['title', 'source_type', 'evidence_note', 'observed_pattern', 'transferable_lesson', 'bug_to_prevent', 'limitations']) {
      assert.equal(typeof story[field], 'string', `${story.index}: ${field}`);
      assert.ok(story[field].trim().length > 0, `${story.index}: ${field}`);
    }
    assert.ok(!Object.hasOwn(story, 'content'), 'Do not redistribute complete source articles');
    if (story.evidence_type === 'title_only') assert.deepEqual(story.skills, []);
    else assert.ok(story.skills.length > 0);
  }
  assert.deepEqual(counts, { written_case_study: 39, talk_summary: 26, title_only: 1, external_blog: 1, webinar_summary: 3 });
});

test('every customer lesson routes to a real independently installable skill', async () => {
  for (const name of new Set(ledger.stories.flatMap(story => story.skills))) {
    assert.match(name, /^temporal-[a-z-]+$/);
    const adapted = upstream.skills.find(skill => skill.name === name);
    const packagePath = adapted?.local_path ?? `skills/temporal/${name}`;
    assert.ok((await stat(path.join(root, packagePath, 'SKILL.md'))).isFile());
  }
});

test('all eight official-derived skills have pinned Temporal ownership and retained licenses', async () => {
  assert.equal(upstream.skills.length, 8);
  assert.equal(new Set(upstream.skills.map(skill => skill.name)).size, 8);
  for (const skill of upstream.skills) {
    assert.match(skill.repo, /^temporalio\/[a-z0-9-]+$/);
    assert.match(skill.commit, /^[a-f0-9]{40}$/);
    assert.equal(skill.local_path, `integrations/temporal/skills/${skill.name}`);
    assert.ok(skill.source_path && skill.license_source);
    const directory = await realpath(path.join(root, skill.local_path));
    const license = await readFile(path.join(directory, 'LICENSE'), 'utf8');
    assert.ok(license.includes('Permission is hereby granted, free of charge'));
    const provenance = await readFile(path.join(directory, 'UPSTREAM.md'), 'utf8');
    assert.ok(provenance.includes(skill.commit), `${skill.name}: provenance must identify its exact revision`);
    assert.ok(provenance.includes(skill.repo), `${skill.name}: provenance must identify its owner`);
    assert.ok(skill.modifications.length > 0);
    assert.ok(skill.modified_files.length > 0);
    for (const name of skill.modified_files) {
      const target = await realpath(path.join(directory, name));
      assert.ok(target.startsWith(directory + path.sep), 'Modified assets must stay within their skill');
      assert.ok((await stat(target)).isFile());
    }
  }
});
