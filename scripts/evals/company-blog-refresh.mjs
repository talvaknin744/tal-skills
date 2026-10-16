#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chmod, copyFile, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPO, EVALUATION_SUITES, canonical, copySnapshot, freezeCandidates,
  inventory, runnerInputs, safeRelative, sha256, treeDigest,
} from './lib.mjs';

const execFileAsync = promisify(execFile);
export const REFRESH_SUITES = {
  'company-blog-refresh-regression': {
    'performance-diagnosis': ['skills/performance/performance-diagnosis', 'evals/performance-diagnosis/cases.json'],
    'database-performance': ['skills/performance/database-performance', 'evals/database-performance/cases.json'],
  },
  'company-blog-refresh-trace': {
    'performance-diagnosis': ['skills/performance/performance-diagnosis', 'evals/performance-diagnosis/cases-v2-trace-evidence.json'],
  },
  'company-blog-refresh-pooler': {
    'database-performance': ['skills/performance/database-performance', 'evals/database-performance/cases-v2-pooler-compatibility.json'],
  },
  'company-blog-refresh-agent': {
    'agent-evaluation': ['skills/engineering/agent-evaluation', 'evals/agent-evaluation/cases.json'],
  },
  'company-blog-refresh-registry-regression': {
    'messaging-reliability': ['skills/engineering/messaging-reliability', 'evals/messaging-reliability/cases.json'],
  },
  'company-blog-refresh-registry': {
    'messaging-reliability': ['skills/engineering/messaging-reliability', 'evals/messaging-reliability/cases-v2-registry-identity.json'],
  },
  'company-blog-refresh-netflix-query-freshness': {
    'concurrency-correctness': ['skills/engineering/concurrency-correctness', 'evals/distributed-correctness/query-freshness-cases-r02.json'],
  },
  'company-blog-refresh-netflix-data-gates': {
    'microservice-testing': ['skills/engineering/microservice-testing', 'evals/microservice-testing/cases-v2-data-gates.json'],
  },
  'company-blog-refresh-netflix-cache-edit-scope': {
    'concurrency-correctness': ['skills/engineering/concurrency-correctness', 'evals/distributed-correctness/cache-fill-invalidation-cases-r02.json'],
  },
};

export function registerRefreshSuites(definitions = REFRESH_SUITES) {
  for (const [suite, skills] of Object.entries(definitions)) {
    if (Object.hasOwn(EVALUATION_SUITES, suite)) throw new Error(`Evaluation suite already exists: ${suite}`);
    EVALUATION_SUITES[suite] = Object.fromEntries(Object.entries(skills).map(([skill, [source, corpus]]) => {
      safeRelative(source); safeRelative(corpus);
      return [skill, [source, path.posix.dirname(corpus)]];
    }));
  }
}

export async function stageRefresh({ repo = REPO, destination, definitions = REFRESH_SUITES }) {
  repo = await realpath(repo);
  destination = path.resolve(destination);
  destination = path.join(await realpath(path.dirname(destination)), path.basename(destination));
  if (destination === repo || destination.startsWith(repo + path.sep)) throw new Error('Stage refresh evidence outside the repository');
  await mkdir(destination); // Each staging attempt has a fresh immutable root.
  const inputs = await runnerInputs(repo);
  let sourceGitHead = null;
  try { sourceGitHead = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repo, timeout: 10000 })).stdout.trim(); } catch { /* Snapshot bytes remain authoritative. */ }
  const suites = {};
  for (const [suite, skills] of Object.entries(definitions)) {
    safeRelative(suite);
    const view = path.join(destination, 'views', suite);
    const records = [...inputs.runner, ...inputs.dependencies];
    const corpusAliases = [];
    for (const [skill, [source, corpus]] of Object.entries(skills)) {
      const packageFiles = await inventory(path.join(repo, source));
      records.push(...packageFiles.map(entry => ({ ...entry, path: `${source}/${entry.path}` })));
      const body = await readFile(path.join(repo, corpus));
      const corpusInfo = await lstat(path.join(repo, corpus));
      if (!corpusInfo.isFile() || corpusInfo.isSymbolicLink()) throw new Error(`Invalid corpus: ${corpus}`);
      records.push({ path: corpus, sha256: sha256(body), mode: corpusInfo.mode & 0o777 });
      const cases = JSON.parse(body);
      const corpusRoot = path.posix.dirname(corpus);
      const viewCorpus = `${corpusRoot}/cases.json`;
      if (!Array.isArray(cases.cases) || !cases.cases.length) throw new Error(`Empty corpus: ${corpus}`);
      const fixtures = new Set();
      for (const item of cases.cases) {
        if (item.skill !== undefined && item.skill !== skill) continue;
        safeRelative(item.fixture_dir);
        if (!item.fixture_dir.startsWith(`${corpusRoot}/fixtures/`)) throw new Error(`Fixture outside corpus: ${item.id}`);
        fixtures.add(item.fixture_dir);
      }
      for (const fixture of fixtures) records.push(...(await inventory(path.join(repo, fixture))).map(entry => ({ ...entry, path: `${fixture}/${entry.path}` })));
      corpusAliases.push({ source_path: corpus, view_path: viewCorpus, sha256: sha256(body) });
    }
    const unique = [...new Map(records.map(entry => [entry.path, entry])).values()];
    const temporary = path.join(destination, 'inputs', suite);
    await copySnapshot(repo, temporary, unique);
    const aliasesBySource = new Map(corpusAliases.map(alias => [alias.source_path, alias]));
    const expectedView = unique.map(entry => ({ ...entry, path: aliasesBySource.get(entry.path)?.view_path ?? entry.path }));
    if (new Set(expectedView.map(entry => entry.path)).size !== expectedView.length) throw new Error('Runner input collides with corpus alias');
    for (const entry of unique) {
      const target = path.join(view, aliasesBySource.get(entry.path)?.view_path ?? entry.path);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(temporary, entry.path), target);
      await chmod(target, entry.mode);
    }
    if (treeDigest(await inventory(view)) !== treeDigest(expectedView)) throw new Error('Source view differs from original inputs and declared corpus aliases');
    const frozen = await freezeCandidates(view, suite);
    frozen.source_git_head = sourceGitHead;
    frozen.identity_note = 'Complete package bytes are authoritative. Source HEAD is origin context. Supplemental corpora are exact byte aliases in an external source view, with their origin mapping retained by the staging manifest.';
    const freezePath = `freezes/${suite}.json`;
    await mkdir(path.join(destination, 'freezes'), { recursive: true });
    await writeFile(path.join(destination, freezePath), JSON.stringify(frozen, null, 2) + '\n', { flag: 'wx' });
    suites[suite] = {
      source_view: `views/${suite}`, freeze_path: freezePath, freeze_sha256: frozen.freeze_sha256,
      original_inputs: unique, original_input_tree_sha256: treeDigest(unique), corpus_aliases: corpusAliases,
      source_view_files: await inventory(view),
      candidate_hashes: Object.fromEntries(Object.entries(frozen.candidates).map(([skill, item]) => [skill, item.tree_sha256])),
      case_ids: Object.fromEntries(Object.entries(frozen.corpora).map(([skill, items]) => [skill, Object.keys(items)])),
    };
  }
  const manifest = {
    format_version: 1, staged_at: new Date().toISOString(), source_git_head: sourceGitHead,
    candidate_commit: null, identity_note: 'Origin HEAD is context only. Complete package, case, fixture and runner hashes identify the uncommitted candidate.',
    source_runner_tree_sha256: inputs.runner_tree_sha256, source_dependencies_tree_sha256: inputs.dependencies_tree_sha256,
    suites, manifest_sha256: sha256(canonical(suites)),
  };
  await writeFile(path.join(destination, 'stage-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return manifest;
}

async function main() {
  registerRefreshSuites();
  if (process.argv[2] !== 'stage') {
    await import('./cli.mjs');
    return;
  }
  const args = process.argv.slice(3), options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--repo', '--out'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw new Error('Usage: company-blog-refresh.mjs stage --out <fresh external directory> [--repo <source>]');
    options[args[i]] = args[i + 1];
  }
  if (!options['--out']) throw new Error('--out is required');
  const manifest = await stageRefresh({ repo: options['--repo'] ?? REPO, destination: options['--out'] });
  console.log(JSON.stringify({ manifest_sha256: manifest.manifest_sha256, suites: Object.keys(manifest.suites), destination: path.resolve(options['--out']) }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
