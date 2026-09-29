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

function checkBindings(manifest, files, summary) {
  const json = name => files.has(name) ? JSON.parse(files.get(name).bytes.toString('utf8')) : null;
  const match = (actual, expected, context) => { equal(actual, expected, context); summary.source_bindings_checked++; };
  const originalHash = (name, expected) => {
    relativePath(name);
    if (!files.has(name)) throw new Error(`Source binding has no declared artifact: ${name}`);
    match(digest(expected, name), files.get(name).original_sha256, name);
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
  // Full native dependency trees and runtime scratch files are intentionally not
  // published. Check the declared source files, not an invented complete tree.
  for (const [name] of files) {
    const records = name.startsWith('trial/') ? run?.final_files : name.startsWith('original-project/') ? prepared?.baseline : null;
    if (!records) continue;
    const source = name.slice(name.indexOf('/') + 1), entry = records.find(item => item.path === source);
    if (!entry) throw new Error(`Published source absent from recorded inventory: ${name}`);
    originalHash(name, entry.sha256);
  }
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
    try { checkBindings(loaded.get(base).manifest, files, summary); }
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
