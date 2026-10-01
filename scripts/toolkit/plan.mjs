import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseDocument } from 'yaml';
import { loadCatalog } from './catalog.mjs';
import { generateBundle } from './generate.mjs';
import { checkId, contained, inspect, lstat, readRegular, parentDirectories, safeRelative, sha256, sorted, assertDistinctPaths } from './paths.mjs';

export const MANIFEST = '.tal-skills/manifest.json';
export const JOURNAL = '.tal-skills-install.journal.json';
export const LOCK = '.tal-skills-install.lock';
export function allowedFile(name) {
  safeRelative(name);
  if (name === MANIFEST) return true;
  if (/^\.tal-skills\/(agents|workflows)\/.+/.test(name)) return true;
  const native = name.match(/^\.(codex|claude)\/agents\/([^/]+)\.(toml|md)$/);
  if (native) { checkId(native[2], 'native agent', true); return (native[1] === 'codex') === (native[3] === 'toml'); }
  const skill = name.match(/^\.(agents|claude)\/skills\/([^/]+)\/(.+)$/);
  if (skill) { checkId(skill[2], 'skill directory'); return true; }
  return false;
}
export function allowedDirectory(name) {
  safeRelative(name);
  return ['.tal-skills', '.codex', '.codex/agents', '.claude', '.claude/agents', '.claude/skills', '.agents', '.agents/skills'].includes(name)
    || /^\.tal-skills\/(agents|workflows)(\/.*)?$/.test(name)
    || /^\.(agents|claude)\/skills\/[^/]+(?:\/.*)?$/.test(name);
}
export function validateManifest(value) {
  if (!value || value.schema_version !== 1 || value.toolkit !== 'tal-skills' || value.generator_version !== 1) throw new Error('Unsupported installation manifest');
  if (!/^[a-f0-9]{64}$/.test(value.source_digest ?? '') || !Array.isArray(value.hosts) || !value.hosts.length || value.hosts.some(x => !['codex', 'claude'].includes(x)) || new Set(value.hosts).size !== value.hosts.length) throw new Error('Invalid manifest metadata');
  for (const kind of ['agents', 'workflows', ...(value.selection?.skills === undefined ? [] : ['skills'])]) {
    if (!Array.isArray(value.selection?.[kind]) || new Set(value.selection[kind]).size !== value.selection[kind].length) throw new Error('Invalid manifest selection');
    value.selection[kind].forEach(id => checkId(id, kind, kind !== 'skills'));
  }
  if (!Array.isArray(value.files) || !Array.isArray(value.package_roots) || !Array.isArray(value.created_directories)) throw new Error('Invalid manifest collections');
  assertDistinctPaths(value.files.map(x => x.path));
  if (new Set(value.files.map(x => x.path)).size !== value.files.length) throw new Error('Duplicate manifest path');
  for (const file of value.files) if (!allowedFile(file.path) || file.path === MANIFEST || !/^[a-f0-9]{64}$/.test(file.sha256 ?? '') || !Number.isInteger(file.mode) || file.mode < 0 || file.mode > 0o777 || typeof file.kind !== 'string' || typeof file.source !== 'string') throw new Error(`Invalid manifest file: ${file.path}`);
  for (const root of value.package_roots) if (root !== '.tal-skills' && !/^\.(agents|claude)\/skills\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(root)) throw new Error(`Invalid package ownership: ${root}`);
  for (const dir of value.created_directories) if (!allowedDirectory(dir)) throw new Error(`Invalid directory ownership: ${dir}`);
  return value;
}
export function readManifest(target) {
  if (!inspect(target, MANIFEST)) return undefined;
  const file = readRegular(target, MANIFEST);
  return { value: validateManifest(JSON.parse(file.bytes.toString())), bytes: file.bytes, mode: file.mode };
}
function defaultDiscoveryRoots(target, hosts) {
  const roots = new Set();
  let current = path.dirname(target);
  for (;;) {
    if (hosts.includes('codex')) roots.add(path.join(current, '.agents', 'skills'));
    if (hosts.includes('claude')) roots.add(path.join(current, '.claude', 'skills'));
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
  if (hosts.includes('codex')) { roots.add(path.join(os.homedir(), '.agents', 'skills')); roots.add(path.join(os.homedir(), '.codex', 'skills')); }
  if (hosts.includes('claude')) roots.add(path.join(os.homedir(), '.claude', 'skills'));
  return [...roots];
}
function discoveredSkills(root, warnings, depth = 0) {
  const stat = lstat(root);
  if (!stat) return [];
  if (stat.isSymbolicLink()) { warnings.push(`Discovery skipped symlink: ${root}`); return []; }
  if (!stat.isDirectory() || depth > 8) return [];
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) results.push(...discoveredSkills(file, warnings, depth + 1));
    else if (entry.name === 'SKILL.md' && entry.isFile()) {
      try {
        const text = fs.readFileSync(file, 'utf8'), match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
        if (!match) continue;
        const parsed = parseDocument(match[1]);
        if (parsed.errors.length) { warnings.push(`Discovery skipped invalid metadata: ${file}`); continue; }
        const name = parsed.toJSON()?.name;
        if (typeof name === 'string') results.push({ name, filename: file });
      } catch (error) { warnings.push(`Discovery could not read: ${file}: ${error.message}`); }
    } else if (entry.isSymbolicLink()) warnings.push(`Discovery skipped symlink: ${file}`);
  }
  return results;
}
function discoveryConflicts(target, discovery, warnings) {
  const conflicts = [];
  for (const root of discovery.roots) for (const found of discoveredSkills(root, warnings)) if (discovery.names.includes(found.name)) {
    const relative = path.relative(target, found.filename).split(path.sep).join('/');
    if (!discovery.ownedEntrypoints.includes(relative)) conflicts.push({ path: found.filename, reason: `Skill name collision: ${found.name}` });
  }
  return conflicts;
}
export function verifyInstallPreconditions(plan) {
  for (const condition of plan.directoryPreconditions) {
    const stat = inspect(plan.target, condition.path);
    if (Boolean(stat) !== condition.present || (stat && !stat.isDirectory())) throw new Error(`Directory changed since planning: ${condition.path}`);
  }
  const conflicts = discoveryConflicts(plan.target, plan.discovery, []);
  if (conflicts.length) throw new Error(conflicts.map(item => `${item.reason}: ${item.path}`).join('; '));
}
export function buildInstallPlan({ sourceRoot, target: targetInput, host, agents, workflows, skills, discoveryRoots } = {}) {
  const target = fs.realpathSync(targetInput);
  if (!fs.statSync(target).isDirectory()) throw new Error('Target must be an existing directory');
  const conflicts = [], warnings = [], operations = [];
  for (const name of [LOCK, JOURNAL]) if (inspect(target, name)) conflicts.push({ path: name, reason: 'Incomplete or active installation; inspect and recover first' });
  const previous = readManifest(target), catalog = loadCatalog(sourceRoot);
  if (agents === undefined && workflows === undefined && skills === undefined && previous) ({ agents, workflows, skills } = previous.value.selection);
  const bundle = generateBundle(catalog, { host, agents, workflows, skills });
  const oldFiles = new Map(previous?.value.files.map(file => [file.path, file]) ?? []);
  const oldPackages = new Set(previous?.value.package_roots ?? []);
  for (const root of bundle.packageRoots) {
    const stat = inspect(target, root);
    if (stat && (!stat.isDirectory() || !oldPackages.has(root))) conflicts.push({ path: root, reason: 'Unowned package root already exists' });
  }
  for (const name of sorted(new Set([...oldFiles.keys(), ...bundle.files.keys()]))) {
    if (!allowedFile(name)) throw new Error(`Protected destination: ${name}`);
    const next = bundle.files.get(name), old = oldFiles.get(name), stat = inspect(target, name);
    const current = stat?.isFile() ? readRegular(target, name) : undefined;
    let reason;
    if (stat && !stat.isFile()) reason = 'Destination is not a regular file';
    else if (current && !old) reason = 'Unowned file already exists';
    else if (current && (sha256(current.bytes) !== old.sha256 || current.mode !== old.mode)) reason = 'Owned file has local modifications';
    if (reason) conflicts.push({ path: name, reason });
    const action = reason ? 'conflict' : next ? !current ? 'create' : sha256(current.bytes) === sha256(next.bytes) && current.mode === next.mode ? 'unchanged' : 'update' : current ? 'remove' : 'unchanged';
    operations.push({ action, path: name, before: current ?? null, after: next ?? null });
  }
  const hostSkillRoots = bundle.hosts.map(h => path.join(target, h === 'codex' ? '.agents/skills' : '.claude/skills'));
  const discovery = { roots: [...new Set([...hostSkillRoots, ...(discoveryRoots ?? defaultDiscoveryRoots(target, bundle.hosts))])], names: [...bundle.resolved.skills, ...bundle.selection.workflows], ownedEntrypoints: [...bundle.files.keys()].filter(name => oldFiles.has(name) && name.endsWith('/SKILL.md')) };
  conflicts.push(...discoveryConflicts(target, discovery, warnings));
  const directories = parentDirectories([...bundle.files.keys(), MANIFEST]);
  const directoryPreconditions = directories.map(name => ({ path: name, present: Boolean(inspect(target, name)) }));
  const neededDirectories = new Set(directories);
  const removedDirectories = (previous?.value.created_directories ?? []).filter(dir => !neededDirectories.has(dir)).sort((a, b) => b.length - a.length);
  const created = new Set(previous?.value.created_directories.filter(dir => neededDirectories.has(dir) && inspect(target, dir)?.isDirectory()) ?? []);
  for (const dir of directories) if (!inspect(target, dir)) created.add(dir);
  const manifest = { schema_version: 1, toolkit: 'tal-skills', generator_version: 1, source_digest: bundle.sourceDigest, hosts: bundle.hosts, selection: bundle.selection,
    files: [...bundle.files].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode, kind: file.kind, source: file.source })), package_roots: bundle.packageRoots, created_directories: sorted(created) };
  validateManifest(manifest);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  operations.push({ path: MANIFEST, action: !previous ? 'create' : previous.bytes.equals(manifestBytes) ? 'unchanged' : 'update', before: previous ?? null, after: { bytes: manifestBytes, mode: 0o644 } });
  operations.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return { schema_version: 1, target, hosts: bundle.hosts, selection: bundle.selection, resolved: bundle.resolved, operations, conflicts, warnings, directories, directoryPreconditions, discovery, removedDirectories, previous, manifest };
}
export function publicPlan(plan) {
  return { schema_version: 1, target: plan.target, hosts: plan.hosts, selection: plan.selection, resolved: plan.resolved, operations: plan.operations.map(({ action, path: name }) => ({ action, path: name })), conflicts: plan.conflicts, warnings: plan.warnings,
    native_execution: 'not-run; installation is distinct from native host execution' };
}
