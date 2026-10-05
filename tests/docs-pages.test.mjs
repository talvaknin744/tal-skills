import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  }
});
