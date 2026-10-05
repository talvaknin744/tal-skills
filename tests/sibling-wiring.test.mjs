import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { renderSkillHandoffs } from '../scripts/toolkit/generate.mjs';

const handoff = /hand off to the `[a-z0-9-]+` skill/i;

function assertFallbackCoverage(text) {
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => handoff.test(paragraph));
  assert.ok(paragraphs.length > 0, 'expected at least one sibling handoff paragraph');
  for (const paragraph of paragraphs) {
    const names = [...new Set([...paragraph.matchAll(/hand off to the `([a-z0-9-]+)` skill/gi)].map(match => match[1]))];
    const named = names.map(name => `\`${name}\``).join(' or ');
    const fallback = `If ${named} is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes.`;
    assert.ok(paragraph.includes(fallback), `missing named fallback in: ${paragraph}`);
  }
  return paragraphs.length;
}

test('every wired skill handoff paragraph has one standalone unavailable-sibling fallback', () => {
  const files = [];
  for (const bucket of fs.readdirSync('skills')) {
    const bucketPath = path.join('skills', bucket);
    if (!fs.statSync(bucketPath).isDirectory()) continue;
    for (const skill of fs.readdirSync(bucketPath)) {
      const filename = path.join(bucketPath, skill, 'SKILL.md');
      if (fs.existsSync(filename)) files.push(filename);
    }
  }
  let paragraphs = 0;
  let wiredSkills = 0;
  for (const filename of files) {
    const body = fs.readFileSync(filename, 'utf8').split(/^---\s*$/m).slice(2).join('---');
    const count = (body.match(new RegExp(handoff.source, 'gi')) ?? []).length;
    if (!count) continue;
    wiredSkills++;
    paragraphs += assertFallbackCoverage(body);
  }
  assert.equal(wiredSkills, 21);
  assert.equal(paragraphs, 26);
});

test('coverage assertion rejects a removed fallback in any handoff paragraph', () => {
  const filename = 'skills/engineering/a2a-engineering/SKILL.md';
  const source = fs.readFileSync(filename, 'utf8');
  assert.ok(assertFallbackCoverage(source) > 0);
  const removed = source.replace(/ If `[^`]+`(?: or `[^`]+`)* is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes\./, '');
  assert.notEqual(removed, source, 'fixture mutation should remove the real fallback sentence');
  assert.throws(() => assertFallbackCoverage(removed), /missing.*fallback/);
});

test('host rendering matches handoff case while preserving the target name', () => {
  const source = '---\nname: example\ndescription: Example.\n---\nhand off to the `Example-Skill` skill.\nHand off to the `second-skill` skill.\n';
  assert.equal(renderSkillHandoffs(source, 'codex'), '---\nname: example\ndescription: Example.\n---\nuse $Example-Skill.\nUse $second-skill.\n');
  assert.equal(renderSkillHandoffs(source, 'claude'), '---\nname: example\ndescription: Example.\n---\ncall the Skill tool with "Example-Skill".\nCall the Skill tool with "second-skill".\n');
});
