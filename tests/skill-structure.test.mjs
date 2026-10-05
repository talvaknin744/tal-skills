import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(repository, 'scripts/check-skills.mjs');

function fixture(description, extraFrontmatter = '', folderName = 'fixture-skill') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-skills-structure-'));
  fs.mkdirSync(path.join(root, 'scripts/lib'), { recursive: true });
  fs.copyFileSync(checker, path.join(root, 'scripts/check-skills.mjs'));
  fs.copyFileSync(path.join(repository, 'scripts/lib/markdown-links.mjs'), path.join(root, 'scripts/lib/markdown-links.mjs'));
  const bucket = path.join(root, 'skills/engineering');
  const skill = path.join(bucket, folderName);
  fs.mkdirSync(path.join(skill, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), `---\nname: ${folderName}\ndescription: ${description}\nlicense: MIT\n${extraFrontmatter}---\n\nInstructions.\n`);
  fs.writeFileSync(path.join(skill, 'agents/openai.yaml'), `interface:\n  display_name: Fixture Skill\n  short_description: A useful fixture skill description\n  default_prompt: Use $${folderName} to solve this.\n`);
  fs.writeFileSync(path.join(bucket, 'README.md'), `# Engineering\n\n- [${folderName}](./${folderName}/SKILL.md)\n`);
  fs.writeFileSync(path.join(root, 'README.md'), `# Catalog\n\n- [${folderName}](skills/engineering/${folderName}/SKILL.md)\n`);
  fs.mkdirSync(path.join(root, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude-plugin/plugin.json'), JSON.stringify({
    skills: [`./skills/engineering/${folderName}`],
  }));
  return root;
}

function check(root) {
  const result = spawnSync(process.execPath, [checker], {
    encoding: 'utf8',
    env: { ...process.env, TAL_SKILLS_ROOT: root },
  });
  return `${result.stdout}${result.stderr}`;
}

test('promoted skill structure accepts valid metadata and rejects malformed boundaries', (t) => {
  const description = 'Design reliable systems by identifying invariants, validating assumptions, and checking recovery behavior under realistic failure conditions.';
  const good = fixture(description);
  t.after(() => fs.rmSync(good, { recursive: true, force: true }));
  assert.match(check(good), /Skill packaging and local references valid/);

  const pluginGap = fixture(description);
  t.after(() => fs.rmSync(pluginGap, { recursive: true, force: true }));
  fs.writeFileSync(path.join(pluginGap, '.claude-plugin/plugin.json'), JSON.stringify({ skills: [] }));
  assert.match(check(pluginGap), /skill coverage must exactly match promoted catalog/);

  const tooLong = fixture(Array.from({ length: 60 }, (_, index) => `word${index}`).join(' '));
  t.after(() => fs.rmSync(tooLong, { recursive: true, force: true }));
  assert.match(check(tooLong), /description must be 15–40 words/);

  const extraKey = fixture(description, 'surprise: true\n');
  t.after(() => fs.rmSync(extraKey, { recursive: true, force: true }));
  assert.match(check(extraKey), /unsupported frontmatter key surprise/);

  const wrongName = fixture(description, '', 'folder-skill');
  t.after(() => fs.rmSync(wrongName, { recursive: true, force: true }));
  const skillFile = path.join(wrongName, 'skills/engineering/folder-skill/SKILL.md');
  fs.writeFileSync(skillFile, fs.readFileSync(skillFile, 'utf8').replace('name: folder-skill', 'name: different-skill'));
  assert.match(check(wrongName), /name must match folder/);
});

test('prose style rejects new dashes and preserves only exact retained records', (t) => {
  const root = fixture('Design reliable systems by identifying invariants, validating assumptions, and checking recovery behavior under realistic failure conditions.');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const current = path.join(root, 'docs/new-page.md');
  fs.mkdirSync(path.dirname(current), { recursive: true });
  fs.writeFileSync(current, '# Current prose\n\nA boundary\u2014with an example.\n');
  assert.match(check(root), /docs\/new-page.md: replace em-dashes/);
  fs.writeFileSync(current, '# Current prose\n\nA boundary, with an example.\n');
  const retained = 'docs/productivity/evaluation-notes.md';
  fs.mkdirSync(path.dirname(path.join(root, retained)), { recursive: true });
  fs.copyFileSync(path.join(repository, retained), path.join(root, retained));
  assert.match(check(root), /Skill packaging and local references valid/);
  fs.appendFileSync(path.join(root, retained), '\nNew prose\u2014not historical.\n');
  assert.match(check(root), /evaluation-notes.md: replace em-dashes/);
});
