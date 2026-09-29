#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import TOML from '@iarna/toml';
import { loadCatalog, buildInstallPlan, applyInstallPlan } from './toolkit/index.mjs';
import { readTree, readRegular, safeRelative, contained, sha256, checkId } from './toolkit/paths.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';

const MODES = new Set(['implementation', 'review']);
const DISABLED_FEATURES = ['apps', 'connectors', 'plugins', 'remote_plugin', 'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use', 'image_generation', 'imagegenext', 'hooks', 'codex_hooks', 'plugin_hooks'];
export function sessionOverrides(trialRoot, children = 2) {
  if (!Number.isInteger(children) || children < 1 || children > 2) throw new Error('Native smoke permits one or two concurrent children');
  const canonical = fs.realpathSync(trialRoot);
  const literal = JSON.stringify(canonical);
  const trust = `projects={${literal}={trust_level="trusted"}}`;
  TOML.parse(trust); // An independent parser checks the dynamically encoded path.
  return ['-c', trust, '-c', 'approval_policy="never"', '-c', `agents.max_concurrent_threads_per_session=${children}`, '-c', 'web_search="disabled"', '-c', 'sandbox_workspace_write.network_access=false', '-c', 'sandbox_workspace_write.exclude_slash_tmp=true', '-c', 'sandbox_workspace_write.exclude_tmpdir_env_var=true', ...DISABLED_FEATURES.flatMap(name => ['-c', `features.${name}=false`])];
}
function configSummary(result) {
  const c = result?.config ?? {};
  const agents = c.agents ? Object.fromEntries(['enabled', 'max_concurrent_threads_per_session', 'default_subagent_model', 'default_subagent_reasoning_effort'].map(key => [key, c.agents[key] ?? null])) : null;
  return { model: c.model ?? null, reasoning_effort: c.model_reasoning_effort ?? null, agents, sandbox_mode: c.sandbox_mode ?? null,
    capabilities: { web_search: c.web_search ?? null, features: Object.fromEntries(DISABLED_FEATURES.map(name => [name, c.features?.[name] ?? null])), sandbox_workspace_write: c.sandbox_workspace_write ?? null, mcp_servers: Object.fromEntries(Object.entries(c.mcp_servers ?? {}).map(([name, value]) => [name, { enabled: value.enabled ?? true }])) },
    project_layers: (result?.layers ?? []).filter(x => x.name?.type === 'project').map(x => ({ source: x.name, disabled_reason: x.disabledReason ?? null })) };
}
export function observableTrace(value) {
  if (Array.isArray(value)) return value.map(observableTrace);
  if (!value || typeof value !== 'object') return value;
  if (typeof value.type === 'string' && /reasoning/.test(value.type)) return { type: value.type, ...(value.id ? { id: value.id } : {}), payload_omitted: true };
  if (typeof value.method === 'string' && /(?:\/|_)reasoning(?:\/|_)/.test(value.method)) return { method: value.method, params: { ...Object.fromEntries(['threadId', 'turnId', 'itemId'].filter(key => value.params?.[key] !== undefined).map(key => [key, value.params[key]])), payload_omitted: true } };
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/^encrypted_?|^raw_?reasoning$/i.test(key)).map(([key, item]) => [key, observableTrace(item)]));
}
export class AppServerClient extends EventEmitter {
  constructor(child, { writeEvent = () => {}, requestTimeoutMs = 20000 } = {}) {
    super(); this.child = child; this.writeEvent = writeEvent; this.requestTimeoutMs = requestTimeoutMs;
    this.nextId = 1; this.pending = new Map(); this.requestMethods = new Map(); this.buffer = ''; this.closed = false;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { this.buffer += chunk; let end; while ((end = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, end); this.buffer = this.buffer.slice(end + 1); if (!line.trim()) continue;
      try { this.accept(JSON.parse(line)); } catch (error) { this.fail(error); }
    }});
    for (const stream of [child.stdin, child.stdout, child.stderr]) stream.on('error', error => { this.closed = true; this.fail(error); });
    child.on('error', error => this.fail(error));
    child.on('exit', (code, signal) => { this.closed = true; this.fail(new Error(`App server exited: ${code ?? signal}`)); this.emit('host-exit', { code, signal }); });
  }
  fail(error) { for (const value of this.pending.values()) { clearTimeout(value.timer); value.reject(error); } this.pending.clear(); this.emit('protocol-error', error); }
  accept(message) {
    const pending = this.pending.get(message.id);
    // Config responses may contain private endpoints; only their selected fields are retained.
    const logged = this.requestMethods.get(message.id) === 'config/read' ? { ...message, result: message.result ? configSummary(message.result) : undefined } : message;
    this.writeEvent(observableTrace(logged));
    if (message.id !== undefined && pending && !message.method) {
      clearTimeout(pending.timer); this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message ?? JSON.stringify(message.error)}`)); else pending.resolve(message.result);
    } else if (message.method && message.id !== undefined) {
      // Never grant an approval or fabricate a user answer in unattended smoke tests.
      this.send({ id: message.id, error: { code: -32601, message: 'Native smoke does not grant interactive requests' } });
      this.emit('interactive-request', message);
    } else if (message.method) this.emit('notification', message);
  }
  send(value) { if (this.closed) throw new Error('App server is closed'); this.child.stdin.write(`${JSON.stringify(value)}\n`); }
  notify(method, params = {}) { this.send({ method, params }); }
  request(method, params = {}) {
    const id = this.nextId++;
    this.requestMethods.set(id, method);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`RPC timeout: ${method}`)); }, this.requestTimeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
      try { this.send({ id, method, params }); } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
}
export function summarizeEvents(events, trialRoot) {
  const threads = new Map(), reads = [], commands = [], delegation = [], finalMessages = [];
  const views = events.flatMap((event, index) => {
    const locator = `events.jsonl:${index + 1}`, result = [{ event, locator }];
    for (const [turnIndex, turn] of (event.result?.thread?.turns ?? []).entries()) for (const [itemIndex, item] of (turn.items ?? []).entries()) result.push({ event: { method: 'item/completed', params: { threadId: event.result.thread.id, item } }, locator: `${locator}#/result/thread/turns/${turnIndex}/items/${itemIndex}` });
    return result;
  });
  for (const { event, locator } of views) {
    const p = event.params ?? {};
    const thread = event.method === 'thread/started' ? p.thread : event.result?.thread;
    if (thread) threads.set(thread.id, { id: thread.id, parent_thread_id: thread.parentThreadId ?? null, agent_role: thread.agentRole ?? null, model: thread.model ?? null, reasoning_effort: thread.reasoningEffort ?? null, evidence: locator });
    if (event.method !== 'item/completed') continue;
    const item = p.item ?? {};
    if (item.type === 'commandExecution') {
      commands.push({ thread_id: p.threadId, command: item.command, cwd: item.cwd, exit_code: item.exitCode ?? null, status: item.status, evidence: locator });
      if (item.status === 'completed' && item.exitCode === 0) for (const action of item.commandActions ?? []) if (action.type === 'read' && typeof action.path === 'string') {
        const absolute = path.resolve(item.cwd ?? trialRoot, action.path);
        reads.push({ thread_id: p.threadId, path: path.relative(trialRoot, absolute).split(path.sep).join('/'), evidence: locator, basis: 'native best-effort read action on completed zero-exit command' });
      }
    } else if (item.type === 'collabAgentToolCall') delegation.push({ tool: item.tool, sender_thread_id: item.senderThreadId, receiver_thread_ids: item.receiverThreadIds, status: item.status, requested_model: item.model ?? null, requested_reasoning_effort: item.reasoningEffort ?? null, evidence: locator });
    else if (item.type === 'agentMessage') finalMessages.push({ thread_id: p.threadId, text: item.text, evidence: locator });
  }
  return { threads: [...threads.values()], named_native_children: [...threads.values()].filter(x => x.parent_thread_id && x.agent_role?.startsWith('tal-')), observed_reads: reads, commands, delegation, messages: finalMessages,
    limits: ['Command read actions are the host parser\'s best-effort classification; retain raw output for review.', 'Missing role metadata or read events are inconclusive, not evidence inferred from assistant claims.', 'A matching role and a successful process do not independently establish task correctness.'] };
}
function fileHash(filename) { try { return sha256(fs.readFileSync(filename)); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
function globalConfigPath() { return path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml'); }
function saveJson(filename, value) { fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }); }
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
export function spawnOwned(binary, args, options) {
  if (process.platform === 'win32') throw new Error('Native smoke requires POSIX process-group cleanup; Windows runner is not implemented');
  const child = spawn(binary, args, { ...options, detached: true }); child.talOwnedGroup = true;
  child.talClosed = new Promise(resolve => child.once('close', resolve));
  return child;
}
function groupMembers(child) {
  if (!child.talOwnedGroup || !child.pid) return null;
  const result = spawnSync('ps', ['-axo', 'pid=,pgid=,stat='], { encoding: 'utf8', timeout: 3000 });
  if (result.status !== 0) throw new Error('Cannot observe owned process-group cleanup');
  return result.stdout.split('\n').map(line => line.trim().split(/\s+/)).filter(parts => Number(parts[1]) === child.pid && !parts[2]?.startsWith('Z')).map(parts => Number(parts[0]));
}
export async function stopHost(child, { graceMs = 3000 } = {}) {
  if (child.talOwnedGroup && child.pid) {
    const signal = name => { try { process.kill(-child.pid, name); } catch (error) { if (error.code !== 'ESRCH') throw error; } };
    child.stdin?.end(); signal('SIGTERM');
    const deadline = Date.now() + graceMs;
    while (groupMembers(child).length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 40));
    if (groupMembers(child).length) signal('SIGKILL');
    const killDeadline = Date.now() + 3000;
    while (groupMembers(child).length && Date.now() < killDeadline) await new Promise(resolve => setTimeout(resolve, 40));
    const remaining = groupMembers(child);
    await Promise.race([child.talClosed ?? Promise.resolve(), delay(1000)]);
    return { owned_process_group: child.pid, remaining_live_processes: remaining, terminated: remaining.length === 0 };
  }
  if (child.exitCode !== null || child.signalCode !== null) {
    if (!child.stdout.readableEnded || !child.stderr.readableEnded) await Promise.race([new Promise(resolve => child.once('close', resolve)), delay(1000)]);
    return { terminated: true, kind: 'test-transport' };
  }
  child.stdin.end(); child.kill('SIGTERM');
  await Promise.race([new Promise(resolve => child.once('close', resolve)), delay(3000)]);
  if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await Promise.race([new Promise(resolve => child.once('close', resolve)), delay(1000)]); }
  return { terminated: child.exitCode !== null || child.signalCode !== null, kind: 'test-transport' };
}
export function verifierInvocation(binary, trialRoot, argv) {
  if (!Array.isArray(argv) || !argv.length || argv.some(value => typeof value !== 'string' || !value)) throw new Error('Verifier requires a nonempty argv');
  // Preserve the actual HOME value; do not relocate Codex configuration or auth.
  const env = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'USER', 'LOGNAME'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  return { binary, args: ['sandbox', '-P', ':workspace', '--include-managed-config', '--sandbox-state-disable-network', '-C', fs.realpathSync(trialRoot), '--', ...argv], options: { cwd: fs.realpathSync(trialRoot), env, stdio: ['pipe', 'pipe', 'pipe'] } };
}
export async function runBoundedCommand({ binary, args, options, timeoutMs = 60000, spawnCommand = spawnOwned }) {
  let stdout = '', stderr = '', outcome = null, timedOut = false;
  const child = spawnCommand(binary, args, options);
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  const finished = new Promise(resolve => {
    child.once('error', error => { outcome = { exit_code: null, signal: null, error: error.message }; resolve(); });
    child.once('close', (code, signal) => { outcome ??= { exit_code: code, signal, error: null }; resolve(); });
  });
  let timer;
  await Promise.race([finished, new Promise(resolve => { timer = setTimeout(() => { timedOut = true; resolve(); }, timeoutMs); })]);
  clearTimeout(timer);
  // Clean the entire owned group even after a successful leader exit.
  let cleanup;
  try { cleanup = await stopHost(child); } catch (error) { cleanup = { terminated: false, error: error.message }; }
  return { ...outcome, exit_code: outcome?.exit_code ?? null, signal: outcome?.signal ?? null, error: outcome?.error ?? null, timed_out: timedOut, cleanup, stdout, stderr };
}
export async function collectNativeRun({ trialRoot, workflow, prompt, mode, runtimeOutputPaths = [], evidenceRoot, binary, binaryArgs = [], timeoutSeconds = 600, children = 2, spawnHost = spawnOwned }) {
  if (!MODES.has(mode)) throw new Error(`Unsupported task mode: ${mode}`);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 1800) throw new Error('Timeout must be between 1 and 1800 seconds');
  checkId(workflow, 'workflow', true);
  const root = fs.realpathSync(trialRoot), beforeConfig = fileHash(globalConfigPath());
  const args = [...binaryArgs, 'app-server', '--stdio', ...sessionOverrides(root, children)];
  const events = [], stderr = fs.openSync(path.join(evidenceRoot, 'stderr.txt'), 'wx', 0o600), eventFile = fs.openSync(path.join(evidenceRoot, 'events.jsonl'), 'wx', 0o600);
  const child = spawnHost(binary, args, { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.on('data', bytes => fs.writeSync(stderr, bytes));
  const client = new AppServerClient(child, { writeEvent: value => { events.push(value); fs.writeSync(eventFile, `${JSON.stringify(value)}\n`); } });
  const activeTurns = new Map(); let primaryThread = null, completionResolve, primaryOutcome = null, executionStarted = false, failure = null, closing = false;
  const completion = new Promise(resolve => { completionResolve = resolve; });
  client.on('notification', event => {
    const p = event.params ?? {};
    if (event.method === 'turn/started') activeTurns.set(p.threadId, p.turn?.id);
    if (event.method === 'turn/completed') { activeTurns.delete(p.threadId); if (p.threadId === primaryThread) { primaryOutcome = p.turn; completionResolve(); } }
  });
  client.on('protocol-error', error => { if (!closing) { failure ??= error.message; completionResolve(); } });
  client.on('interactive-request', event => { failure ??= `Unattended interactive request: ${event.method}`; completionResolve(); });
  let preflight = null, threadStart = null, cleanup = null;
  const capabilityDeviations = ['Filesystem reads are not confined to the trial; evaluator artifacts are withheld but not OS read-isolated.', 'Per-file writes are checked after execution, not enforced by a per-file native permission rule.', 'Native tool availability is not independently enumerated; disabled capability settings are configuration evidence.'];
  try {
    await client.request('initialize', { clientInfo: { name: 'tal-workflow-smoke', version: '1' }, capabilities: { experimentalApi: true } });
    client.notify('initialized');
    const config = await client.request('config/read', { cwd: root, includeLayers: true });
    const skills = await client.request('skills/list', { cwds: [root], forceReload: true });
    const matching = (skills.data ?? []).flatMap(x => x.skills ?? []).filter(x => x.name === workflow);
    preflight = { config: configSummary(config), workflow_skills: matching.map(x => ({ name: x.name, description: x.description, path: x.path, scope: x.scope, enabled: x.enabled })), skill_errors: (skills.data ?? []).flatMap(x => x.errors ?? []) };
    const caps = preflight.config.capabilities;
    if (caps.web_search !== 'disabled') capabilityDeviations.push('Effective configuration did not confirm disabled web search.');
    for (const name of DISABLED_FEATURES) if (caps.features[name] !== false) capabilityDeviations.push(`Effective configuration did not confirm disabled feature: ${name}`);
    if (!matching.some(x => x.enabled !== false && path.resolve(x.path) === path.join(root, '.agents/skills', workflow, 'SKILL.md'))) throw new Error('Installed workflow was not discovered at its expected path');
    if (!preflight.config.project_layers.some(x => !x.disabled_reason && fs.existsSync(x.source.dotCodexFolder) && fs.realpathSync(x.source.dotCodexFolder) === path.join(root, '.codex'))) throw new Error('Disposable project config layer is not enabled');
    const mcpOverrides = Object.fromEntries(Object.keys(caps.mcp_servers).map(name => [name, { enabled: false }]));
    if (Object.keys(mcpOverrides).length) capabilityDeviations.push('Configured MCP servers were disabled in thread-start overrides; effective per-thread MCP inventory is not independently exposed by this collector.');
    threadStart = await client.request('thread/start', { cwd: root, approvalPolicy: 'never', sandbox: mode === 'implementation' || runtimeOutputPaths.length ? 'workspace-write' : 'read-only', ephemeral: true, config: { mcp_servers: mcpOverrides } });
    primaryThread = threadStart.thread?.id;
    if (!primaryThread) throw new Error('thread/start did not return an identifier');
    executionStarted = true;
    const sandboxPolicy = mode === 'implementation' || runtimeOutputPaths.length ? { type: 'workspaceWrite', writableRoots: [root], networkAccess: false, excludeTmpdirEnvVar: true, excludeSlashTmp: true } : { type: 'readOnly', networkAccess: false };
    await client.request('turn/start', { threadId: primaryThread, sandboxPolicy, input: [{ type: 'text', text: `$${workflow}\n${prompt}` }] });
    let timer;
    await Promise.race([completion, new Promise(resolve => { timer = setTimeout(() => { failure = `Workflow timeout after ${timeoutSeconds}s`; resolve(); }, timeoutSeconds * 1000); })]);
    clearTimeout(timer);
    if (!primaryOutcome && !failure) failure = 'No terminal primary turn observed';
    const childrenSeen = new Set();
    for (const event of events) {
      if (event.method === 'thread/started' && event.params?.thread?.parentThreadId) childrenSeen.add(event.params.thread.id);
      for (const id of event.params?.item?.receiverThreadIds ?? []) if (id !== primaryThread) childrenSeen.add(id);
    }
    // Metadata retrieval improves role evidence even when spawn payloads are omitted.
    for (const threadId of childrenSeen) {
      try { await client.request('thread/read', { threadId, includeTurns: true }); } catch (error) { client.writeEvent({ method: 'tal/observationLimit', params: { threadId, message: error.message } }); }
    }
  } catch (error) { failure ??= error.message; }
  finally {
    if (!client.closed) for (const [threadId, turnId] of activeTurns) if (turnId) {
      try { await client.request('turn/interrupt', { threadId, turnId }); } catch { /* Stop the process even if interruption is unavailable. */ }
    }
    closing = true;
    try { cleanup = await stopHost(child); if (!cleanup.terminated) failure ??= 'Owned native process group did not terminate'; }
    catch (error) { cleanup = { terminated: false, error: error.message }; failure ??= `Native cleanup failed: ${error.message}`; }
    child.stderr.removeAllListeners('data'); child.stdout.removeAllListeners('data');
    fs.closeSync(stderr); fs.closeSync(eventFile);
  }
  const observation = summarizeEvents(events, root);
  const report = { schema_version: 1, host: 'codex', workflow, task_mode: mode, argv: [binary, ...args], registration: 'automatic-project-directory', model_override: false,
    primary_thread: primaryThread, preflight, effective_thread_model: threadStart?.model ?? threadStart?.thread?.model ?? null, effective_thread_reasoning: threadStart?.reasoningEffort ?? threadStart?.thread?.reasoningEffort ?? null,
    execution_started: executionStarted, terminal_turn: observableTrace(primaryOutcome), failure, global_config_unchanged: beforeConfig === fileHash(globalConfigPath()), observed: observation, cleanup, capability_deviations: capabilityDeviations, case_compliant: capabilityDeviations.length === 0,
    status: failure ? 'blocked-or-failed' : primaryOutcome?.status === 'completed' ? 'completed-unscored' : 'failed', independent_acceptance: 'pending' };
  saveJson(path.join(evidenceRoot, 'run.json'), report);
  return report;
}

export function prepareCase({ sourceRoot = repositoryRoot, fixtureRoot, caseId, outputRoot }) {
  checkId(caseId, 'case', true);
  const source = fs.realpathSync(sourceRoot), fixtures = fs.realpathSync(fixtureRoot);
  const absoluteOutput = path.resolve(outputRoot), output = path.join(fs.realpathSync(path.dirname(absoluteOutput)), path.basename(absoluteOutput));
  const relative = path.relative(source, output);
  if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Raw native smoke output must be outside the repository');
  if (fs.existsSync(output)) throw new Error('Output directory already exists; choose a fresh path');
  const indexFile = readRegular(fixtures, 'case-index.json'), index = JSON.parse(indexFile.bytes.toString());
  const cases = index.cases;
  if (!Array.isArray(cases)) throw new Error('Fixture index requires cases[]');
  const entry = cases.find(x => (x.workflow ?? x.id) === caseId);
  if (!entry) throw new Error(`Unknown native fixture: ${caseId}`);
  const declaredMode = entry.task_mode ?? entry.mode;
  const mode = declaredMode === 'implement' ? 'implementation' : declaredMode;
  if (!MODES.has(mode)) throw new Error('Fixture requires implementation or review mode');
  const editable = entry.editable_files ?? [];
  if (!Array.isArray(editable) || editable.some(x => typeof x !== 'string')) throw new Error('Fixture requires editable_files[]');
  for (const name of editable) { safeRelative(name); if (name.startsWith('.') || name === 'prompt.md') throw new Error('Editable paths cannot include runner-managed files'); }
  const runtimeOutputs = entry.runtime_output_paths ?? [];
  if (!Array.isArray(runtimeOutputs) || runtimeOutputs.some(name => typeof name !== 'string')) throw new Error('Invalid runtime_output_paths');
  for (const name of runtimeOutputs) { safeRelative(name.replace(/\/$/, '')); if (name.startsWith('.')) throw new Error('Runtime paths cannot include installed native files'); }
  const verifier = entry.verification_argv ?? [];
  if (!Array.isArray(verifier) || verifier.some(x => typeof x !== 'string' || !x)) throw new Error('Invalid verification_argv');
  if (!['acceptance', 'observation', 'behavior_observation', 'none'].includes(entry.verification_kind ?? 'acceptance')) throw new Error('Invalid verification_kind');
  if (mode === 'review' && editable.length) throw new Error('Review fixtures cannot declare editable files');
  const files = readTree(fixtures, `${caseId}/rawfiles`), prompt = readRegular(fixtures, `${caseId}/prompt.md`).bytes.toString();
  for (const [name] of files) {
    const relative = name.slice(`${caseId}/rawfiles/`.length);
    if (relative.split('/')[0].startsWith('.') || relative === 'prompt.md') throw new Error(`Fixture conflicts with runner-managed files: ${relative}`);
    if (runtimeOutputs.some(prefix => prefix.endsWith('/') ? relative.startsWith(prefix) : relative === prefix)) throw new Error(`Runtime output overlaps a supplied fixture file: ${relative}`);
  }
  // Resolve all dependencies before creating output; no model or copied script is run.
  const catalog = loadCatalog(source); if (!catalog.workflows.has(caseId)) throw new Error('Workflow not present in source catalog');
  fs.mkdirSync(output, { mode: 0o700 });
  const trial = path.join(output, 'trial'), evidence = path.join(output, 'evidence'); fs.mkdirSync(trial); fs.mkdirSync(evidence, { mode: 0o700 });
  for (const [filename, file] of files) {
    const destination = contained(trial, filename.slice(`${caseId}/rawfiles/`.length)); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, file.bytes, { mode: 0o644 | (file.mode & 0o111) });
  }
  fs.writeFileSync(path.join(trial, 'prompt.md'), prompt);
  const plan = buildInstallPlan({ sourceRoot: source, target: trial, host: 'codex', workflows: [caseId] });
  applyInstallPlan(plan);
  const baseline = [...readTree(trial)].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode }));
  const prepared = { schema_version: 1, status: 'prepared-no-model-execution', workflow: caseId, task_mode: mode, editable_files: editable, runtime_output_paths: runtimeOutputs, verification_argv: verifier, verification_kind: entry.verification_kind ?? 'acceptance', timeout_seconds: entry.timeout_seconds ?? (caseId === 'tal-backend-delivery' ? 600 : 300), trial, evidence, prompt, baseline, source_digest: plan.manifest.source_digest, fixture_index_sha256: sha256(indexFile.bytes), scope_enforcement: 'post-run hash comparison; native sandbox grants the whole disposable workspace, not per-file writes', rubric_access: 'withheld from trial, not OS read-isolated' };
  saveJson(path.join(evidence, 'prepared.json'), prepared);
  return prepared;
}
export function scopeChanges(prepared) {
  const old = new Map(prepared.baseline.map(x => [x.path, x])), current = readTree(prepared.trial), changed = [];
  for (const name of new Set([...old.keys(), ...current.keys()])) {
    const before = old.get(name), after = current.get(name);
    if (before?.sha256 !== (after ? sha256(after.bytes) : undefined) || before?.mode !== after?.mode) changed.push({ path: name, allowed: prepared.editable_files.includes(name) || (!old.has(name) && (prepared.runtime_output_paths ?? []).some(prefix => prefix.endsWith('/') ? name.startsWith(prefix) : name === prefix)), change: !old.has(name) ? 'created' : !current.has(name) ? 'deleted' : 'modified' });
  }
  return changed;
}
async function main(argv) {
  const args = options(argv, { '--case': 'one', '--output': 'one', '--fixtures': 'one', '--binary': 'one', '--timeout': 'one', '--run': 'boolean', '--help': 'boolean' });
  if (args['--help']) { console.log('Usage: node scripts/native-smoke.mjs --case <workflow-id> --output <new-directory-outside-repo> [--fixtures <root>] [--binary <codex>] [--timeout <seconds>] [--run]\nDefault prepares files only. --run executes one native Codex workflow; models inherit. Raw evidence stays outside the repository.'); return; }
  if (!args['--case'] || !args['--output']) throw new Error('--case and --output are required');
  const prepared = prepareCase({ fixtureRoot: args['--fixtures'] ?? path.join(repositoryRoot, 'evals/engineering-toolkit/native-fixtures'), caseId: args['--case'], outputRoot: args['--output'] });
  if (!args['--run']) { console.log(JSON.stringify({ status: prepared.status, trial: prepared.trial, evidence: prepared.evidence }, null, 2)); return; }
  const binary = args['--binary'] ?? '/Applications/ChatGPT.app/Contents/Resources/codex';
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (version.status !== 0) throw new Error(`Native binary version check failed: ${version.error?.message ?? version.stderr}`);
  const report = await collectNativeRun({ trialRoot: prepared.trial, evidenceRoot: prepared.evidence, workflow: prepared.workflow, prompt: prepared.prompt, mode: prepared.task_mode, runtimeOutputPaths: prepared.runtime_output_paths, binary, timeoutSeconds: args['--timeout'] ? Number(args['--timeout']) : prepared.timeout_seconds });
  report.host_version = version.stdout.trim();
  try { report.changed_files = scopeChanges(prepared); if (report.changed_files.some(x => !x.allowed)) report.status = 'failed-scope'; }
  catch (error) { report.status = 'failed-scope'; report.scope_error = error.message; }
  if (report.status === 'completed-unscored' && prepared.verification_argv.length) {
    const invocation = verifierInvocation(binary, prepared.trial, prepared.verification_argv);
    const check = await runBoundedCommand({ ...invocation, timeoutMs: 60000 });
    fs.writeFileSync(path.join(prepared.evidence, 'verification.stdout.txt'), check.stdout ?? '', { mode: 0o600 }); fs.writeFileSync(path.join(prepared.evidence, 'verification.stderr.txt'), check.stderr ?? '', { mode: 0o600 });
    report.independent_verification = { argv: [invocation.binary, ...invocation.args], kind: prepared.verification_kind, exit_code: check.exit_code, signal: check.signal, error: check.error, timed_out: check.timed_out, cleanup: check.cleanup, isolation: 'native :workspace sandbox, managed configuration included, network explicitly disabled, credential environment variables withheld', limits: ['The native :workspace profile permits system temporary-directory writes and broad filesystem reads; it does not enforce the fixture per-file allowlist.'] };
    report.capability_deviations.push('Independent verification uses the native :workspace profile, which allows system temporary-directory writes and broad filesystem reads.'); report.case_compliant = false;
    if (check.exit_code !== 0 || check.timed_out || !check.cleanup.terminated) report.status = 'failed-verification';
    try { report.changed_files = scopeChanges(prepared); if (report.changed_files.some(x => !x.allowed)) report.status = 'failed-scope'; }
    catch (error) { report.status = 'failed-scope'; report.scope_error = error.message; }
  }
  try { report.final_files = [...readTree(prepared.trial)].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode })); } catch (error) { report.scope_error ??= error.message; report.status = 'failed-scope'; }
  saveJson(path.join(prepared.evidence, 'run.json'), report);
  console.log(JSON.stringify({ status: report.status, evidence: prepared.evidence, named_native_children: report.observed.named_native_children.length, observed_reads: report.observed.observed_reads.length, global_config_unchanged: report.global_config_unchanged }, null, 2));
  if (report.status !== 'completed-unscored' || !report.global_config_unchanged) process.exitCode = 1;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
