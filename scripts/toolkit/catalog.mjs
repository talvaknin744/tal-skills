import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { markdownTargets } from '../lib/markdown-links.mjs';
import { checkId, readTree, sorted } from './paths.mjs';

export function frontmatter(bytes, filename, fields) {
  const text = bytes.toString('utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`Missing YAML frontmatter: ${filename}`);
  const doc = parseDocument(match[1], { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`Invalid YAML in ${filename}: ${doc.errors[0].message}`);
  const metadata = doc.toJSON();
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error(`Invalid metadata: ${filename}`);
  if (fields && Object.keys(metadata).some(key => !fields.includes(key))) throw new Error(`Unknown metadata field: ${filename}`);
  const body = text.slice(match[0].length).trim();
  if (!body) throw new Error(`Empty instructions: ${filename}`);
  checkId(metadata.name, `name in ${filename}`, Boolean(fields));
  if (typeof metadata.description !== 'string' || !metadata.description.trim() || metadata.description.length > 1024) throw new Error(`Invalid description: ${filename}`);
  if (fields && metadata.schema_version !== 1) throw new Error(`Unsupported schema_version: ${filename}`);
  return { metadata, body, text };
}
export function localTargets(text) {
  const refs = [...text.matchAll(/^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)].map(match => match[1]);
  const html = [...text.matchAll(/<(?:a|img)\b[^>]*\b(?:href|src)=["']([^"']+)["']/gi)].map(match => match[1]);
  return [...markdownTargets(text), ...refs, ...html].filter(target => !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('#'));
}
export function linkPath(filename, target) {
  let decoded;
  try { decoded = decodeURIComponent(target.split('#')[0]); } catch { throw new Error(`Invalid link encoding: ${filename}: ${target}`); }
  if (!decoded || decoded.includes('\\') || decoded.startsWith('/') || /^[a-z]:/i.test(decoded)) throw new Error(`Unsafe local link: ${filename}: ${target}`);
  return path.posix.normalize(path.posix.join(path.posix.dirname(filename), decoded));
}
function arrayOfIds(value, label, native = false) {
  if (!Array.isArray(value) || new Set(value).size !== value.length) throw new Error(`Expected unique ${label}`);
  value.forEach(id => checkId(id, label, native));
  return sorted(value);
}
export function loadCatalog(sourceRoot) {
  const root = fs.realpathSync(sourceRoot);
  const skills = new Map(), agents = new Map(), workflows = new Map();
  const skillFiles = new Map();
  for (const directory of ['skills', 'integrations/temporal/skills']) {
    if (!fs.existsSync(path.join(root, directory))) continue;
    for (const [filename, file] of readTree(root, directory)) skillFiles.set(filename, file);
  }
  for (const [filename, file] of skillFiles) {
    const match = filename.match(/^(?:skills\/([^/]+)\/|integrations\/temporal\/skills\/)([^/]+)\/SKILL\.md$/);
    if (!match) continue;
    const concern = match[1] ?? 'temporal', name = match[2];
    checkId(concern, 'concern');
    const parsed = frontmatter(file.bytes, filename);
    if (parsed.metadata.name !== name || skills.has(name)) throw new Error(`Duplicate or mismatched skill: ${name}`);
    const prefix = path.posix.dirname(filename);
    const files = new Map([...skillFiles].filter(([key]) => key.startsWith(`${prefix}/`)));
    for (const [key, value] of files) if (key.endsWith('.md')) {
      for (const target of localTargets(value.bytes.toString('utf8'))) {
        const resolved = linkPath(key, target);
        if (!resolved.startsWith(`${prefix}/`) || (!files.has(resolved) && ![...files.keys()].some(key => key.startsWith(`${resolved}/`)))) throw new Error(`Skill resource escapes or is missing: ${key}: ${target}`);
      }
    }
    skills.set(name, { name, prefix, filename, ...parsed, files });
  }
  if (!skills.size) throw new Error('No skill packages found');
  const agentFiles = readTree(root, 'agents');
  const common = agentFiles.get('agents/CONTRACT.md');
  if (!common?.bytes.toString().trim()) throw new Error('Missing agents/CONTRACT.md');
  for (const [filename, file] of agentFiles) {
    const match = filename.match(/^agents\/([^/]+)\/([^/]+)\.md$/);
    if (!match) continue;
    checkId(match[1], 'concern');
    const parsed = frontmatter(file.bytes, filename, ['schema_version', 'name', 'description', 'skills']);
    const name = parsed.metadata.name;
    if (name !== match[2] || agents.has(name) || skills.has(name)) throw new Error(`Duplicate or mismatched agent: ${name}`);
    if (localTargets(parsed.body).length) throw new Error(`Local role links are not supported: ${filename}`);
    agents.set(name, { name, filename, file, ...parsed, skills: arrayOfIds(parsed.metadata.skills, `${name}.skills`) });
  }
  if (!agents.size) throw new Error('No agent definitions found');
  const workflowFiles = readTree(root, 'workflows');
  const handoff = workflowFiles.get('workflows/_shared/handoff.md');
  for (const [filename, file] of workflowFiles) {
    const match = filename.match(/^workflows\/([^/]+)\/WORKFLOW\.md$/);
    if (!match || match[1] === '_shared') continue;
    const parsed = frontmatter(file.bytes, filename, ['schema_version', 'name', 'description', 'agents', 'skills', 'disable-model-invocation']);
    if (parsed.metadata['disable-model-invocation'] !== undefined && typeof parsed.metadata['disable-model-invocation'] !== 'boolean') throw new Error(`Invalid disable-model-invocation: ${filename}`);
    const name = parsed.metadata.name;
    if (name !== match[1] || workflows.has(name) || skills.has(name) || agents.has(name)) throw new Error(`Duplicate or mismatched workflow: ${name}`);
    workflows.set(name, { name, filename, file, ...parsed, agents: arrayOfIds(parsed.metadata.agents, `${name}.agents`, true), skills: arrayOfIds(parsed.metadata.skills, `${name}.skills`), files: new Map([...workflowFiles].filter(([key]) => key.startsWith(`workflows/${name}/`))) });
  }
  if (workflows.size && !handoff?.bytes.toString().trim()) throw new Error('Missing workflows/_shared/handoff.md');
  for (const role of agents.values()) for (const skill of role.skills) if (!skills.has(skill)) throw new Error(`Missing skill ${skill} required by ${role.name}`);
  for (const workflow of workflows.values()) {
    for (const agent of workflow.agents) if (!agents.has(agent)) throw new Error(`Missing agent ${agent} required by ${workflow.name}`);
    for (const skill of workflow.skills) if (!skills.has(skill)) throw new Error(`Missing skill ${skill} required by ${workflow.name}`);
  }
  const codeDirectory = path.dirname(fileURLToPath(import.meta.url));
  const generatorSources = new Map(fs.readdirSync(codeDirectory).filter(name => name.endsWith('.mjs')).sort().map(name => [name, fs.readFileSync(path.join(codeDirectory, name))]));
  return { root, skills, agents, workflows, common, handoff, generatorSources };
}
