import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { markdownTargets } from './lib/markdown-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = path.join(root, 'skills');
const errors = [];
const checked = [];
const seenNames = new Set();

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`Skill resources must be ordinary files: ${name}`);
      return [];
    }
    return entry.isDirectory() ? filesUnder(name) : [name];
  });
}

const skillDirectories = [];
for (const concern of fs.readdirSync(skillRoot, { withFileTypes: true })) {
  if (!concern.isDirectory()) continue;
  requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concern.name), `Invalid concern name: ${concern.name}`);
  const concernRoot = path.join(skillRoot, concern.name);
  for (const entry of fs.readdirSync(concernRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) skillDirectories.push({ entry, directory: path.join(concernRoot, entry.name), concern: concern.name });
  }
}

for (const { entry, directory, concern } of skillDirectories) {
  requireCondition(!seenNames.has(entry.name), `Duplicate skill name across concerns: ${entry.name}`);
  seenNames.add(entry.name);
  const entrypoint = path.join(directory, 'SKILL.md');
  if (!fs.existsSync(entrypoint)) {
    errors.push(`${entry.name}: missing SKILL.md`);
    continue;
  }
  const text = fs.readFileSync(entrypoint, 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) {
    errors.push(`${entry.name}: missing YAML frontmatter`);
    continue;
  }
  try {
    const metadata = parse(frontmatter[1]);
    requireCondition(metadata?.name === entry.name, `${entry.name}: name must match folder`);
    requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata?.name ?? '') && metadata.name.length <= 64,
      `${entry.name}: invalid name`);
    requireCondition(typeof metadata?.description === 'string' && metadata.description.trim().length > 0
      && metadata.description.length <= 1024, `${entry.name}: description must be 1–1024 characters`);
    requireCondition(text.slice(frontmatter[0].length).trim().length > 0, `${entry.name}: empty instructions`);
  } catch (error) {
    errors.push(`${entry.name}: invalid frontmatter: ${error.message}`);
  }

  for (const filename of filesUnder(directory)) {
    if (!filename.endsWith('.md')) continue;
    const contents = fs.readFileSync(filename, 'utf8');
    for (const target of markdownTargets(contents)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const localPath = decodeURIComponent(target.split('#')[0]);
      const resolved = path.resolve(path.dirname(filename), localPath);
      requireCondition(resolved.startsWith(directory + path.sep),
        `${path.relative(root, filename)}: resource escapes installed skill: ${target}`);
      requireCondition(fs.existsSync(resolved), `${path.relative(root, filename)}: missing resource ${target}`);
    }
  }

  const uiPath = path.join(directory, 'agents', 'openai.yaml');
  if (fs.existsSync(uiPath)) {
    try {
      const metadata = parse(fs.readFileSync(uiPath, 'utf8'));
      const ui = metadata?.interface;
      requireCondition(typeof ui?.display_name === 'string' && ui.display_name.trim().length > 0,
        `${entry.name}: missing display name`);
      requireCondition(typeof ui?.short_description === 'string' && ui.short_description.length >= 25
        && ui.short_description.length <= 64, `${entry.name}: short description must be 25–64 characters`);
      requireCondition(typeof ui?.default_prompt === 'string' && ui.default_prompt.includes('$' + entry.name),
        `${entry.name}: default prompt must invoke the skill`);
    } catch (error) {
      errors.push(`${entry.name}: invalid UI metadata: ${error.message}`);
    }
  }
  checked.push(`${concern}/${entry.name}`);
}

requireCondition(checked.length > 0, 'No skills found');
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Skill packaging and local references valid: ${checked.join(', ')}`);
}
