import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { markdownTargets } from './lib/markdown-links.mjs';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env.TAL_SKILLS_ROOT ? path.resolve(process.env.TAL_SKILLS_ROOT) : scriptRoot;
const skillRoots = ['skills', 'integrations/temporal/skills'].map(name => path.join(root, name));
const errors = [];
const checked = [];
const seenNames = new Set();
const promotedBuckets = new Set(['engineering', 'performance', 'languages', 'temporal']);
// Temporary, exact-content compatibility exceptions. Phase 5 must remove these
// by shortening the descriptions; do not broaden this registry by name alone.
const longDescriptionSha256UntilPhase5 = new Map([
  ['legacy-code-changes', '7babfa1775aa6318bbf321124292fccdbec32780ed7fdfe3884ca030ec921006'],
  ['recovery-validation', '06da98bd3cb507999caaf58df8b8440ec55c6f74fd894143891b96d75f374f23'],
  ['data-layout-performance', 'b1f50ec1740923a45bfd6ef373c60730bb102a2341315c61a6ffc04ec6c30d0c'],
]);
const promoted = [];

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
for (const skillRoot of skillRoots) {
  if (!fs.existsSync(skillRoot)) continue;
  if (path.relative(root, skillRoot) === 'integrations/temporal/skills') {
    for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) skillDirectories.push({ entry, directory: path.join(skillRoot, entry.name), concern: 'temporal' });
    }
    continue;
  }
  for (const concern of fs.readdirSync(skillRoot, { withFileTypes: true })) {
    if (!concern.isDirectory()) continue;
    requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concern.name), `Invalid concern name: ${concern.name}`);
    const concernRoot = path.join(skillRoot, concern.name);
    for (const entry of fs.readdirSync(concernRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) skillDirectories.push({ entry, directory: path.join(concernRoot, entry.name), concern: concern.name });
    }
  }
}

for (const { entry, directory, concern } of skillDirectories) {
  const isPromoted = directory.startsWith(path.join(root, 'skills') + path.sep) && promotedBuckets.has(concern);
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
    if (isPromoted) {
      promoted.push({ name: entry.name, directory, bucket: concern, metadata });
      const allowedKeys = new Set(['name', 'description', 'license', 'disable-model-invocation']);
      for (const key of Object.keys(metadata ?? {})) {
        requireCondition(allowedKeys.has(key), `${entry.name}: unsupported frontmatter key ${key}`);
      }
      if (metadata?.license !== undefined) {
        requireCondition(typeof metadata.license === 'string' && metadata.license.trim().length > 0,
          `${entry.name}: license must be a non-empty string`);
      }
      if (metadata?.['disable-model-invocation'] !== undefined) {
        requireCondition(typeof metadata['disable-model-invocation'] === 'boolean',
          `${entry.name}: disable-model-invocation must be boolean`);
      }
      const words = metadata?.description?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (words > 40) {
        const expectedHash = longDescriptionSha256UntilPhase5.get(entry.name);
        const actualHash = crypto.createHash('sha256').update(metadata.description).digest('hex');
        requireCondition(Boolean(expectedHash) && expectedHash === actualHash,
          `${entry.name}: description must be 15–40 words (unregistered or changed grandfathered description; sha256=${actualHash})`);
      } else {
        requireCondition(words >= 15, `${entry.name}: description must be 15–40 words (found ${words})`);
      }
    }
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
  if (isPromoted) requireCondition(fs.existsSync(uiPath), `${entry.name}: missing OpenAI host metadata`);
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
      if (isPromoted) {
        requireCondition(ui?.policy?.allow_implicit_invocation === false
          || ui?.policy?.allow_implicit_invocation === undefined,
        `${entry.name}: OpenAI implicit invocation policy must be false or omitted`);
      }
    } catch (error) {
      errors.push(`${entry.name}: invalid UI metadata: ${error.message}`);
    }
  }
  checked.push(`${path.relative(root, directory)}`);
}

// The promoted catalog is discoverable from both the repository landing page
// and its bucket README. These checks intentionally bind links to the source
// entrypoint rather than accepting a mention of the name alone.
const rootReadme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const skill of promoted) {
  const sourceTarget = `skills/${skill.bucket}/${skill.name}/SKILL.md`;
  const bucketTarget = `./${skill.name}/SKILL.md`;
  requireCondition(rootReadme.includes(`(${sourceTarget})`), `${skill.name}: missing root README catalog link`);
  const bucketReadme = path.join(root, 'skills', skill.bucket, 'README.md');
  requireCondition(fs.existsSync(bucketReadme), `${skill.bucket}: missing bucket README`);
  if (fs.existsSync(bucketReadme)) {
    requireCondition(fs.readFileSync(bucketReadme, 'utf8').includes(`(${bucketTarget})`),
      `${skill.name}: missing ${skill.bucket} README catalog link`);
  }
}

const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
if (!fs.existsSync(pluginPath)) {
  errors.push('.claude-plugin/plugin.json: missing plugin manifest');
} else {
  try {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    const pluginSkills = plugin.skills;
    requireCondition(Array.isArray(pluginSkills), '.claude-plugin/plugin.json: skills must be an array');
    const pluginPaths = new Set((pluginSkills ?? []).filter(skill => typeof skill === 'string'));
    const expectedPluginPaths = promoted.map(skill => `./skills/${skill.bucket}/${skill.name}`);
    requireCondition(pluginPaths.size === expectedPluginPaths.length
      && expectedPluginPaths.every(skillPath => pluginPaths.has(skillPath)),
      `.claude-plugin/plugin.json: skill coverage must exactly match promoted catalog (${promoted.length})`);
  } catch (error) {
    errors.push(`.claude-plugin/plugin.json: invalid JSON: ${error.message}`);
  }
}

requireCondition(checked.length > 0, 'No skills found');
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Skill packaging and local references valid: ${checked.join(', ')}`);
}
