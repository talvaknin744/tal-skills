#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { personalPathHits } from './check-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
// Measure cloneable source, including new files, rather than local virtualenvs.
const files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0')
  .filter(name => name && fs.existsSync(path.join(root, name)) && fs.lstatSync(path.join(root, name)).isFile());
const bytes = files.reduce((sum, name) => sum + fs.statSync(path.join(root, name)).size, 0);
const text = name => fs.readFileSync(path.join(root, name), 'utf8');
const skills = files.filter(name => /^skills\/[^/]+\/[^/]+\/SKILL\.md$/.test(name));
const promoted = skills.filter(name => !name.startsWith('skills/misc/'));
const allSkills = files.filter(name => /^(skills\/[^/]+|integrations\/[^/]+\/skills)\/[^/]+\/SKILL\.md$/.test(name));
const descriptionWords = promoted.map(name => {
  const frontmatter = text(name).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const description = frontmatter?.[1].match(/^description:\s*(.*)(?:\n((?:[ \t]+[^\n]*\n?)*))?/m);
  const value = /^[>|][-+0-9]*$/.test(description?.[1] ?? '') ? description?.[2] : description?.[1];
  return String(value ?? '').replace(/^["']|["']$/g, '').trim().split(/\s+/).filter(Boolean).length;
});
const buckets = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter(entry => entry.isDirectory());
const pack = git('count-objects', '-vH').split('\n').find(line => line.startsWith('size-pack:'))?.slice(10).trim() ?? 'unavailable';
const homeHits = files.flatMap(name => personalPathHits(text(name)).map(hit => ({ name, ...hit })));
const rows = [
  ['Working tree source size (MiB, excluding ignored local environments)', (bytes / 1_048_576).toFixed(1)],
  ['Working tree source bytes', bytes],
  ['Git pack size', pack],
  ['Files tracked', git('ls-files', '-z').split('\0').filter(Boolean).length],
  ['Files over 1 MB (source)', files.filter(name => fs.statSync(path.join(root, name)).size > 1_048_576).length],
  ['Files under evals/', files.filter(name => name.startsWith('evals/')).length],
  ['Codex schema JSON copies', files.filter(name => name.includes('/evidence/schema/')).length],
  ['SKILL.md snapshots under evals/', files.filter(name => /^evals\/.*candidate.*\/SKILL\.md$/.test(name)).length],
  ['Personal home-path hits (lines)', homeHits.length],
  ['Personal course label hits (files)', files.filter(name => text(name).includes(['Infi', '2'].join(' '))).length],
  ['Bucket folders under skills/', buckets.length],
  ['Buckets with exactly 1 skill', buckets.filter(bucket => skills.filter(name => name.startsWith(`skills/${bucket.name}/`)).length === 1).length],
  ['Promoted SKILL.md (not misc/)', promoted.length],
  ['Vendored Temporal skills in integrations/', allSkills.filter(name => name.startsWith('integrations/temporal/')).length],
  ['Skills missing agents/openai.yaml', allSkills.filter(name => !fs.existsSync(path.join(root, name.replace('SKILL.md', 'agents/openai.yaml')))).length],
  ['Descriptions over 40 words (promoted)', descriptionWords.filter(words => words > 40).length],
  ['Description words: max / avg (promoted)', `${Math.max(0, ...descriptionWords)} / ${descriptionWords.length ? (descriptionWords.reduce((a, b) => a + b, 0) / descriptionWords.length).toFixed(1) : 0}`],
  ['Skills calling a sibling via Skill tool', skills.filter(name => text(name).includes('Skill tool')).length],
  ['Files with em-dashes (.md)', files.filter(name => name.endsWith('.md') && text(name).includes('—')).length],
  ['README bytes', fs.statSync(path.join(root, 'README.md')).size],
  ['Docs pages for promoted skills', promoted.filter(name => { const [, bucket, skill] = name.split('/'); return fs.existsSync(path.join(root, `docs/${bucket}/${skill}.md`)); }).length],
  ['plugin.json present', fs.existsSync(path.join(root, '.claude-plugin/plugin.json')) ? 'yes' : 'no'],
  ['CLAUDE.md present', fs.existsSync(path.join(root, 'CLAUDE.md')) ? 'yes' : 'no'],
  ['Git tags', git('tag').split('\n').filter(Boolean).length],
];
console.log('| Metric | Value |\n| --- | --- |');
for (const [metric, value] of rows) console.log(`| ${metric} | ${value} |`);
