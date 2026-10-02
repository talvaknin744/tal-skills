#!/usr/bin/env node
// Read-only archive integrity checks; no experiment execution or rubric grading.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('../evals/engineering-toolkit/runs/', import.meta.url));
const isManifest = name => name === 'archive-manifest.json' || name.endsWith('-supplement-manifest.json');
const IDENTITY_FIELDS = ['run_id', 'run_evidence_sha256', 'final_workspace_tree_sha256', 'case_id', 'candidate_tree_sha256', 'rubric_sha256'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
// The evaluation runner freezes rubric hashes with JSON.stringify in source order.
const canonical = value => JSON.stringify(value);
const SOURCE_TREES = ['candidate', 'original-project', 'final-project', 'trial', 'candidate-dependencies'];
const ordered = records => [...records].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

function inventory(records, context, requireModes = false) {
  if (records === undefined) return undefined;
  if (!Array.isArray(records)) throw new Error(`Invalid source inventory: ${context}`);
  const seen = new Set();
  return records.map(entry => {
    const name = relativePath(entry?.path);
    if (seen.has(name)) throw new Error(`Duplicate source inventory path: ${context}/${name}`);
    seen.add(name);
    const record = { path: name, sha256: digest(entry.sha256, `${context}/${name}`) };
    if (entry.mode !== undefined || requireModes) {
      if (!Number.isInteger(entry.mode) || entry.mode < 0 || entry.mode > 0o777) throw new Error(`Invalid source mode: ${context}/${name}`);
      record.mode = entry.mode;
    }
    return record;
  });
}
function sourcePaths(root, tree) {
  const directory = path.join(root, tree);
  if (!fs.existsSync(directory)) return [];
  const found = [];
  function visit(current, prefix = '') {
    if (!fs.lstatSync(current).isDirectory()) throw new Error(`Not a source directory: ${tree}/${prefix}`);
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      relativePath(name);
      if (item.isDirectory()) visit(path.join(current, item.name), name);
      else if (item.isFile()) found.push(`${tree}/${name}`);
      else throw new Error(`Unsupported source path: ${tree}/${name}`);
    }
  }
  visit(directory);
  return found.sort();
}

function relativePath(value) {
  if (typeof value !== 'string' || !value || /[\\\x00-\x1f]/.test(value) || /^[A-Za-z]:/.test(value)
    || path.posix.isAbsolute(value) || value.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe archive path: ${JSON.stringify(value)}`);
  }
  return value;
}
function digest(value, context) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`Invalid SHA256: ${context}`);
  return value;
}
function equal(actual, expected, context) {
  if (actual !== expected) throw new Error(`Binding mismatch: ${context}`);
}
function readFile(root, relative) {
  const segments = relativePath(relative).split('/');
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Symlink refused: ${relative}`);
    if (index < segments.length - 1 ? !stat.isDirectory() : !stat.isFile()) throw new Error(`Not a regular archive path: ${relative}`);
  }
  const fd = fs.openSync(current, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try { return fs.readFileSync(fd); } finally { fs.closeSync(fd); }
}
function discover(root, prefix = '') {
  const found = [];
  for (const item of fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isSymbolicLink()) throw new Error(`Symlink refused: ${relative}`);
    if (item.isDirectory()) found.push(...discover(root, relative));
    else if (isManifest(item.name)) found.push(relative);
  }
  return found;
}

function checkBindings(manifest, files, summary, archiveRoot) {
  const json = name => files.has(name) ? JSON.parse(files.get(name).bytes.toString('utf8')) : null;
  const match = (actual, expected, context) => { equal(actual, expected, context); summary.source_bindings_checked++; };
  const boundArtifacts = new Set();
  const originalHash = (name, expected) => {
    relativePath(name);
    if (!files.has(name)) throw new Error(`Source binding has no declared artifact: ${name}`);
    match(digest(expected, name), files.get(name).original_sha256, name);
    boundArtifacts.add(name);
  };
  const run = json('evidence/run.json'), prepared = json('evidence/prepared.json');
  if (manifest.source_run_evidence_sha256 !== undefined) {
    if (!run) throw new Error('Source run binding requires evidence/run.json');
    match(digest(manifest.source_run_evidence_sha256, 'source_run_evidence_sha256'), run.run_evidence_sha256, 'manifest/source run');
  }
  if (run?.run_id !== undefined && manifest.run_id !== undefined) match(manifest.run_id, run.run_id, 'manifest/run_id');
  if (run?.workflow !== undefined && manifest.workflow !== undefined) match(manifest.workflow, run.workflow, 'manifest/workflow');
  if (prepared && run) match(prepared.workflow, run.workflow, 'prepared/workflow');
  if (files.has('fixture-index.json')) {
    if (!prepared) throw new Error('Archived fixture index requires evidence/prepared.json');
    originalHash('fixture-index.json', prepared.fixture_index_sha256);
  }
  const clarification = json('scoring-clarification.json');
  if (clarification) {
    originalHash('independent-score.json', clarification.original_score_sha256);
    if (clarification.run_sha256 !== undefined) originalHash('evidence/run.json', clarification.run_sha256);
  }
  for (const name of ['score.json', 'adjudicated-score.json', 'independent-score.json']) {
    const score = json(name);
    if (!score) continue;
    if (!run) throw new Error(`${name} requires evidence/run.json`);
    for (const key of IDENTITY_FIELDS) if (run[key] !== undefined) match(score[key], run[key], `${name}/${key}`);
    if (score.workflow !== undefined) match(score.workflow, run.workflow, `${name}/workflow`);
    for (const key of ['source_digest', 'fixture_index_sha256']) if (score[key] !== undefined) {
      if (!prepared) throw new Error(`${name}/${key} requires evidence/prepared.json`);
      match(score[key], prepared[key], `${name}/${key}`);
    }
    for (const [filename, expected] of Object.entries(score.bindings ?? {})) originalHash(filename, expected);
    for (const [filename, expected] of Object.entries(score.evidence_sha256 ?? {})) originalHash(`evidence/${relativePath(filename)}`, expected);
    for (const [filename, expected] of Object.entries(score.candidate_sha256 ?? score.candidate?.files ?? {})) originalHash(`trial/${relativePath(filename)}`, expected);
    const rubric = json('rubric.json');
    if (rubric && score.rubric_sha256 !== undefined) {
      match(score.case_id, rubric.case_id, `${name}/rubric case`);
      match(score.rubric_sha256, rubric.rubric_sha256, `${name}/rubric identity`);
      match(hash(canonical(rubric.rubric)), rubric.rubric_sha256, 'rubric content');
    }
  }
  for (const entry of run?.evidence_files ?? []) originalHash(`evidence/${relativePath(entry.path)}`, entry.sha256);
  const declared = manifest.complete_source_trees === undefined ? [] : manifest.complete_source_trees;
  if (!Array.isArray(declared) || new Set(declared).size !== declared.length
      || declared.some(tree => !SOURCE_TREES.includes(tree))) throw new Error('Invalid complete_source_trees declaration');
  const source = json('evidence/manifest.json'), changes = json('evidence/workspace-changes.json');
  const candidate = inventory(source?.candidate_files, 'candidate_files', true);
  const fixture = inventory(source?.fixture_files, 'fixture_files', true);
  const before = inventory(source?.workspace_before, 'workspace_before', true);
  const after = inventory(changes?.workspace_after, 'workspace_after', true);
  const baseline = inventory(prepared?.baseline, 'prepared.baseline');
  const runFinal = inventory(run?.final_files, 'run.final_files');
  let linuxFinal;
  if (files.has('evidence/linux-host.json')) {
    if (!boundArtifacts.has('evidence/linux-host.json')) throw new Error('Linux final inventory requires a source hash binding: evidence/linux-host.json');
    linuxFinal = inventory(json('evidence/linux-host.json')?.final_files, 'linux-host.final_files', true);
    if (linuxFinal === undefined) throw new Error('Linux host evidence requires recorded inventory: linux-host.final_files');
    if (runFinal !== undefined) match(canonical(ordered(runFinal)), canonical(ordered(linuxFinal)), 'run/linux-host final inventory');
  }
  const final = runFinal ?? linuxFinal;
  const subset = (records, prefix) => records?.filter(entry => entry.path.startsWith(prefix)).map(entry => ({ ...entry, path: entry.path.slice(prefix.length) }));
  const treeHash = records => hash(canonical(ordered(records)));
  const bindTree = (records, expected, context) => {
    if (records !== undefined && expected !== undefined) match(treeHash(records), digest(expected, context), context);
  };
  bindTree(candidate, source?.candidate_tree_sha256, 'manifest/candidate tree');
  bindTree(candidate, run?.candidate_tree_sha256, 'run/candidate tree');
  bindTree(fixture, source?.fixture_tree_sha256, 'manifest/fixture tree');
  bindTree(fixture, run?.fixture_tree_sha256, 'run/fixture tree');
  bindTree(before, source?.workspace_before_sha256, 'manifest/workspace before');
  bindTree(after, run?.final_workspace_tree_sha256, 'run/workspace after');
  if (before && fixture) match(canonical(ordered(subset(before, 'project/'))), canonical(ordered(fixture)), 'workspace before/fixture inventory');
  if (before && candidate && run?.skill !== undefined) {
    relativePath(run.skill);
    match(canonical(ordered(subset(before, `.agents/skills/${run.skill}/`))), canonical(ordered(candidate)), 'workspace before/candidate inventory');
  }
  // Native archives separate installed dependency directories from project
  // files. Older partial archives still bind every source file they publish.
  const isDependency = entry => ['.agents/', '.codex/', '.tal-skills/'].some(prefix => entry.path.startsWith(prefix));
  const nativeProject = records => records?.filter(entry => !isDependency(entry));
  const inventories = {
    candidate,
    'original-project': fixture ?? baseline,
    'final-project': subset(after, 'project/'),
    trial: final,
    'candidate-dependencies': final?.filter(isDependency),
  };
  for (const tree of SOURCE_TREES) {
    const complete = declared.includes(tree);
    const records = complete && tree === 'trial' ? nativeProject(final)
      : complete && tree === 'original-project' && !fixture ? nativeProject(baseline) : inventories[tree];
    if (complete && records === undefined) throw new Error(`Complete source tree requires recorded inventory: ${tree}`);
    if (records === undefined) continue;
    const expected = new Map(records.map(entry => [`${tree}/${entry.path}`, entry]));
    const published = [...files.keys()].filter(name => name.startsWith(`${tree}/`)).sort();
    for (const name of published) {
      if (!expected.has(name)) throw new Error(`Published source absent from recorded inventory: ${name}`);
      originalHash(name, expected.get(name).sha256);
    }
    if (complete) {
      const paths = [...expected.keys()].sort();
      match(canonical(published), canonical(paths), `complete source tree/${tree}`);
      match(canonical(sourcePaths(archiveRoot, tree)), canonical(paths), `complete source directory/${tree}`);
    }
  }
  if (declared.includes('candidate') || (declared.includes('original-project') && source)) {
    if (!source || !run || !before) throw new Error('Complete single-skill inputs require manifest, run and before inventories');
    digest(source.workspace_before_sha256, 'manifest/before');
    if (declared.includes('candidate')) {
      if (typeof run.skill !== 'string') throw new Error('Complete candidate requires run.skill');
      digest(source.candidate_tree_sha256, 'manifest/candidate');
      digest(run.candidate_tree_sha256, 'run/candidate');
    }
    if (declared.includes('original-project')) {
      digest(source.fixture_tree_sha256, 'manifest/fixture');
      digest(run.fixture_tree_sha256, 'run/fixture');
    }
  }
  if (declared.includes('final-project')) digest(run?.final_workspace_tree_sha256, 'run/after');
  if (declared.some(tree => ['trial', 'candidate-dependencies'].includes(tree)) && !baseline) throw new Error('Complete native sources require prepared.baseline');
}

/** Validate present manifests without imposing a final experiment count. */
export function checkEvaluationEvidence(root = DEFAULT_ROOT) {
  root = fs.realpathSync(root);
  const manifests = discover(root);
  if (!manifests.length) throw new Error(`No evaluation archive manifests found: ${root}`);
  const summary = { manifests_checked: 0, published_artifacts_checked: 0, source_bindings_checked: 0 };
  const loaded = new Map();
  for (const relative of manifests) {
    try {
      const manifest = JSON.parse(readFile(root, relative).toString('utf8'));
      if (manifest.schema_version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Expected schema_version 1 and nonempty files[]');
      const base = path.dirname(relative), files = new Map();
      for (const entry of manifest.files) {
        const filename = relativePath(entry.path);
        if (files.has(filename)) throw new Error(`Duplicate manifest entry: ${filename}`);
        digest(entry.original_sha256, `${filename}/original`);
        digest(entry.published_sha256, `${filename}/published`);
        if (typeof entry.transformed !== 'boolean' || entry.transformed !== (entry.original_sha256 !== entry.published_sha256)) throw new Error(`Inconsistent transformation marker: ${filename}`);
        const bytes = readFile(root, path.posix.join(base, filename));
        if (hash(bytes) !== entry.published_sha256) throw new Error(`Published SHA256 mismatch: ${filename}`);
        files.set(filename, { ...entry, bytes });
        summary.published_artifacts_checked++;
      }
      loaded.set(relative, { manifest, files });
      summary.manifests_checked++;
    } catch (error) { throw new Error(`${relative}: ${error.message}`, { cause: error }); }
  }
  const groups = new Map();
  for (const [relative, { manifest, files }] of loaded) {
    try {
      const base = path.posix.join(path.dirname(relative), 'archive-manifest.json');
      if (!loaded.has(base)) throw new Error('Supplement requires a separate archive-manifest.json');
      if (relative !== base) {
        if (manifest.complete_source_trees !== undefined) throw new Error('Only the base archive may declare complete_source_trees');
        equal(hash(readFile(root, base)), digest(manifest.base_manifest_sha256, 'base_manifest_sha256'), 'supplement/base manifest');
        summary.source_bindings_checked++;
        for (const key of ['run_id', 'workflow', 'source_run_evidence_sha256']) if (manifest[key] !== undefined) equal(manifest[key], loaded.get(base).manifest[key], `supplement/${key}`);
      } else if (manifest.base_manifest_sha256 !== undefined) throw new Error('Base archive cannot reference itself as a supplement');
      if (!groups.has(base)) groups.set(base, new Map());
      const merged = groups.get(base);
      for (const [name, entry] of files) {
        if (merged.has(name)) equal(entry.original_sha256, merged.get(name).original_sha256, `supplement/${name}`);
        merged.set(name, entry);
      }
    } catch (error) { throw new Error(`${relative}: ${error.message}`, { cause: error }); }
  }
  // Scores can bind artifacts added by later supplements. Resolve against the
  // union only after every manifest and its relationship to the base is checked.
  for (const [base, files] of groups) {
    try { checkBindings(loaded.get(base).manifest, files, summary, path.join(root, path.dirname(base))); }
    catch (error) { throw new Error(`${base}: ${error.message}`, { cause: error }); }
  }
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args[0]?.startsWith('--')) throw new Error('Usage: node scripts/check-evaluation-evidence.mjs [archive-root]');
    console.log(`Published evaluation evidence verified: ${JSON.stringify(checkEvaluationEvidence(args[0]))}; experiments were not rerun or graded`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
