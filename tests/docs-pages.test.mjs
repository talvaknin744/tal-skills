import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { originalPublishedDigest } from '../scripts/lib/published-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buckets = ['engineering', 'performance', 'languages', 'temporal'];

test('every promoted skill has a matching public docs page linked to its canonical package', () => {
  const promoted = buckets.flatMap((bucket) => fs.readdirSync(path.join(root, 'skills', bucket), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, 'skills', bucket, entry.name, 'SKILL.md')))
    .map((entry) => ({ bucket, name: entry.name })));
  assert.equal(promoted.length, 35);

  for (const { bucket, name } of promoted) {
    const page = path.join(root, 'docs', bucket, `${name}.md`);
    assert.ok(fs.existsSync(page), `${name}: missing docs page ${path.relative(root, page)}`);
    const content = fs.readFileSync(page, 'utf8');
    const heading = content.split(/\r?\n/, 1)[0].replace(/^#\s+/, '').trim().toLowerCase();
    assert.equal(heading.replace(/\s+/g, '-'), name.toLowerCase(), `${name}: page title must match the package`);
    assert.ok(content.includes(`../../skills/${bucket}/${name}/SKILL.md`),
      `${name}: docs page must link to the canonical skill package`);
    const skill = fs.readFileSync(path.join(root, 'skills', bucket, name, 'SKILL.md'), 'utf8');
    const invocation = content.match(/^Invocation: .*$/gm) ?? [];
    if (/^disable-model-invocation:\s*true\s*$/m.test(skill.split('---', 2)[1] ?? '')) {
      assert.deepEqual(invocation, [
        'Invocation: user-invoked. Claude Code project skill: /architecture. Claude Code plugin skill: /tal-skills:architecture. Codex: $architecture. Automatic invocation is disabled.',
      ], `${name}: explicit invocation must match canonical metadata`);
    } else {
      assert.deepEqual(invocation, ['Invocation: automatic'], `${name}: docs must expose automatic invocation`);
    }
    const reachFor = content.split('## When to reach for it')[1]?.split(/^## /m, 1)[0] ?? '';
    assert.ok(reachFor.includes(invocation[0]), `${name}: invocation belongs under When to reach for it`);
  }
});

test('leading term map counts repeated concepts only inside each skill body and shows unmapped skills', () => {
  const promoted = buckets.flatMap((bucket) => fs.readdirSync(path.join(root, 'skills', bucket), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, 'skills', bucket, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)).sort();
  const map = JSON.parse(fs.readFileSync(path.join(root, 'scripts/leading-terms.json'), 'utf8'));
  const mapped = Object.keys(map.terms_by_skill).sort();
  const unmapped = [...map.unmapped_skills].sort();
  assert.equal(map.schema_version, 1);
  assert.deepEqual([...mapped, ...unmapped].sort(), promoted);
  assert.equal(new Set([...mapped, ...unmapped]).size, promoted.length);
  for (const [name, terms] of Object.entries(map.terms_by_skill)) {
    const bucket = buckets.find((candidate) => fs.existsSync(path.join(root, 'skills', candidate, name, 'SKILL.md')));
    const body = fs.readFileSync(path.join(root, 'skills', bucket, name, 'SKILL.md'), 'utf8')
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^#[^\r\n]*\r?\n/, '');
    assert.ok(terms.length > 0, `${name}: mapped skills need a leading term`);
    assert.equal(new Set(terms).size, terms.length, `${name}: terms must be unique`);
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.ok((body.match(new RegExp(`\\b${escaped}\\b`, 'gi')) ?? []).length >= 3,
        `${name}: ${term} must occur at least three times in its own body`);
    }
  }
  assert.ok(unmapped.length > 0, 'skills without a naturally repeated leading term stay visible');
});

test('research synthesis wording receipt preserves its relocated historical digest', () => {
  const filename = path.join(root, 'docs/misc/research-synthesis.md');
  const bytes = fs.readFileSync(filename);
  assert.equal(originalPublishedDigest(bytes, 'docs/misc/research-synthesis.md'),
    'cf8f28713250dc1c18ec9c96b76063bd017c7031fa7d1cad13248f13eac0fa95');
});
