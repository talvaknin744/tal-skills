import path from 'node:path';
import crypto from 'node:crypto';
import { stringify } from 'yaml';
import TOML from '@iarna/toml';
import { assertDistinctPaths, sorted } from './paths.mjs';
import { localTargets, linkPath, frontmatter } from './catalog.mjs';

export function hostsFor(host) {
  if (!['codex', 'claude', 'both'].includes(host)) throw new Error(`Invalid host: ${host}`);
  return host === 'both' ? ['claude', 'codex'] : [host];
}
export function select(catalog, { agents, workflows, skills } = {}) {
  if (agents === undefined && workflows === undefined && skills === undefined) return { agents: sorted(catalog.agents.keys()), workflows: sorted(catalog.workflows.keys()) };
  for (const [kind, values] of [['agents', agents ?? []], ['workflows', workflows ?? []], ['skills', skills ?? []]]) {
    if (!Array.isArray(values) || new Set(values).size !== values.length) throw new Error(`Invalid selection: ${kind}`);
    for (const name of values) if (!catalog[kind].has(name)) throw new Error(`Unknown ${kind}: ${name}`);
  }
  if (!(agents?.length || workflows?.length || skills?.length)) throw new Error('Select at least one skill, agent or workflow');
  return { agents: sorted(agents ?? []), workflows: sorted(workflows ?? []), ...(skills === undefined ? {} : { skills: sorted(skills) }) };
}
const markdown = (metadata, body) => `---\n${stringify(metadata, { lineWidth: 0 }).trimEnd()}\n---\n\n${body.trim()}\n`;
const textFile = (text, source, kind) => ({ bytes: Buffer.from(text.replace(/\r\n/g, '\n')), mode: 0o644, source, kind });
const skillsRoot = host => host === 'codex' ? '.agents/skills' : '.claude/skills';
function roleText(role, host) {
  const native = `.${host}/agents/${role.name}.${host === 'codex' ? 'toml' : 'md'}`;
  const pointers = [`Read the [execution and result contract](../../.tal-skills/agents/CONTRACT.md) before working. Resolve these links relative to the installed \`${native}\` definition.`];
  if (role.skills.length) pointers.push('Use these declared skills for the assigned task:\n', ...role.skills.map(name => `- [${name}](${path.posix.relative(path.posix.dirname(native), `${skillsRoot(host)}/${name}/SKILL.md`)})`));
  return `${role.body}\n\n${pointers.join('\n')}\n`;
}
export function generateBundle(catalog, { host, agents, workflows, skills } = {}) {
  const hosts = hostsFor(host), selection = select(catalog, { agents, workflows, skills });
  const roleNames = new Set(selection.agents), skillNames = new Set(selection.skills ?? []);
  for (const name of selection.workflows) {
    const workflow = catalog.workflows.get(name);
    workflow.agents.forEach(id => roleNames.add(id));
    workflow.skills.forEach(id => skillNames.add(id));
  }
  for (const name of roleNames) catalog.agents.get(name).skills.forEach(id => skillNames.add(id));
  const files = new Map(), packageRoots = new Set(['.tal-skills']);
  const add = (name, file) => { if (files.has(name)) throw new Error(`Duplicate output: ${name}`); files.set(name, { ...file, mode: 0o644 | (file.mode & 0o111) }); };
  if (roleNames.size || selection.workflows.length) add('.tal-skills/agents/CONTRACT.md', { ...catalog.common, source: 'agents/CONTRACT.md', kind: 'contract' });
  for (const name of roleNames) {
    const role = catalog.agents.get(name);
    add(`.tal-skills/${role.filename}`, { ...role.file, source: role.filename, kind: 'canonical-agent' });
  }
  if (selection.workflows.length) add('.tal-skills/workflows/_shared/handoff.md', { ...catalog.handoff, source: 'workflows/_shared/handoff.md', kind: 'handoff' });
  for (const name of selection.workflows) for (const [key, value] of catalog.workflows.get(name).files) add(`.tal-skills/${key}`, { ...value, source: key, kind: 'canonical-workflow' });
  for (const selectedHost of hosts) {
    for (const name of roleNames) {
      const role = catalog.agents.get(name), body = roleText(role, selectedHost);
      const native = `.${selectedHost}/agents/${name}.${selectedHost === 'codex' ? 'toml' : 'md'}`;
      const text = selectedHost === 'codex'
        ? `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(role.metadata.description)}\ndeveloper_instructions = ${JSON.stringify(body)}\n`
        : markdown({ name, description: role.metadata.description, model: 'inherit', skills: role.skills }, body);
      add(native, textFile(text, role.filename, 'native-agent'));
    }
    for (const name of skillNames) {
      const skill = catalog.skills.get(name), packageRoot = `${skillsRoot(selectedHost)}/${name}`;
      packageRoots.add(packageRoot);
      for (const [key, file] of skill.files) add(`${packageRoot}/${key.slice(skill.prefix.length + 1)}`, { ...file, source: key, kind: 'skill' });
    }
    for (const name of selection.workflows) {
      const workflow = catalog.workflows.get(name), packageRoot = `${skillsRoot(selectedHost)}/${name}`;
      packageRoots.add(packageRoot);
      const filename = `${packageRoot}/SKILL.md`;
      const target = path.posix.relative(packageRoot, `.tal-skills/${workflow.filename}`);
      const body = `Run [${name}](${target}) for the user's current request. Resolve the link relative to this installed SKILL.md file. Keep coordination in the main session and load only the specialists needed by the workflow.${selectedHost === 'claude' ? '\n\nTask: $ARGUMENTS' : ''}`;
      add(filename, textFile(markdown({ name, description: workflow.metadata.description }, body), workflow.filename, 'workflow-wrapper'));
    }
  }
  assertDistinctPaths(files.keys());
  const ordered = new Map([...files].sort(([a], [b]) => a.localeCompare(b, 'en')));
  validateBundle(ordered);
  const digest = crypto.createHash('sha256');
  const record = bytes => { const value = Buffer.from(bytes); digest.update(String(value.length)); digest.update(':'); digest.update(value); };
  for (const [name, file] of ordered) { record(name); record(file.bytes); record(String(file.mode)); }
  for (const [name, bytes] of catalog.generatorSources) { record(name); record(bytes); }
  return { files: ordered, hosts, selection, packageRoots: sorted(packageRoots), resolved: { agents: sorted(roleNames), skills: sorted(skillNames) }, sourceDigest: digest.digest('hex') };
}
export function validateBundle(files) {
  for (const [filename, file] of files) {
    let body;
    if (file.kind === 'native-agent' && filename.endsWith('.toml')) {
      const data = TOML.parse(file.bytes.toString());
      if (Object.keys(data).sort().join(',') !== 'description,developer_instructions,name') throw new Error(`Unexpected native fields: ${filename}`);
      body = data.developer_instructions;
    } else if (filename.endsWith('.md')) {
      body = file.bytes.toString();
      if (file.kind === 'native-agent') {
        const meta = frontmatter(file.bytes, filename).metadata;
        if (meta.model !== 'inherit' || Object.keys(meta).sort().join(',') !== 'description,model,name,skills') throw new Error(`Unexpected Claude fields: ${filename}`);
      }
    }
    if (body) for (const target of localTargets(body)) {
      const resolved = linkPath(filename, target);
      if (!files.has(resolved) && ![...files.keys()].some(key => key.startsWith(`${resolved}/`))) throw new Error(`Missing or unselected installed link: ${filename}: ${target}`);
    }
  }
}
export function adapterFiles(catalog) {
  const files = new Map();
  for (const host of ['claude', 'codex']) {
    const bundle = generateBundle(catalog, { host });
    for (const [name, file] of bundle.files) if (['native-agent', 'workflow-wrapper'].includes(file.kind)) {
      files.set(`adapters/${host}/${name}${file.kind === 'workflow-wrapper' ? '.template' : ''}`, file);
    }
  }
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b, 'en')));
}
