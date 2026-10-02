import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, readdir, lstat, readFile, writeFile, chmod, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const execFileAsync = promisify(execFile);
export const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const DEFAULT_CODEX = '/Applications/ChatGPT.app/Contents/Resources/codex';
export const SKILLS = {
  'python-backend': 'skills/languages/python-backend',
  'typescript-backend': 'skills/languages/typescript-backend',
  'go-backend': 'skills/languages/go-backend',
  'messaging-reliability': 'skills/messaging/messaging-reliability',
  'infrastructure-change-safety': 'skills/infrastructure/infrastructure-change-safety',
  'recovery-validation': 'skills/reliability/recovery-validation',
  'failure-oriented-testing': 'skills/testing/failure-oriented-testing',
  'code-and-docs-cleanup': 'skills/quality/code-and-docs-cleanup',
  'mcp-engineering': 'skills/protocols/mcp-engineering',
  'a2a-engineering': 'skills/protocols/a2a-engineering',
  'technical-deprecation': 'skills/engineering/technical-deprecation',
  'background-maintenance': 'skills/engineering/background-maintenance',
  'stream-processing-design': 'skills/messaging/stream-processing-design',
};
export const EVALUATION_SUITES = {
  'worker-rollout-regression': {
    'graceful-draining': ['skills/engineering/graceful-draining', 'evals/distributed-correctness'],
    'concurrency-correctness': ['skills/engineering/concurrency-correctness', 'evals/distributed-correctness'],
    'infrastructure-change-safety': ['skills/infrastructure/infrastructure-change-safety', 'evals/infrastructure-change-safety'],
    'overload-control': ['skills/performance/overload-control', 'evals/overload-control'],
    'microservice-operations': ['skills/engineering/microservice-operations', 'evals/microservice-operations'],
  },
  'worker-rollout-integration': {
    'concurrency-correctness': ['skills/engineering/concurrency-correctness', 'evals/worker-rollout-integration/correctness'],
    'infrastructure-change-safety': ['skills/infrastructure/infrastructure-change-safety', 'evals/worker-rollout-integration/schema'],
    'overload-control': ['skills/performance/overload-control', 'evals/worker-rollout-integration/fairness'],
    'microservice-operations': ['skills/engineering/microservice-operations', 'evals/worker-rollout-integration/deadlines'],
  },
};
export function evaluationSuite(name = 'engineering-toolkit') {
  if (name === 'engineering-toolkit') return Object.fromEntries(Object.entries(SKILLS).map(([skill, source]) => [skill, [source, `evals/${skill}`]]));
  if (!Object.hasOwn(EVALUATION_SUITES, name)) throw new Error(`Unknown evaluation suite: ${name}`);
  return EVALUATION_SUITES[name];
}
// Add execution metadata absent from this legacy case without rewriting its
// original prompt, rubric or fixture. The selected controls enter the freeze.
function legacyExecutionControls(suite, skill, item) {
  if (suite !== 'worker-rollout-regression' || skill !== 'concurrency-correctness'
      || item.id !== 'cache-fill-invalidation') return undefined;
  if (item.editable_files !== undefined || item.verification_argv !== undefined) {
    throw new Error('Legacy execution adapter conflicts with declared case controls');
  }
  return {
    editable_files: ['service.mjs'], verification_argv: ['node', 'verify.mjs'],
    derivation: 'Original prompt and scope rubric authorize only service.mjs and require the supplied node verify.mjs; raw case and rubric remain unchanged.',
  };
}
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const canonical = value => JSON.stringify(value);
export const treeDigest = records => sha256(canonical([...records].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))));
export function safeRelative(value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.includes('\\')
      || value.split('/').some(part => part === '..' || part === '.' || !part)) {
    throw new Error(`Unsafe relative path: ${value}`);
  }
  return value;
}
export async function inventory(directory) {
  const base = await realpath(directory);
  const records = [];
  async function visit(relative) {
    const current = path.join(base, relative);
    for (const name of (await readdir(current)).sort()) {
      const next = relative ? `${relative}/${name}` : name;
      safeRelative(next);
      const filename = path.join(base, next);
      const info = await lstat(filename);
      if (info.isSymbolicLink()) throw new Error(`Symlink is not a snapshot input: ${next}`);
      if (info.isDirectory()) await visit(next);
      else if (info.isFile()) records.push({ path: next, sha256: sha256(await readFile(filename)), mode: info.mode & 0o777 });
      else throw new Error(`Unsupported snapshot entry: ${next}`);
    }
  }
  await visit('');
  return records.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
export async function copySnapshot(source, destination, records) {
  await mkdir(destination, { recursive: true });
  for (const entry of records) {
    safeRelative(entry.path);
    const target = path.join(destination, entry.path);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(source, entry.path), target);
    await chmod(target, entry.mode);
  }
  const copied = await inventory(destination);
  if (treeDigest(copied) !== treeDigest(records)) throw new Error('Snapshot changed while copying');
}
export async function loadCase(repo, skill, id, suite = 'engineering-toolkit') {
  const registry = evaluationSuite(suite);
  if (!Object.hasOwn(registry, skill)) throw new Error(`Unknown skill: ${skill}`);
  const corpusRoot = registry[skill][1];
  const corpusPath = path.join(repo, corpusRoot, 'cases.json');
  const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
  const item = corpus.cases.find(entry => entry.id === id);
  if (!item) throw new Error(`Unknown case: ${skill}/${id}`);
  if (item.skill !== undefined && item.skill !== skill) throw new Error('Case belongs to a different skill');
  safeRelative(item.fixture_dir);
  if (!item.fixture_dir.startsWith(`${corpusRoot}/fixtures/`)) throw new Error('Fixture outside its skill corpus');
  const files = await inventory(path.join(repo, item.fixture_dir));
  if (canonical(files.map(entry => entry.path).sort()) !== canonical([...item.fixtures].sort())) throw new Error('Fixture declaration differs from actual files');
  return { item, files, corpusPath };
}
export async function runnerInputs(repo) {
  const runner = (await inventory(path.join(repo, 'scripts/evals'))).map(entry => ({ ...entry, path: `scripts/evals/${entry.path}` }));
  const dependencies = [];
  for (const filename of ['package.json', 'package-lock.json']) {
    const info = await lstat(path.join(repo, filename));
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Invalid runner dependency: ${filename}`);
    dependencies.push({ path: filename, sha256: sha256(await readFile(path.join(repo, filename))), mode: info.mode & 0o777 });
  }
  return { runner, dependencies, runner_tree_sha256: treeDigest(runner), dependencies_tree_sha256: treeDigest(dependencies) };
}
export async function freezeCandidates(repo = REPO, suite = 'engineering-toolkit') {
  const registry = evaluationSuite(suite);
  const runner_inputs = await runnerInputs(repo);
  const candidates = {};
  for (const [name, [relative]] of Object.entries(registry)) {
    const records = await inventory(path.join(repo, relative));
    const entrypoint = await readFile(path.join(repo, relative, 'SKILL.md'), 'utf8');
    const frontmatter = entrypoint.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const meta = frontmatter && YAML.parse(frontmatter[1]);
    if (meta?.name !== name || typeof meta.description !== 'string') throw new Error(`Invalid skill metadata: ${name}`);
    candidates[name] = { source_path: relative, description: meta.description, files: records, tree_sha256: treeDigest(records) };
  }
  const corpora = {};
  for (const [name, [, corpusRoot]] of Object.entries(registry)) {
    const corpus = JSON.parse(await readFile(path.join(repo, corpusRoot, 'cases.json'), 'utf8'));
    corpora[name] = {};
    for (const item of corpus.cases.filter(entry => entry.skill === undefined || entry.skill === name)) {
      if (Object.hasOwn(corpora[name], item.id)) throw new Error(`Duplicate case: ${name}/${item.id}`);
      const { files } = await loadCase(repo, name, item.id, suite);
      const executionControls = legacyExecutionControls(suite, name, item);
      corpora[name][item.id] = {
        case_sha256: sha256(canonical(item)), prompt_sha256: sha256(item.prompt),
        rubric_sha256: sha256(canonical(item.rubric)), fixture_tree_sha256: treeDigest(files),
        ...(executionControls === undefined ? {} : { execution_controls: executionControls }),
      };
    }
  }
  let sourceGitHead = null;
  try { sourceGitHead = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim(); } catch { /* Content hashes remain authoritative. */ }
  const suiteIdentity = suite === 'engineering-toolkit' ? {} : { evaluation_suite: suite };
  return {
    ...suiteIdentity,
    format_version: 1, frozen_at: new Date().toISOString(), source_git_head: sourceGitHead,
    candidate_commit: null,
    identity_note: 'The exact file snapshot is authoritative; source_git_head is context, not an assertion that uncommitted candidate content belongs to that commit.',
    tree_serialization: 'JSON.stringify of records sorted by relative path in JavaScript UTF-16 code-unit order, each with path, sha256 and mode in that key order; SHA-256 of UTF-8 bytes.',
    candidates, corpora, runner_inputs,
    freeze_sha256: sha256(canonical({ ...suiteIdentity, candidates, corpora, runner_inputs })),
  };
}
export function validateFreeze(freeze) {
  if (freeze.format_version !== 1 || !freeze.frozen_at || !freeze.candidates || !freeze.corpora) throw new Error('Invalid candidate freeze');
  evaluationSuite(freeze.evaluation_suite);
  const suiteIdentity = freeze.evaluation_suite === undefined ? {} : { evaluation_suite: freeze.evaluation_suite };
  if (freeze.freeze_sha256 !== sha256(canonical({ ...suiteIdentity, candidates: freeze.candidates, corpora: freeze.corpora, runner_inputs: freeze.runner_inputs }))) throw new Error('Freeze manifest digest mismatch');
}
export async function prepareTrial({ repo = REPO, freezePath, skill, caseId, destination }) {
  const freeze = JSON.parse(await readFile(freezePath, 'utf8'));
  validateFreeze(freeze);
  if (canonical(await runnerInputs(repo)) !== canonical(freeze.runner_inputs)) throw new Error('Runner or dependencies changed after freeze');
  const candidate = freeze.candidates[skill];
  const frozenCase = freeze.corpora[skill]?.[caseId];
  if (!candidate || !frozenCase) throw new Error('Candidate/case missing from freeze');
  const { item, files } = await loadCase(repo, skill, caseId, freeze.evaluation_suite);
  const actualFiles = await inventory(path.join(repo, candidate.source_path));
  if (treeDigest(actualFiles) !== candidate.tree_sha256) throw new Error('Candidate changed after freeze');
  if (treeDigest(files) !== frozenCase.fixture_tree_sha256 || sha256(canonical(item)) !== frozenCase.case_sha256) throw new Error('Case or fixture changed after freeze');
  const trial = path.resolve(destination);
  const source = await realpath(repo);
  if (trial === source || trial.startsWith(source + path.sep)) throw new Error('Stage trials outside the repository');
  await mkdir(trial); // Refuse reuse: each trial is a fresh directory.
  const workspace = path.join(trial, 'workspace');
  const before = path.join(trial, 'before');
  const evidence = path.join(trial, 'evidence');
  await mkdir(evidence);
  for (const target of [workspace, before]) {
    await copySnapshot(path.join(repo, item.fixture_dir), path.join(target, 'project'), files);
    await copySnapshot(path.join(repo, candidate.source_path), path.join(target, '.agents', 'skills', skill), actualFiles);
  }
  const initial = await inventory(workspace);
  const executionControls = frozenCase.execution_controls ?? item;
  const run = {
    ...(freeze.evaluation_suite === undefined ? {} : { evaluation_suite: freeze.evaluation_suite }),
    format_version: 1, run_id: path.basename(trial), case_id: caseId, skill,
    trial_kind: 'behavioral', execution_status: 'prepared', rubric_result: 'unscored',
    candidate_commit: freeze.candidate_commit, candidate_tree_sha256: candidate.tree_sha256,
    fixture_tree_sha256: frozenCase.fixture_tree_sha256, prompt_sha256: sha256(composePrompt(item.prompt)), case_prompt_sha256: frozenCase.prompt_sha256,
    rubric_sha256: frozenCase.rubric_sha256, freeze_sha256: freeze.freeze_sha256,
    runner_tree_sha256: freeze.runner_inputs.runner_tree_sha256, dependencies_tree_sha256: freeze.runner_inputs.dependencies_tree_sha256,
    task_mode: item.task_mode, execution_mode: item.execution_mode ?? item.task_mode, activation_expected: item.activation,
    editable_files: (executionControls.editable_files ?? []).map(filename => `project/${safeRelative(filename)}`),
    verification_argv: executionControls.verification_argv ?? null,
    ...(frozenCase.execution_controls === undefined ? {} : { execution_control_derivation: executionControls.derivation }),
    execution_environment_overrides: { PYTHONDONTWRITEBYTECODE: '1' },
    model: null, model_settings: null, model_selection: 'Inherited; no model or reasoning override passed.',
    discovery_mode: 'native repository .agents/skills discovery; body not preloaded',
    capabilities_declared: item.capabilities,
    capability_deviations: [
      'Filesystem read access is not confined to the trial directory; withheld rubrics are not protected by a filesystem jail.',
      'User, system and plugin skills and tools are inherited, so the candidate is not the sole available guidance.',
      'The no-web/external-service restriction is instructed; this runner does not disable every inherited network-capable tool.',
      ...((item.execution_mode ?? item.task_mode) === 'implementation' ? ['Workspace-write mode is requested; effective write enforcement is not independently verified by this runner.'] : []),
    ],
    case_compliant: false,
    sandbox_mode: (item.execution_mode ?? item.task_mode) === 'implementation' ? 'workspace-write' : 'read-only',
    sandbox_mode_verified: false, filesystem_read_isolation: false,
    subagents_disabled_by_invocation: true, host_binary: null, host_version: null,
    activation_observation: { status: 'not_observed', evidence_events: [], note: 'Not yet executed.' },
    trace_kind: 'not_run', artifact_paths: {}, limitations: [],
    elapsed_seconds: null, token_usage: null,
  };
  const manifest = {
    format_version: 1, candidate_files: actualFiles, fixture_files: files,
    workspace_before: initial, workspace_before_sha256: treeDigest(initial),
    prompt_sha256: sha256(composePrompt(item.prompt)), case_prompt_sha256: frozenCase.prompt_sha256, rubric_sha256: frozenCase.rubric_sha256,
    runner_inputs: freeze.runner_inputs,
    candidate_tree_sha256: candidate.tree_sha256, fixture_tree_sha256: frozenCase.fixture_tree_sha256,
  };
  await writeFile(path.join(evidence, 'run.json'), JSON.stringify(run, null, 2) + '\n');
  await writeFile(path.join(evidence, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(path.join(evidence, 'prompt.txt'), composePrompt(item.prompt) + '\n');
  await writeFile(path.join(evidence, 'case-prompt.txt'), item.prompt + '\n');
  // Private control data stays outside workspace; no rubric/answer is copied there.
  await writeFile(path.join(trial, 'control.json'), JSON.stringify({ ...(freeze.evaluation_suite === undefined ? {} : { evaluation_suite: freeze.evaluation_suite }), repo: source, skill, case_id: caseId, frozen_case: frozenCase, freeze_path: path.resolve(freezePath) }, null, 2) + '\n');
  return { trial, workspace, run, manifest };
}
export const composePrompt = prompt => `The supplied project is in ./project. Use relevant installed skills when useful.\n\n${prompt}`;
export function nativeArguments(workspace, prompt, taskMode = 'review') {
  return ['exec', '--ephemeral', '--json', '-s', taskMode === 'implementation' ? 'workspace-write' : 'read-only',
    '-c', 'agents.enabled=false', '-c', 'approval_policy="never"', '--skip-git-repo-check', '-C', workspace,
    prompt];
}
export function parseEvents(stdout, skill, body = '') {
  const events = [], parseErrors = [];
  for (const [index, line] of stdout.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { parseErrors.push(index + 1); }
  }
  const completed = events.filter(event => event.type === 'item.completed').map(event => event.item).filter(Boolean);
  const messages = completed.filter(item => item.type === 'agent_message' && typeof item.text === 'string');
  const tools = completed.filter(item => ['command_execution', 'mcp_tool_call', 'web_search', 'collab_tool_call'].includes(item.type));
  const prefix = body.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '').trim().slice(0, 120);
  const reads = tools.filter(item => item.type === 'command_execution' && item.exit_code === 0
    && (item.command ?? '').includes(`${skill}/SKILL.md`)
    && prefix.length >= 30 && (item.aggregated_output ?? '').includes(prefix));
  const terminal = events.findLast(event => event.type === 'turn.completed' || event.type === 'turn.failed');
  return {
    events, parseErrors, answer: messages.at(-1)?.text ?? '',
    terminal_type: terminal?.type ?? null, usage: terminal?.usage ?? null,
    tool_calls: tools.length,
    activation_observation: {
      status: reads.length ? 'body_read_observed' : 'not_observed',
      evidence_events: reads.map(item => item.id),
      note: reads.length ? 'Successful recorded command names the candidate entrypoint and returns its source body prefix; this is not a proof that every reference was read.' : 'No matching body read in captured events; this is not proof that no unrecorded loading occurred.',
    },
    observed_external_or_delegation_events: tools.filter(item => ['mcp_tool_call', 'web_search', 'collab_tool_call'].includes(item.type)).map(item => ({ id: item.id, type: item.type })),
  };
}
export function fileChanges(before, after) {
  const old = new Map(before.map(entry => [entry.path, entry]));
  const next = new Map(after.map(entry => [entry.path, entry]));
  return [...new Set([...old.keys(), ...next.keys()])].sort().flatMap(filename => {
    const a = old.get(filename), b = next.get(filename);
    return canonical(a) === canonical(b) ? [] : [{ path: filename, before: a ?? null, after: b ?? null }];
  });
}
export async function acquireSlot(base = path.join(os.tmpdir(), 'tal-skills-native-eval-slots')) {
  await mkdir(base, { recursive: true });
  for (let index = 0; index < 2; index++) {
    const slot = path.join(base, `slot-${index}`);
    try { await mkdir(slot); } catch (error) { if (error.code === 'EEXIST') continue; throw error; }
    await writeFile(path.join(slot, 'owner.json'), JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
    return async () => rm(slot, { recursive: true });
  }
  throw new Error('Both native evaluation slots are occupied. Wait for a scheduled slot; stale locks require manual owner verification.');
}
export function captureProcess(binary, args, { cwd, timeoutMs = 180000, killGraceMs = 3000, onStdout, onStderr, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const detached = process.platform !== 'win32';
    const child = spawn(binary, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached });
    let stdout = '', stderr = '', timedOut = false, killTimer;
    const terminate = signal => { try { process.kill(detached ? -child.pid : child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; } };
    const timeout = setTimeout(() => {
      timedOut = true;
      terminate('SIGTERM');
      killTimer = setTimeout(() => terminate('SIGKILL'), killGraceMs);
    }, timeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk; onStdout?.(chunk); });
    child.stderr.on('data', chunk => { stderr += chunk; onStderr?.(chunk); });
    child.on('error', error => { clearTimeout(timeout); clearTimeout(killTimer); reject(error); });
    child.on('close', async (code, signal) => {
      clearTimeout(timeout); clearTimeout(killTimer);
      // A leader may close its pipes while background descendants remain in our group.
      let groupCleanup = detached ? 'group_absent' : 'descendants_unenforced_on_windows';
      if (detached) {
        try {
          process.kill(-child.pid, 0);
          terminate('SIGTERM');
          await new Promise(done => setTimeout(done, killGraceMs));
          terminate('SIGKILL');
          groupCleanup = 'owned_group_signaled_term_then_kill';
        } catch (error) { if (error.code !== 'ESRCH') groupCleanup = `cleanup_error:${error.code}`; }
      }
      resolve({ stdout, stderr, exit_code: code, signal, timed_out: timedOut, owned_group_cleanup: groupCleanup, descendant_limit: 'A child that deliberately creates another process group is outside this group cleanup; no process-container isolation is claimed.' });
    });
  });
}
export async function runTrial({ trial, binary = DEFAULT_CODEX, execute = false, timeoutMs = 180000, slotsPath }) {
  trial = path.resolve(trial);
  const evidence = path.join(trial, 'evidence');
  const runPath = path.join(evidence, 'run.json');
  const run = JSON.parse(await readFile(runPath, 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(evidence, 'manifest.json'), 'utf8'));
  if (run.execution_status !== 'prepared') throw new Error('A trial may execute only once; prepare a fresh run for retries');
  const workspace = path.join(trial, 'workspace');
  const control = JSON.parse(await readFile(path.join(trial, 'control.json'), 'utf8'));
  if (run.evaluation_suite !== undefined || control.evaluation_suite !== undefined) await loadControlledCase(trial, control);
  if (canonical(await runnerInputs(control.repo)) !== canonical(manifest.runner_inputs)) throw new Error('Runner or dependencies changed after freeze');
  const initial = await inventory(workspace);
  if (treeDigest(initial) !== manifest.workspace_before_sha256) throw new Error('Staged inputs changed before execution');
  const prompt = (await readFile(path.join(evidence, 'prompt.txt'), 'utf8')).replace(/\n$/, '');
  if (sha256(prompt) !== run.prompt_sha256) throw new Error('Prompt changed before execution');
  const argv = nativeArguments(workspace, prompt, run.execution_mode ?? run.task_mode);
  const body = await readFile(path.join(trial, 'before', '.agents', 'skills', run.skill, 'SKILL.md'), 'utf8');
  if (!execute) return { execution_status: 'dry_run', binary, argv, timeout_ms: timeoutMs };
  const release = await acquireSlot(slotsPath);
  const started = Date.now();
  run.execution_status = 'running';
  run.started_at = new Date(started).toISOString();
  run.host_binary = binary;
  run.command_argv = [binary, ...argv];
  run.effective_prompt_sha256 = sha256(argv.at(-1));
  await writeFile(path.join(evidence, 'effective-prompt.txt'), argv.at(-1) + '\n');
  await writeFile(runPath, JSON.stringify(run, null, 2) + '\n');
  try {
    try { run.host_version = (await execFileAsync(binary, ['--version'], { timeout: 10000 })).stdout.trim(); }
    catch (error) { run.limitations.push(`Host version unavailable: ${error.message}`); }
    const discovery = await preflightSkills(binary, workspace, run.skill, run.sandbox_mode);
    run.skill_discovery = discovery;
    run.model = discovery.model ?? null;
    run.model_settings = discovery.reasoning_effort ? { reasoning_effort: discovery.reasoning_effort } : null;
    if (!discovery.candidate_metadata_observed) run.limitations.push('Native preflight did not confirm the staged candidate description; selection results lack verified catalog exposure.');
    await writeFile(path.join(evidence, 'discovery.json'), JSON.stringify(discovery, null, 2) + '\n');
    await writeFile(path.join(evidence, 'trace.jsonl'), '');
    await writeFile(path.join(evidence, 'stderr.txt'), '');
    let result;
    try { result = await captureProcess(binary, argv, { cwd: workspace, timeoutMs,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
      onStdout: chunk => appendFileSync(path.join(evidence, 'trace.jsonl'), chunk),
      onStderr: chunk => appendFileSync(path.join(evidence, 'stderr.txt'), chunk),
    }); }
    catch (error) { result = { stdout: '', stderr: error.message, exit_code: null, signal: null, timed_out: false, startup_error: true }; }
    await writeFile(path.join(evidence, 'trace.jsonl'), result.stdout);
    await writeFile(path.join(evidence, 'stderr.txt'), result.stderr);
    const parsed = parseEvents(result.stdout, run.skill, body);
    await writeFile(path.join(evidence, 'answer.md'), parsed.answer + '\n');
    const baselineAfter = await inventory(path.join(trial, 'before'));
    const baselineUnchanged = treeDigest(baselineAfter) === manifest.workspace_before_sha256;
    const after = await inventory(workspace);
    const changes = fileChanges(initial, after);
    const forbidden = changes.filter(change => !run.editable_files.includes(change.path));
    await writeFile(path.join(evidence, 'workspace-changes.json'), JSON.stringify({ changes, forbidden_changes: forbidden, workspace_after: after }, null, 2) + '\n');
    let patch = '';
    try { patch = (await execFileAsync('git', ['diff', '--no-index', '--', path.join(trial, 'before'), workspace], { maxBuffer: 20 * 1024 * 1024 })).stdout; }
    catch (error) { patch = error.stdout ?? ''; if (error.code !== 1) run.limitations.push('Git diff unavailable; the file-hash change manifest remains available.'); }
    await writeFile(path.join(evidence, 'workspace.patch'), patch);
    Object.assign(run, {
      finished_at: new Date().toISOString(), elapsed_seconds: (Date.now() - started) / 1000,
      execution_status: result.timed_out ? 'timed_out' : result.startup_error || result.exit_code !== 0 || parsed.terminal_type === 'turn.failed' ? 'blocked' : parsed.parseErrors.length || parsed.terminal_type !== 'turn.completed' || !parsed.answer ? 'invalid' : 'completed',
      exit_code: result.exit_code, signal: result.signal, timed_out: result.timed_out,
      owned_group_cleanup: result.owned_group_cleanup ?? null, descendant_limit: result.descendant_limit ?? null,
      token_usage: parsed.usage, tool_calls: parsed.tool_calls,
      activation_observation: parsed.activation_observation,
      trace_kind: 'native stdout JSONL; stderr captured separately',
      jsonl_parse_error_lines: parsed.parseErrors,
      observed_external_or_delegation_events: parsed.observed_external_or_delegation_events,
      final_workspace_tree_sha256: treeDigest(after),
      input_integrity: { baseline_unchanged: baselineUnchanged, allowed_changes_only: forbidden.length === 0, forbidden_changes: forbidden.map(entry => entry.path) },
      artifact_paths: { answer: 'answer.md', trace: 'trace.jsonl', stderr: 'stderr.txt', prompt: 'prompt.txt', effective_prompt: 'effective-prompt.txt', case_prompt: 'case-prompt.txt', discovery: 'discovery.json', manifest: 'manifest.json', workspace_diff: 'workspace.patch', changes: 'workspace-changes.json' },
    });
    if (parsed.observed_external_or_delegation_events.length) run.limitations.push('Review captured non-command tools against the declared capability contract; tool types alone do not establish their safety or scope.');
    // No rubric grading occurs in this runner. A completed process is not a skill pass.
    return run;
  } catch (error) {
    run.execution_status = 'invalid';
    run.finished_at = new Date().toISOString();
    run.elapsed_seconds = (Date.now() - started) / 1000;
    run.limitations.push(`Evidence capture failed: ${error.message}`);
    throw error;
  } finally {
    try {
      run.evidence_files = (await inventory(evidence)).filter(entry => entry.path !== 'run.json');
      const { run_evidence_sha256: ignored, ...identity } = run;
      run.run_evidence_sha256 = sha256(canonical(identity));
      await writeFile(runPath, JSON.stringify(run, null, 2) + '\n');
    }
    finally { await release(); }
  }
}
export async function loadControlledCase(trial, control) {
  const run = JSON.parse(await readFile(path.join(trial, 'evidence', 'run.json'), 'utf8'));
  if (run.evaluation_suite !== control.evaluation_suite) throw new Error('Trial suite binding mismatch');
  if (control.evaluation_suite !== undefined) {
    const freeze = JSON.parse(await readFile(control.freeze_path, 'utf8'));
    validateFreeze(freeze);
    if (freeze.evaluation_suite !== control.evaluation_suite || freeze.freeze_sha256 !== run.freeze_sha256
        || run.skill !== control.skill || run.case_id !== control.case_id
        || canonical(freeze.corpora[control.skill]?.[control.case_id]) !== canonical(control.frozen_case)) {
      throw new Error('Trial control differs from its frozen suite');
    }
    const executionControls = control.frozen_case.execution_controls;
    if (executionControls !== undefined
        && (canonical(run.editable_files) !== canonical(executionControls.editable_files.map(filename => `project/${safeRelative(filename)}`))
            || canonical(run.verification_argv) !== canonical(executionControls.verification_argv)
            || run.execution_control_derivation !== executionControls.derivation)) {
      throw new Error('Run execution controls differ from its frozen case');
    }
  }
  return loadCase(control.repo, control.skill, control.case_id, control.evaluation_suite);
}
export async function scoringInputs({ trial, destination }) {
  const control = JSON.parse(await readFile(path.join(trial, 'control.json'), 'utf8'));
  const { item } = await loadControlledCase(trial, control);
  if (sha256(canonical(item.rubric)) !== control.frozen_case.rubric_sha256) throw new Error('Rubric changed after freeze');
  const run = JSON.parse(await readFile(path.join(trial, 'evidence', 'run.json'), 'utf8'));
  await assertSealedEvidence(trial, run);
  if (!['completed', 'blocked', 'invalid', 'timed_out'].includes(run.execution_status)) throw new Error('Trial has no final execution evidence');
  const manifest = JSON.parse(await readFile(path.join(trial, 'evidence', 'manifest.json'), 'utf8'));
  if (treeDigest(await inventory(path.join(trial, 'before'))) !== manifest.workspace_before_sha256) throw new Error('Original snapshot changed; scoring inputs are invalid');
  await mkdir(destination);
  await copySnapshot(path.join(trial, 'before', 'project'), path.join(destination, 'original-project'), await inventory(path.join(trial, 'before', 'project')));
  await copySnapshot(path.join(trial, 'workspace', 'project'), path.join(destination, 'final-project'), await inventory(path.join(trial, 'workspace', 'project')));
  await copySnapshot(path.join(trial, 'evidence'), path.join(destination, 'evidence'), await inventory(path.join(trial, 'evidence')));
  await writeFile(path.join(destination, 'rubric.json'), JSON.stringify({ case_id: item.id, rubric_sha256: control.frozen_case.rubric_sha256, rubric: item.rubric }, null, 2) + '\n');
  await writeFile(path.join(destination, 'score-template.json'), JSON.stringify({
    run_id: run.run_id, run_evidence_sha256: run.run_evidence_sha256, final_workspace_tree_sha256: run.final_workspace_tree_sha256 ?? null,
    case_id: item.id, candidate_tree_sha256: run.candidate_tree_sha256, rubric_sha256: run.rubric_sha256,
    reviewer: null, independence: { authored_candidate: null, authored_response: null },
    criteria: item.rubric.map(rule => ({ id: rule.id, score: null, evidence: { artifact: null, locator: null, observation: null } })),
  }, null, 2) + '\n');
  await writeFile(path.join(destination, 'REVIEW.md'), `Independently score the saved observable result, not hidden reasoning. Read rubric.json, the raw project, answer, diff, command evidence and input hashes. Assign each criterion 0 fail, 1 partial, or 2 pass with an artifact path/line or event and observation. Report critical results separately. Do not convert a blocked/invalid/timed-out host attempt into a skill pass. Re-run the supplied verifier locally when applicable without modifying candidate artifacts. Distinguish native discovery from unobserved selection, process completion from correctness, and simulated adapters from real infrastructure. Record your reviewer identifier and any relationship to the skill/response author.\n`);
  return { destination, rubric_sha256: control.frozen_case.rubric_sha256 };
}
export function validateScore(score, rubric, expected = {}) {
  if (expected.rubric_sha256 !== undefined && sha256(canonical(rubric)) !== expected.rubric_sha256) throw new Error('Supplied rubric content does not match the frozen rubric');
  if (expected.execution_status !== undefined && expected.execution_status !== 'completed') throw new Error('An incomplete/blocked/invalid run is not eligible for a scored pass');
  if (expected.input_integrity && (!expected.input_integrity.allowed_changes_only || !expected.input_integrity.baseline_unchanged)) throw new Error('Run input integrity failed; it is not eligible for a scored pass');
  for (const key of ['run_id', 'run_evidence_sha256', 'final_workspace_tree_sha256', 'case_id', 'candidate_tree_sha256', 'rubric_sha256']) {
    if (expected[key] !== undefined && score[key] !== expected[key]) throw new Error(`Score binding mismatch: ${key}`);
  }
  if (score.independence?.authored_candidate !== false || score.independence?.authored_response !== false) throw new Error('Required independent scoring must be from a reviewer who authored neither candidate nor response');
  if (!score.reviewer || !Array.isArray(score.criteria)) throw new Error('Reviewer and criteria are required');
  if (score.criteria.length !== rubric.length || new Set(score.criteria.map(entry => entry.id)).size !== rubric.length) throw new Error('Score must cover each criterion exactly once');
  for (const rule of rubric) {
    const entry = score.criteria.find(value => value.id === rule.id);
    if (!entry || ![0, 1, 2].includes(entry.score) || !entry.evidence?.artifact || !entry.evidence?.observation) throw new Error(`Missing observable score: ${rule.id}`);
  }
  const critical = rubric.filter(rule => rule.severity === 'critical').map(rule => score.criteria.find(entry => entry.id === rule.id));
  return { rubric_result: score.criteria.every(entry => entry.score === 2) ? 'pass' : critical.some(entry => entry.score === 0) ? 'fail' : 'partial', critical_scores: critical.map(entry => ({ id: entry.id, score: entry.score })) };
}

// Metadata-only app-server calls: no thread/start, turn/start or model request.
export async function preflightSkills(binary, workspace, skill, sandboxMode, timeoutMs = 20000) {
  const cwd = await realpath(workspace);
  const expected = await realpath(path.join(cwd, '.agents', 'skills', skill, 'SKILL.md'));
  const detached = process.platform !== 'win32';
  const args = ['app-server', '--stdio', '-c', 'agents.enabled=false', '-c', 'approval_policy="never"', '-c', `sandbox_mode="${sandboxMode}"`];
  const child = spawn(binary, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], detached });
  const pending = new Map();
  let buffer = '', diagnostic = '', startupError;
  child.stderr.on('data', chunk => { diagnostic += chunk; });
  child.stdin.on('error', error => { for (const waiter of pending.values()) waiter.reject(error); });
  child.on('error', error => { startupError = error; for (const waiter of pending.values()) waiter.reject(error); });
  child.on('close', () => { for (const waiter of pending.values()) waiter.reject(new Error('App-server closed before metadata response')); });
  child.stdout.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\n'); buffer = lines.pop();
    for (const line of lines) {
      let message; try { message = JSON.parse(line); } catch { continue; }
      const waiter = pending.get(message.id);
      if (!waiter) continue;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    }
  });
  const rpc = (id, method, params) => new Promise((resolve, reject) => {
    if (startupError) { reject(startupError); return; }
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} metadata request timed out`)); }, timeoutMs);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
  });
  const result = { candidate_metadata_observed: false, request_kind: 'metadata_only_no_model_turn', command_argv: [binary, ...args], global_catalog_disabled: false, filesystem_read_isolation: false };
  try {
    await rpc(1, 'initialize', { clientInfo: { name: 'tal-eval', version: '1' }, capabilities: { experimentalApi: true } });
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    const response = await rpc(2, 'skills/list', { cwds: [cwd], forceReload: true });
    const entries = (response?.data ?? []).flatMap(group => group.skills ?? []);
    const selected = entries.filter(entry => entry.name === skill).map(entry => ({ name: entry.name, description: entry.description, path: entry.path, scope: entry.scope, enabled: entry.enabled }));
    Object.assign(result, { discovered_skill_count: entries.length, candidate_entries: selected, discovery_errors: (response?.data ?? []).flatMap(group => group.errors ?? []) });
    result.candidate_metadata_observed = selected.some(entry => entry.path === expected && entry.enabled !== false && typeof entry.description === 'string');
    const configResult = await rpc(3, 'config/read', { cwd, includeLayers: false });
    const config = configResult?.config ?? configResult;
    result.model = typeof config?.model === 'string' ? config.model : null;
    result.reasoning_effort = typeof config?.model_reasoning_effort === 'string' ? config.model_reasoning_effort : null;
    result.requested_setting_observations = { sandbox_mode: config?.sandbox_mode ?? null, approval_policy: config?.approval_policy ?? null, agents_enabled: config?.agents?.enabled ?? null };
  } catch (error) { result.error = error.message; }
  finally {
    child.stdin.destroy();
    try { process.kill(detached ? -child.pid : child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') result.cleanup_error = error.message; }
    await new Promise(resolve => setTimeout(resolve, 50));
    try { process.kill(detached ? -child.pid : child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') result.cleanup_error = error.message; }
    if (result.error && diagnostic) result.stderr_note = 'App-server emitted stderr; omitted from the public discovery record because it may contain inherited configuration details.';
  }
  return result;
}

export async function verifyTrial({ trial, checkId, timeoutMs = 60000 }) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(checkId)) throw new Error('Use a simple unique verification ID');
  const control = JSON.parse(await readFile(path.join(trial, 'control.json'), 'utf8'));
  const { item } = await loadControlledCase(trial, control);
  if (sha256(canonical(item)) !== control.frozen_case.case_sha256) throw new Error('Case changed after freeze');
  const verificationArgv = control.frozen_case.execution_controls?.verification_argv ?? item.verification_argv;
  if (!verificationArgv) return { execution_status: 'not_required', reason: 'This case has no executable verifier; score its answer/diff directly.' };
  const run = JSON.parse(await readFile(path.join(trial, 'evidence/run.json'), 'utf8'));
  if (run.execution_status !== 'completed') throw new Error('Trial must complete before independent verification');
  await assertSealedEvidence(trial, run);
  const manifest = JSON.parse(await readFile(path.join(trial, 'evidence/manifest.json'), 'utf8'));
  const original = await inventory(path.join(trial, 'before'));
  if (treeDigest(original) !== manifest.workspace_before_sha256) throw new Error('Original snapshot changed');
  const current = await inventory(path.join(trial, 'workspace'));
  const changes = fileChanges(original, current);
  const forbidden = changes.filter(entry => !run.editable_files.includes(entry.path));
  if (forbidden.length) throw new Error(`Protected/unexpected files changed: ${forbidden.map(entry => entry.path).join(', ')}`);
  const lock = path.join(trial, '.verify-lock');
  await mkdir(lock);
  try {
    const work = path.join(trial, 'check-workspaces', checkId);
    await mkdir(path.dirname(work), { recursive: true });
    await mkdir(work); // A check ID is never overwritten.
    await copySnapshot(path.join(trial, 'workspace/project'), work, await inventory(path.join(trial, 'workspace/project')));
    const before = await inventory(work);
    const command = verificationArgv;
    const started = Date.now();
    const outcome = await captureProcess(command[0], command.slice(1), { cwd: work, timeoutMs, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
    const result = {
      check_id: checkId, kind: 'independent_execution_of_supplied_verifier',
      run_id: run.run_id, run_evidence_sha256: run.run_evidence_sha256,
      candidate_tree_sha256: run.candidate_tree_sha256, fixture_input_tree_sha256: treeDigest(before),
      command_argv: command, executed: true, started_at: new Date(started).toISOString(), elapsed_seconds: (Date.now() - started) / 1000,
      exit_code: outcome.exit_code, signal: outcome.signal, timed_out: outcome.timed_out,
      status: outcome.timed_out ? 'timed_out' : outcome.exit_code === 0 ? 'pass' : 'fail',
      stdout: `checks/${checkId}.stdout.txt`, stderr: `checks/${checkId}.stderr.txt`,
      stdout_sha256: sha256(outcome.stdout), stderr_sha256: sha256(outcome.stderr),
      owned_group_cleanup: outcome.owned_group_cleanup, descendant_limit: outcome.descendant_limit,
      check_workspace_changes: fileChanges(before, await inventory(work)),
      limitations: ['Local synthetic fixture verification; not production, broker, cluster or protocol conformance evidence.'],
    };
    const directory = path.join(trial, 'evidence/checks');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${checkId}.stdout.txt`), outcome.stdout);
    await writeFile(path.join(directory, `${checkId}.stderr.txt`), outcome.stderr);
    const filename = path.join(trial, 'evidence/checks.json');
    let previous = { format_version: 1, checks: [] };
    try { previous = JSON.parse(await readFile(filename, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    previous.checks.push(result);
    await writeFile(filename, JSON.stringify(previous, null, 2) + '\n');
    return result;
  } finally { await rm(lock, { recursive: true }); }
}

export async function assertSealedEvidence(trial, run) {
  const { run_evidence_sha256: expected, ...identity } = run;
  if (!expected || expected !== sha256(canonical(identity))) throw new Error('Final run record was changed after execution');
  const actual = await inventory(path.join(trial, 'evidence'));
  const originals = new Set(run.evidence_files.map(entry => entry.path));
  const originalFiles = actual.filter(entry => originals.has(entry.path));
  if (treeDigest(originalFiles) !== treeDigest(run.evidence_files)) throw new Error('Captured evidence changed after execution');
  const unexpected = actual.filter(entry => !originals.has(entry.path) && entry.path !== 'run.json' && entry.path !== 'checks.json' && !entry.path.startsWith('checks/'));
  if (unexpected.length) throw new Error('Unrecorded files added to final evidence');
  if (run.final_workspace_tree_sha256 && treeDigest(await inventory(path.join(trial, 'workspace'))) !== run.final_workspace_tree_sha256) throw new Error('Final workspace changed after execution');
  const checksPath = path.join(trial, 'evidence/checks.json');
  let checks;
  try { checks = JSON.parse(await readFile(checksPath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const check of checks.checks) {
    if (check.run_evidence_sha256 !== expected || check.run_id !== run.run_id) throw new Error('Independent check belongs to another run');
    for (const stream of ['stdout', 'stderr']) {
      safeRelative(check[stream]);
      if (!check[stream].startsWith('checks/')) throw new Error('Check stream outside check artifacts');
      if (sha256(await readFile(path.join(trial, 'evidence', check[stream]))) !== check[`${stream}_sha256`]) throw new Error('Independent verification stream changed');
    }
  }
}

export async function requireIndependentVerification(trial, run) {
  if (!run.verification_argv) return { required: false };
  let record;
  try { record = JSON.parse(await readFile(path.join(trial, 'evidence/checks.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') throw new Error('An implementation pass requires a successful recorded independent verifier run'); throw error; }
  const finalProject = treeDigest(await inventory(path.join(trial, 'workspace/project')));
  const match = record.checks.find(check => check.kind === 'independent_execution_of_supplied_verifier'
    && check.run_id === run.run_id && check.run_evidence_sha256 === run.run_evidence_sha256
    && check.executed === true && check.exit_code === 0 && check.timed_out === false && check.status === 'pass'
    && check.fixture_input_tree_sha256 === finalProject
    && canonical(check.command_argv) === canonical(run.verification_argv));
  if (!match) throw new Error('No successful independent verifier matches this exact final project and command');
  return { required: true, check_id: match.check_id };
}
