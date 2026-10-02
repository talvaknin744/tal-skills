#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import TOML from '@iarna/toml';
import { loadCatalog, buildInstallPlan, applyInstallPlan } from './toolkit/index.mjs';
import { readTree, readRegular, safeRelative, contained, sha256, checkId } from './toolkit/paths.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';

const MODES = new Set(['implementation', 'review']);
// These names are present in the installed 0.159.2 `features list`. Unknown
// aliases are not evidence that a capability was disabled.
const DISABLED_FEATURES = ['apps', 'plugins', 'remote_plugin', 'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use', 'image_generation', 'hooks', 'memories', 'workspace_dependencies', 'skill_mcp_dependency_install'];
const REQUIRED_FEATURES = ['shell_tool', 'unified_exec', 'multi_agent'];
export function nativeLocalEnvironment(trialRoot) {
  const root = fs.realpathSync(trialRoot);
  // `local` is the reserved EnvironmentManager identity in installed 0.159.2.
  // An explicit empty selection disables shell, file editing and image tools.
  return { environmentId: 'local', cwd: root, runtimeWorkspaceRoots: [root] };
}
export function assertNativeLocalEnvironment(thread, expected, status, info) {
  if (!Array.isArray(thread?.environments) || thread.environments.length !== 1) throw new Error('Native thread did not expose exactly one local environment');
  const selected = thread.environments[0];
  if (selected.environmentId !== expected.environmentId || selected.cwd !== expected.cwd || JSON.stringify(selected.runtimeWorkspaceRoots) !== JSON.stringify(expected.runtimeWorkspaceRoots)) throw new Error('Native selected environment differs from the owned local trial');
  if (status?.status !== 'ready') throw new Error('Native local environment is not ready');
  if (typeof info?.shell?.name !== 'string' || !info.shell.name || typeof info.shell.path !== 'string' || !path.isAbsolute(info.shell.path)) throw new Error('Native local shell metadata is unavailable');
  let cwd;
  try { cwd = fs.realpathSync(fileURLToPath(info.cwd)); } catch { throw new Error('Native local environment cwd metadata is unavailable'); }
  if (cwd !== expected.cwd) throw new Error('Native local environment cwd differs from the owned trial');
  return { requested: expected, selected, status, info, selection_verified: true };
}
export async function collectNativeFeatures(client, threadId, { maxPages = 10 } = {}) {
  const flags = {}, seen = new Set(); let cursor;
  for (let page = 0; page < maxPages; page++) {
    const result = await client.request('experimentalFeature/list', { threadId, limit: 100, ...(cursor ? { cursor } : {}) });
    if (!Array.isArray(result?.data)) throw new Error('Native feature metadata is unavailable');
    for (const feature of result.data) {
      if (typeof feature.name !== 'string' || typeof feature.enabled !== 'boolean' || Object.hasOwn(flags, feature.name)) throw new Error('Malformed or repeated native feature metadata');
      flags[feature.name] = { enabled: feature.enabled, default_enabled: feature.defaultEnabled ?? null, stage: feature.stage ?? null };
    }
    if (!result.nextCursor) return { flags, pages: page + 1, basis: 'installed app-server experimentalFeature/list for the loaded thread; feature flags are not a complete tool registry' };
    if (seen.has(result.nextCursor)) throw new Error('Repeated native feature metadata cursor');
    seen.add(result.nextCursor); cursor = result.nextCursor;
  }
  throw new Error(`Native feature metadata exceeded ${maxPages} pages`);
}
export function nativeRoleDefinitions(trialRoot) {
  const folder = path.join(fs.realpathSync(trialRoot), '.codex/agents');
  if (!fs.existsSync(folder)) return [];
  if ([path.dirname(folder), folder].some(target => fs.lstatSync(target).isSymbolicLink())) throw new Error('Native role directories cannot traverse symlinks');
  return fs.readdirSync(folder).filter(name => name.endsWith('.toml')).sort().map(filename => {
    const target = path.join(folder, filename), stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Native role definitions must be regular owned files');
    const bytes = fs.readFileSync(target), config = TOML.parse(bytes.toString());
    if (typeof config.name !== 'string' || config.name !== filename.slice(0, -5) || typeof config.description !== 'string' || !config.description.trim() || typeof config.developer_instructions !== 'string' || !config.developer_instructions.trim()) throw new Error('Installed native role definition lacks its matching name, description or instructions');
    return { name: config.name, config_file: target, source_sha256: sha256(bytes), description_sha256: sha256(Buffer.from(config.description)) };
  });
}
function tomlValue(value) {
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}=${tomlValue(item)}`).join(',')}}`;
  return JSON.stringify(value);
}
function configArg(key, value) { const result = `${key}=${tomlValue(value)}`; TOML.parse(result); return result; }
export function nativePermissionProfile(trialRoot, { editableFiles = [], runtimeOutputPaths = [], readonlyBindFiles = false } = {}) {
  const root = fs.realpathSync(trialRoot), filesystem = { ':root': 'deny', ':minimal': 'read', ':tmpdir': 'deny', ':slash_tmp': 'deny', [root]: 'read' };
  for (const name of [...editableFiles, ...runtimeOutputPaths]) {
    const relative = name.replace(/\/$/, ''); safeRelative(relative);
    if (relative.startsWith('.') || relative === 'prompt.md') throw new Error('Native write rules cannot include runner-managed files');
    const absolute = contained(root, relative);
    // A fixture symlink must never turn a narrow write rule into an external grant.
    let cursor = root;
    for (const part of relative.split('/')) { cursor = path.join(cursor, part); if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Native write rules cannot traverse symlinks'); }
    filesystem[absolute] = 'write';
  }
  // Opt-in Linux wrapper mode composes this directory-level native grant with
  // a physically readonly trial and exact writable bind mounts. The collector
  // requires independent mount/control evidence before any model turn.
  if (readonlyBindFiles) {
    if (!editableFiles.length || runtimeOutputPaths.some(name => !name.endsWith('/'))) throw new Error('Readonly-bind composition requires declared editable files and directory runtime outputs');
    for (const name of editableFiles) if (!fs.statSync(contained(root, name)).isFile()) throw new Error('Readonly-bind editable targets must be existing regular files');
    for (const name of runtimeOutputPaths) if (!fs.statSync(contained(root, name.replace(/\/$/, ''))).isDirectory()) throw new Error('Readonly-bind runtime targets must be existing directories');
    for (const key of Object.keys(filesystem)) if (key.startsWith(`${root}${path.sep}`)) delete filesystem[key];
    filesystem[root] = 'write';
  }
  return { id: `tal-native-eval-${sha256(Buffer.from(root)).slice(0, 12)}`, root, profile: { filesystem, network: { enabled: false } } };
}
export function sessionOverrides(trialRoot, children = 2, { permissionProfile = nativePermissionProfile(trialRoot), disabledSkills = [] } = {}) {
  if (!Number.isInteger(children) || children < 1 || children > 2) throw new Error('Native smoke permits one or two concurrent children');
  const canonical = fs.realpathSync(trialRoot);
  const literal = JSON.stringify(canonical);
  const trust = `projects={${literal}={trust_level="trusted"}}`;
  TOML.parse(trust); // An independent parser checks the dynamically encoded path.
  return ['--strict-config', '-c', trust, '-c', 'approval_policy="never"', '-c', `agents.max_concurrent_threads_per_session=${children}`, '-c', 'web_search="disabled"', '-c', 'project_doc_max_bytes=0', '-c', 'developer_instructions=""', '-c', 'shell_environment_policy.inherit="core"', '-c', 'shell_environment_policy.ignore_default_excludes=false', '-c', configArg('permissions', { [permissionProfile.id]: permissionProfile.profile }), '-c', configArg('default_permissions', permissionProfile.id), ...(disabledSkills.length ? ['-c', configArg('skills.config', disabledSkills.map(filename => ({ path: filename, enabled: false })))] : []), ...DISABLED_FEATURES.flatMap(name => ['-c', `features.${name}=false`])];
}
function configSummary(result) {
  const c = result?.config ?? {};
  const agents = c.agents ? Object.fromEntries(['enabled', 'max_concurrent_threads_per_session', 'default_subagent_model', 'default_subagent_reasoning_effort'].map(key => [key, c.agents[key] ?? null])) : null;
  return { model: c.model ?? null, reasoning_effort: c.model_reasoning_effort ?? null, agents, sandbox_mode: c.sandbox_mode ?? null,
    capabilities: { web_search: c.web_search ?? null, features: Object.fromEntries(DISABLED_FEATURES.map(name => [name, c.features?.[name] ?? null])), sandbox_workspace_write: c.sandbox_workspace_write ?? null, mcp_servers: Object.fromEntries(Object.entries(c.mcp_servers ?? {}).map(([name, value]) => [name, { enabled: value.enabled ?? true }])) },
    guidance: { project_doc_max_bytes: c.project_doc_max_bytes ?? null, developer_instructions_empty: c.developer_instructions === '', model_instructions_file_present: Boolean(c.model_instructions_file), managed_developer_instructions_present: Boolean(c.additional_developer_instructions) },
    default_permissions: c.default_permissions ?? null,
    permissions: Object.fromEntries(Object.entries(c.permissions ?? {}).filter(([name]) => name.startsWith('tal-native-eval-')).map(([name, value]) => [name, { extends: value.extends ?? null, filesystem: value.filesystem ?? null, network_enabled: value.network?.enabled ?? null }])),
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
    this.nextId = 1; this.pending = new Map(); this.requestMethods = new Map(); this.requestContexts = new Map(); this.buffer = ''; this.closed = false;
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
    this.writeEvent(observableTrace({ ...logged, ...(this.requestContexts.has(message.id) ? { tal_request: this.requestContexts.get(message.id) } : {}) }));
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
    this.requestContexts.set(id, { method, ...Object.fromEntries(['threadId', 'turnId', 'cursor', 'itemsView'].filter(key => params[key] !== undefined).map(key => [key, params[key]])) });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`RPC timeout: ${method}`)); }, this.requestTimeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
      try { this.send({ id, method, params }); } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
}
export function summarizeEvents(events, trialRoot) {
  const threads = new Map(), reads = [], commands = [], delegation = [], finalMessages = [], nativeItems = [];
  const views = events.flatMap((event, index) => {
    const locator = `events.jsonl:${index + 1}`, result = [{ event, locator }];
    for (const [turnIndex, turn] of (event.result?.thread?.turns ?? []).entries()) for (const [itemIndex, item] of (turn.items ?? []).entries()) result.push({ event: { method: 'item/completed', params: { threadId: event.result.thread.id, turnId: turn.id ?? null, item } }, locator: `${locator}#/result/thread/turns/${turnIndex}/items/${itemIndex}` });
    if (event.tal_request?.method === 'thread/turns/list') for (const [turnIndex, turn] of (event.result?.data ?? []).entries()) for (const [itemIndex, item] of (turn.items ?? []).entries()) result.push({ event: { method: 'item/completed', params: { threadId: event.tal_request.threadId, turnId: turn.id, item } }, locator: `${locator}#/result/data/${turnIndex}/items/${itemIndex}` });
    if (event.tal_request?.method === 'thread/items/list') for (const [itemIndex, entry] of (event.result?.data ?? []).entries()) result.push({ event: { method: 'item/completed', params: { threadId: event.tal_request.threadId, turnId: entry.turnId, item: entry.item } }, locator: `${locator}#/result/data/${itemIndex}/item` });
    return result;
  });
  for (const { event, locator } of views) {
    const p = event.params ?? {};
    const thread = event.method === 'thread/started' ? p.thread : event.result?.thread;
    if (thread) { const spawn = thread.source?.subAgent?.thread_spawn; threads.set(thread.id, { id: thread.id, parent_thread_id: thread.parentThreadId ?? spawn?.parent_thread_id ?? null, agent_role: thread.agentRole ?? spawn?.agent_role ?? null, agent_path: spawn?.agent_path ?? null, model: thread.model ?? null, reasoning_effort: thread.reasoningEffort ?? null, evidence: locator }); }
    if (event.method !== 'item/completed') continue;
    const item = p.item ?? {};
    if (typeof item.type === 'string' && !/reasoning/i.test(item.type)) nativeItems.push({ item_type: item.type, item_id: item.id ?? null, thread_id: p.threadId ?? null, turn_id: p.turnId ?? null, host_event_method: event.method, tool_name: typeof item.tool === 'string' ? item.tool : null, server_name: typeof item.server === 'string' ? item.server : null, status: item.status ?? null, evidence: locator });
    if (item.type === 'commandExecution') {
      commands.push({ thread_id: p.threadId, turn_id: p.turnId ?? null, item_id: item.id ?? null, command: item.command, cwd: item.cwd, exit_code: item.exitCode ?? null, status: item.status, evidence: locator });
      if (item.status === 'completed' && item.exitCode === 0) for (const action of item.commandActions ?? []) if (action.type === 'read' && typeof action.path === 'string') {
        const absolute = path.resolve(item.cwd ?? trialRoot, action.path);
        reads.push({ thread_id: p.threadId, path: path.relative(trialRoot, absolute).split(path.sep).join('/'), evidence: locator, basis: 'native best-effort read action on completed zero-exit command' });
      }
    } else if (item.type === 'collabAgentToolCall') delegation.push({ tool: item.tool, sender_thread_id: item.senderThreadId, receiver_thread_ids: item.receiverThreadIds, status: item.status, requested_model: item.model ?? null, requested_reasoning_effort: item.reasoningEffort ?? null, prompt: typeof item.prompt === 'string' ? item.prompt : null, prompt_available: typeof item.prompt === 'string', turn_id: p.turnId ?? null, item_id: item.id ?? null, evidence: locator });
    else if (item.type === 'subAgentActivity') delegation.push({ tool: 'native-subagent-activity', sender_thread_id: p.threadId, receiver_thread_ids: [item.agentThreadId], agent_path: item.agentPath, status: item.kind, prompt: null, prompt_available: false, turn_id: p.turnId ?? null, item_id: item.id ?? null, evidence: locator });
    else if (item.type === 'agentMessage') finalMessages.push({ thread_id: p.threadId, role: 'assistant', text: item.text, phase: item.phase ?? null, turn_id: p.turnId ?? null, item_id: item.id ?? null, evidence: locator });
    else if (item.type === 'userMessage') finalMessages.push({ thread_id: p.threadId, role: 'user', text: (item.content ?? []).filter(x => x.type === 'text' && typeof x.text === 'string').map(x => x.text).join('\n'), content_types: (item.content ?? []).map(x => x.type), turn_id: p.turnId ?? null, item_id: item.id ?? null, evidence: locator });
  }
  return { threads: [...threads.values()], named_native_children: [...threads.values()].filter(x => x.parent_thread_id && x.agent_role?.startsWith('tal-')), observed_reads: reads, commands, delegation, messages: finalMessages, native_items: nativeItems,
    limits: ['Command read actions are the host parser\'s best-effort classification; retain raw output for review.', 'Native item tags and IDs record observed use, not the complete available tool inventory or enforcement of engine-native tools.', 'Missing role metadata or read events are inconclusive, not evidence inferred from assistant claims.', 'Missing collaboration prompts or child user messages remain an observation gap; role/activity metadata cannot prove what candidate was reviewed.', 'Visible message text is retained; hidden reasoning is omitted.', 'A matching role and a successful process do not independently establish task correctness.'] };
}
export async function collectThreadHistory(client, threadId, { maxPages = 40 } = {}) {
  // Legacy full-history reads remain the installed host default. Do not request
  // unsupported paginated thread creation just to improve observation.
  let snapshot;
  try { snapshot = await client.request('thread/read', { threadId, includeTurns: true }); }
  catch (error) { client.writeEvent({ method: 'tal/observationLimit', params: { threadId, stage: 'thread/read', message: error.message } }); }
  const t = snapshot?.thread, lastTurn = t?.turns?.at(-1), metadata = t?.id ? { thread_snapshot: { id: t.id, parent_thread_id: t.parentThreadId ?? t.source?.subAgent?.thread_spawn?.parent_thread_id ?? null, agent_role: t.agentRole ?? t.source?.subAgent?.thread_spawn?.agent_role ?? null, status: t.status ?? null, latest_turn_status: lastTurn?.status ?? null, terminal_turn_observed: ['completed', 'failed', 'interrupted'].includes(lastTurn?.status) } } : {};
  if (t?.status?.type === 'active') client.writeEvent({ method: 'tal/observationLimit', params: { threadId, stage: 'thread/read', message: 'Thread was active at the final collection read; complete history retrieval is not terminal child completion.' } });
  if (snapshot?.thread?.historyMode !== 'paginated' && Array.isArray(snapshot?.thread?.turns) && snapshot.thread.turns.length) return { kind: 'legacy-full-history', complete: true, ...metadata };
  let cursor = null; const seen = new Set();
  try {
    for (let page = 0; page < maxPages; page++) {
      const result = await client.request('thread/items/list', { threadId, limit: 100, sortDirection: 'asc', ...(cursor ? { cursor } : {}) });
      if (!Array.isArray(result?.data)) throw new Error('Malformed item history page');
      if (!result.nextCursor) return { kind: 'item-pagination', complete: true, pages: page + 1, ...metadata };
      if (seen.has(result.nextCursor)) throw new Error('Repeated item history cursor');
      seen.add(result.nextCursor); cursor = result.nextCursor;
    }
    throw new Error(`Item history exceeded ${maxPages} pages`);
  } catch (error) { client.writeEvent({ method: 'tal/observationLimit', params: { threadId, stage: 'thread/items/list', message: error.message } }); return { kind: 'unavailable-or-bounded', complete: false, error: error.message, ...metadata }; }
}
export function discoveredChildThreads(events, primaryThread) {
  const ids = new Set();
  for (const event of events) {
    const params = event.params ?? {}, item = params.item ?? {};
    const candidates = [params.threadId, params.thread?.parentThreadId ? params.thread.id : null, item.type === 'subAgentActivity' ? item.agentThreadId : null, ...(item.receiverThreadIds ?? [])];
    for (const id of candidates) if (typeof id === 'string' && id && id !== primaryThread) ids.add(id);
  }
  return [...ids];
}
function configFingerprint(filename) {
  let fd;
  try {
    fd = fs.openSync(filename, 'r');
    const bytes = fs.readFileSync(fd), stat = fs.fstatSync(fd);
    return { sha256: sha256(bytes), modified_at: stat.mtime.toISOString(), observed_at: new Date().toISOString() };
  } catch (error) {
    if (error.code === 'ENOENT') return { sha256: null, modified_at: null, observed_at: new Date().toISOString() };
    throw error;
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}
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
export function verifierInvocation(binary, trialRoot, argv, scope = {}) {
  if (!Array.isArray(argv) || !argv.length || argv.some(value => typeof value !== 'string' || !value)) throw new Error('Verifier requires a nonempty argv');
  // Preserve the actual HOME value; do not relocate Codex configuration or auth.
  const env = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'USER', 'LOGNAME'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  const permission = nativePermissionProfile(trialRoot, scope);
  return { binary, args: ['sandbox', '-P', permission.id, '--include-managed-config', '-c', configArg('permissions', { [permission.id]: permission.profile }), '-c', configArg('default_permissions', permission.id), '-C', permission.root, '--', ...argv], options: { cwd: permission.root, env, stdio: ['pipe', 'pipe', 'pipe'] } };
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
export async function probeNativeIsolation({ binary, trialRoot, editableFiles = [], runtimeOutputPaths = [], readonlyBindFiles = false, deniedReadPaths = [], deniedWriteDirectories = [], probeParent = os.tmpdir(), runCommand = runBoundedCommand }) {
  const root = fs.realpathSync(trialRoot), permission = nativePermissionProfile(root, { editableFiles, runtimeOutputPaths, readonlyBindFiles });
  for (const filename of deniedReadPaths) if (!path.isAbsolute(filename) || !fs.statSync(filename).isFile()) throw new Error('Denied-read probe requires an existing absolute regular file');
  nativePermissionProfile(root, { runtimeOutputPaths: deniedWriteDirectories }); // Validate owned paths and symlink ancestors; these write rules are never applied.
  const deniedDirectories = deniedWriteDirectories.map(name => { safeRelative(name.replace(/\/$/, '')); const target = contained(root, name.replace(/\/$/, '')); if (fs.existsSync(target)) throw new Error('Denied-write directory probe requires an absent owned trial path'); return target; });
  const checks = [], probeRoot = fs.mkdtempSync(path.join(fs.realpathSync(probeParent), 'tal-native-boundary-'));
  let server = null, network = { configured_disabled: true, enforcement: 'not-probed' };
  const canonicalProbe = fs.realpathSync(probeRoot);
  const readDirectory = path.join(canonicalProbe, 'read'), writeDirectory = path.join(canonicalProbe, 'write');
  fs.mkdirSync(readDirectory); fs.mkdirSync(writeDirectory);
  const readCanary = path.join(readDirectory, 'read.txt'), writeCanary = path.join(writeDirectory, 'write.txt'), withheld = path.join(canonicalProbe, 'withheld.txt');
  fs.writeFileSync(readCanary, 'owned-read-canary\n'); fs.writeFileSync(writeCanary, 'owned-write-canary\n'); fs.writeFileSync(withheld, 'owned-withheld-canary\n');
  const expected = [
    ['sandbox-startup', ['/usr/bin/true'], 0],
    ['allowed-read', ['/bin/sh', '-c', 'cat "$1" >/dev/null', 'probe', readCanary], 0],
    ['allowed-write', ['/bin/sh', '-c', 'printf "probe-write\\n" >> "$1"', 'probe', writeCanary], 0],
    ['withheld-read-denied', ['/bin/sh', '-c', 'cat "$1" >/dev/null', 'probe', withheld], 'denied'],
    ['immutable-write-denied', ['/bin/sh', '-c', 'printf "forbidden\\n" >> "$1"', 'probe', readCanary], 'denied']
  ];
  const fixtureRead = path.join(root, 'prompt.md');
  if (fs.existsSync(fixtureRead)) {
    expected.splice(1, 0, ['trial-read', ['/bin/sh', '-c', 'cat "$1" >/dev/null', 'probe', fixtureRead], 0]);
    expected.push(['trial-prompt-write-denied', ['/bin/sh', '-c', 'test ! -w "$1"', 'probe', fixtureRead], 0]);
  }
  for (const [index, filename] of deniedReadPaths.entries()) {
    expected.push([`protected-read-denied-${index + 1}`, ['/bin/sh', '-c', 'cat "$1" >/dev/null', 'probe', filename], 'denied']);
  }
  for (const [index, directory] of deniedDirectories.entries()) expected.push([`trial-runtime-directory-write-denied-${index + 1}`, ['/bin/mkdir', directory], 'denied']);
  try {
    for (const [id, argv, expectedExit] of expected) {
      const invocation = verifierInvocation(binary, root, argv, { editableFiles, runtimeOutputPaths, readonlyBindFiles });
      const probePermission = { ...permission.profile, filesystem: { ...permission.profile.filesystem, [readDirectory]: 'read', [writeDirectory]: 'write' } };
      const argument = invocation.args.indexOf('-c'); invocation.args[argument + 1] = configArg('permissions', { [permission.id]: probePermission });
      const result = await runCommand({ ...invocation, timeoutMs: 10000 });
      const successfulProcess = !result.error && !result.timed_out && result.cleanup?.terminated;
      const passed = successfulProcess && (expectedExit === 0 ? result.exit_code === 0 : [1, 2].includes(result.exit_code)) && (id !== 'immutable-write-denied' || fs.readFileSync(readCanary, 'utf8') === 'owned-read-canary\n') && (id !== 'allowed-write' || fs.readFileSync(writeCanary, 'utf8') === 'owned-write-canary\nprobe-write\n') && (!id.startsWith('trial-runtime-directory-write-denied-') || !fs.existsSync(argv[1]));
      checks.push({ id, expected_exit: expectedExit, passed, argv: [invocation.binary, ...invocation.args], ...result });
      // A startup failure is not evidence of a successful denial. No fallback to
      // unsandboxed execution or a weaker profile is permitted.
      if (!passed) break;
    }
    if (checks.length === expected.length && checks.every(x => x.passed)) {
      // The listener is owned by this no-model probe, bound only to loopback.
      // Establish reachability before interpreting a refused sandbox connection.
      let connections = 0;
      server = net.createServer(socket => { connections++; socket.destroy(); });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const port = server.address().port;
      await new Promise((resolve, reject) => { const socket = net.connect(port, '127.0.0.1'); socket.once('connect', () => { socket.destroy(); resolve(); }); socket.once('error', reject); });
      await delay(10); const baseline = connections;
      const invocation = verifierInvocation(binary, root, ['/usr/bin/nc', '-z', '-w', '1', '127.0.0.1', String(port)], { editableFiles, runtimeOutputPaths, readonlyBindFiles });
      // Positive transport control uses the same read/write restrictions and a
      // separate no-model profile with networking enabled, for this exact owned
      // loopback command. A missing or broken nc must not count as a denial.
      const positive = { ...invocation, args: [...invocation.args] }, argument = positive.args.indexOf('-c');
      positive.args[argument + 1] = configArg('permissions', { [permission.id]: { ...permission.profile, network: { enabled: true } } });
      const control = await runCommand({ ...positive, timeoutMs: 10000 });
      await delay(10); const positiveConnections = connections;
      const controlPassed = !control.error && !control.timed_out && control.cleanup?.terminated && control.exit_code === 0 && positiveConnections > baseline;
      checks.push({ id: 'owned-loopback-positive-control', expected_exit: 0, passed: controlPassed, argv: [positive.binary, ...positive.args], ...control });
      const result = controlPassed ? await runCommand({ ...invocation, timeoutMs: 10000 }) : { exit_code: null, error: 'Positive network control failed', cleanup: { terminated: true } };
      await delay(10);
      const passed = !result.error && !result.timed_out && result.cleanup?.terminated && result.exit_code === 1 && connections === positiveConnections && baseline > 0;
      checks.push({ id: 'loopback-network-denied', expected_exit: 1, passed, argv: [invocation.binary, ...invocation.args], reachable_baseline_connections: baseline, sandbox_connections: connections - positiveConnections, ...result });
      network = { configured_disabled: true, enforcement: passed ? 'owned-loopback-denial-observed' : 'probe-failed', port };
    }
    return { profile: permission, passed: checks.length === expected.length + 2 && checks.every(x => x.passed), checks, network, limits: ['Canaries test the native command sandbox mechanism, not every model tool.', 'The network probe tests an owned IPv4 loopback TCP connection; it does not enumerate all network transports.'] };
  } finally { if (server) { await new Promise(resolve => server.close(resolve)); network.listener_closed = true; } fs.rmSync(probeRoot, { recursive: true, force: true }); }
}
async function discoverSkills({ binary, args, root, spawnHost, writeEvent, writeStderr }) {
  const child = spawnHost(binary, args, { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.on('data', writeStderr);
  const client = new AppServerClient(child, { writeEvent }); client.on('protocol-error', () => {});
  let result;
  try {
    await client.request('initialize', { clientInfo: { name: 'tal-workflow-inventory', version: '2' }, capabilities: { experimentalApi: true } });
    client.notify('initialized');
    result = await client.request('skills/list', { cwds: [root], forceReload: true });
  } finally {
    const cleanup = await stopHost(child);
    writeEvent({ method: 'tal/inventoryCleanup', params: cleanup });
    child.stderr.removeAllListeners('data'); child.stdout.removeAllListeners('data');
    if (!cleanup.terminated) throw new Error('Owned discovery process group did not terminate');
  }
  return result;
}
export async function collectNativeRun({ trialRoot, workflow, prompt, mode, editableFiles = [], runtimeOutputPaths = [], readonlyBindFiles = false, expectedNativeRoles = [], evidenceRoot, binary, binaryArgs = [], timeoutSeconds = 600, children = 2, spawnHost = spawnOwned, isolationProbe = probeNativeIsolation, preflightOnly = false, inheritedDefaults = null }) {
  if (!MODES.has(mode)) throw new Error(`Unsupported task mode: ${mode}`);
  if (mode === 'review' && editableFiles.length) throw new Error('Review mode cannot grant source writes');
  if (readonlyBindFiles && mode !== 'implementation') throw new Error('Readonly-bind composition is only supported for explicit implementation mode');
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 1800) throw new Error('Timeout must be between 1 and 1800 seconds');
  checkId(workflow, 'workflow', true);
  const root = fs.realpathSync(trialRoot), beforeConfig = configFingerprint(globalConfigPath()), localEnvironment = nativeLocalEnvironment(root);
  const permission = nativePermissionProfile(root, { editableFiles, runtimeOutputPaths, readonlyBindFiles });
  let args = [...binaryArgs, 'app-server', '--stdio', ...sessionOverrides(root, children, { permissionProfile: permission })];
  const events = [], stderr = fs.openSync(path.join(evidenceRoot, 'stderr.txt'), 'wx', 0o600), eventFile = fs.openSync(path.join(evidenceRoot, 'events.jsonl'), 'wx', 0o600);
  const writeEvent = value => { const visible = observableTrace(value); events.push(visible); fs.writeSync(eventFile, `${JSON.stringify(visible)}\n`); };
  const writeStderr = bytes => fs.writeSync(stderr, bytes);
  let child = null, client = null, primaryThread = null, primaryOutcome = null, executionStarted = false, failure = null, closing = false;
  let preflight = null, threadStart = null, cleanup = { terminated: true, kind: 'not-started' }, boundary = null, preflightPassed = false;
  const activeTurns = new Map(), history = [];
  const capabilityDeviations = ['Native tool availability is not independently enumerated; disabled capability settings are configuration evidence.', 'Native sandbox command probes do not independently establish confinement of every model tool.'];
  let completionResolve; const completion = new Promise(resolve => { completionResolve = resolve; });
  try {
    // Discover once without a model, then start a fresh host with explicit
    // per-file skill disable overrides. A changed inventory fails closed.
    const inventory = await discoverSkills({ binary, args, root, spawnHost, writeEvent, writeStderr });
    const catalogRoot = path.join(root, '.agents/skills');
    const inClosure = filename => typeof filename === 'string' && filename.startsWith(`${catalogRoot}${path.sep}`);
    const disabledSkills = [...new Set((inventory.data ?? []).flatMap(x => x.skills ?? []).filter(x => !inClosure(x.path)).map(x => x.path))];
    if (disabledSkills.some(x => typeof x !== 'string' || !path.isAbsolute(x))) throw new Error('Native skill inventory contains an unusable path');
    args = [...binaryArgs, 'app-server', '--stdio', ...sessionOverrides(root, children, { permissionProfile: permission, disabledSkills })];
    child = spawnHost(binary, args, { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
    child.stderr.on('data', writeStderr);
    client = new AppServerClient(child, { writeEvent });
    client.on('notification', event => {
      const p = event.params ?? {};
      if (event.method === 'turn/started') activeTurns.set(p.threadId, p.turn?.id);
      if (event.method === 'turn/completed') { activeTurns.delete(p.threadId); if (p.threadId === primaryThread) { primaryOutcome = p.turn; completionResolve(); } }
    });
    client.on('protocol-error', error => { if (!closing) { failure ??= error.message; completionResolve(); } });
    client.on('interactive-request', event => { failure ??= `Unattended interactive request: ${event.method}`; completionResolve(); });
    await client.request('initialize', { clientInfo: { name: 'tal-workflow-smoke', version: '2' }, capabilities: { experimentalApi: true } });
    client.notify('initialized');
    const config = await client.request('config/read', { cwd: root, includeLayers: true });
    const skills = await client.request('skills/list', { cwds: [root], forceReload: true });
    const allSkills = (skills.data ?? []).flatMap(x => x.skills ?? []), matching = allSkills.filter(x => x.name === workflow);
    preflight = { config: configSummary(config), workflow_skills: matching.map(x => ({ name: x.name, description: x.description, path: x.path, scope: x.scope, enabled: x.enabled })), skill_errors: (skills.data ?? []).flatMap(x => x.errors ?? []), enabled_skills: allSkills.filter(x => x.enabled !== false).map(x => ({ name: x.name, path: x.path, scope: x.scope })), disabled_unrelated_skills: disabledSkills };
    if (!matching.some(x => x.enabled !== false && path.resolve(x.path) === path.join(catalogRoot, workflow, 'SKILL.md'))) throw new Error('Installed workflow was not discovered at its expected path');
    if (preflight.skill_errors.length) throw new Error('Native skill discovery reported errors');
    if (preflight.enabled_skills.some(x => !inClosure(x.path))) throw new Error('Unrelated native skills remain enabled after session overrides');
    if (!preflight.config.project_layers.some(x => !x.disabled_reason && fs.existsSync(x.source.dotCodexFolder) && fs.realpathSync(x.source.dotCodexFolder) === path.join(root, '.codex'))) throw new Error('Disposable project config layer is not enabled');
    const caps = preflight.config.capabilities, guidance = preflight.config.guidance;
    if (caps.web_search !== 'disabled') throw new Error('Effective configuration did not confirm disabled web search');
    for (const name of DISABLED_FEATURES) if (caps.features[name] !== false) throw new Error(`Effective configuration did not confirm disabled feature: ${name}`);
    if (guidance.project_doc_max_bytes !== 0 || !guidance.developer_instructions_empty || guidance.model_instructions_file_present || guidance.managed_developer_instructions_present) throw new Error('Unrelated instruction guidance cannot be excluded by supported session overrides');
    const effective = preflight.config.permissions[permission.id];
    if (!effective || effective.extends || effective.network_enabled !== false) throw new Error('Restricted native permission profile was not confirmed');
    const rules = Object.fromEntries(Object.entries(effective.filesystem ?? {}).filter(([key, value]) => key !== 'glob_scan_max_depth' || value !== null));
    if (JSON.stringify(Object.entries(rules).sort()) !== JSON.stringify(Object.entries(permission.profile.filesystem).sort())) throw new Error('Effective filesystem profile differs from the declared narrow rules');
    const mcpOverrides = Object.fromEntries(Object.keys(caps.mcp_servers).map(name => [name, { enabled: false }]));
    if (Object.keys(mcpOverrides).length) capabilityDeviations.push('Configured MCP servers were disabled in thread-start overrides; effective per-thread MCP inventory is not independently exposed by this collector.');
    // Full-history child delegation requires a persisted root. Preflight-only
    // probes use an ephemeral root and never start a model turn.
    threadStart = await client.request('thread/start', { cwd: root, approvalPolicy: 'never', permissions: permission.id, ephemeral: preflightOnly, environments: [localEnvironment], runtimeWorkspaceRoots: [root], config: { mcp_servers: mcpOverrides } });
    primaryThread = threadStart.thread?.id;
    if (!primaryThread) throw new Error('thread/start did not return an identifier');
    if (threadStart.activePermissionProfile?.id !== permission.id) throw new Error('Native thread did not select the restricted permissions profile');
    if (!Array.isArray(threadStart.instructionSources) || threadStart.instructionSources.length) throw new Error('Native thread loaded unrelated instruction sources or did not expose their absence');
    if (inheritedDefaults && ((threadStart.model ?? threadStart.thread?.model) !== inheritedDefaults.model || (threadStart.reasoningEffort ?? threadStart.thread?.reasoningEffort ?? null) !== inheritedDefaults.reasoning_effort)) throw new Error('Native effective model or effort differs from inherited preferences');
    preflight.local_environment = assertNativeLocalEnvironment(threadStart.thread, localEnvironment, await client.request('environment/status', { environmentId: 'local' }), await client.request('environment/info', { environmentId: 'local' }));
    preflight.resolved_features = await collectNativeFeatures(client, primaryThread);
    for (const name of REQUIRED_FEATURES) if (preflight.resolved_features.flags[name]?.enabled !== true) throw new Error(`Native required feature is disabled or unavailable: ${name}`);
    for (const name of DISABLED_FEATURES) if (preflight.resolved_features.flags[name]?.enabled !== false) throw new Error(`Native resolved metadata did not confirm disabled feature: ${name}`);
    if (preflight.config.agents?.enabled === false) throw new Error('Native agents are disabled by the effective configuration');
    preflight.collaboration_configuration = { agents_enabled_configured: preflight.config.agents?.enabled ?? null, agents_enabled_default: true, default_basis: 'official rust-v0.159.2 config/mod.rs defaults an absent agents.enabled to true', multi_agent_enabled: preflight.resolved_features.flags.multi_agent.enabled, multi_agent_v2_enabled: preflight.resolved_features.flags.multi_agent_v2?.enabled ?? null, tool_dispatch_verified: false };
    const nativeRoles = nativeRoleDefinitions(root);
    if (expectedNativeRoles.some(name => !nativeRoles.some(role => role.name === name))) throw new Error('Expected installed native role definition is missing');
    preflight.native_roles = { expected_names: expectedNativeRoles, definitions: nativeRoles, registration_basis: 'Installed project role files validated alongside the enabled project config layer; official source discovers these into internal agent_roles.', resolved_registry_available: false, actual_dispatch_verified: false, limits: ['Installed config/read does not return the discovered internal agent_roles registry. A task_name path or generic child prompt does not select a native role; actual child agentRole metadata remains required.'] };
    const authPath = path.join(path.dirname(globalConfigPath()), 'auth.json');
    boundary = await isolationProbe({ binary, trialRoot: root, editableFiles, runtimeOutputPaths, readonlyBindFiles, deniedReadPaths: [path.join(evidenceRoot, 'events.jsonl'), globalConfigPath(), authPath].filter(filename => fs.existsSync(filename)) });
    writeEvent({ method: 'tal/isolationProbe', params: boundary });
    if (!boundary.passed) { capabilityDeviations.push('The native sandbox boundary probe failed; no model turn was started.'); throw new Error(`Native sandbox boundary probe failed: ${boundary.checks?.find(x => !x.passed)?.id ?? 'unavailable'}`); }
    if (readonlyBindFiles && (boundary.composed_mounts?.passed !== true || boundary.composed_writes?.passed !== true)) throw new Error('Readonly-bind implementation lacks verified physical mounts and edit controls');
    preflightPassed = true;
    if (!preflightOnly) {
      executionStarted = true;
      await client.request('turn/start', { threadId: primaryThread, permissions: permission.id, environments: [localEnvironment], input: [{ type: 'text', text: `$${workflow}\n${prompt}` }] });
      let timer;
      await Promise.race([completion, new Promise(resolve => { timer = setTimeout(() => { failure = `Workflow timeout after ${timeoutSeconds}s`; resolve(); }, timeoutSeconds * 1000); })]);
      clearTimeout(timer);
      if (!primaryOutcome && !failure) failure = 'No terminal primary turn observed';
      const observedThreads = new Set([primaryThread]);
      for (let index = 0; index < 32; index++) {
        const next = index === 0 ? primaryThread : discoveredChildThreads(events, primaryThread).find(id => !observedThreads.has(id));
        if (!next) break;
        observedThreads.add(next); history.push({ thread_id: next, ...await collectThreadHistory(client, next) });
        if (index === 31) writeEvent({ method: 'tal/observationLimit', params: { message: 'Thread history traversal reached the 32-thread bound' } });
      }
    }
  } catch (error) { failure ??= error.message; }
  finally {
    if (client && !client.closed) for (const [threadId, turnId] of activeTurns) if (turnId) {
      try { await client.request('turn/interrupt', { threadId, turnId }); } catch { /* Stop the process even if interruption is unavailable. */ }
    }
    closing = true;
    if (child) {
      try { cleanup = await stopHost(child); if (!cleanup.terminated) failure ??= 'Owned native process group did not terminate'; }
      catch (error) { cleanup = { terminated: false, error: error.message }; failure ??= `Native cleanup failed: ${error.message}`; }
      child.stderr.removeAllListeners('data'); child.stdout.removeAllListeners('data');
    }
    fs.closeSync(stderr); fs.closeSync(eventFile);
  }
  const observation = summarizeEvents(events, root), afterConfig = configFingerprint(globalConfigPath());
  const report = { schema_version: 1, host: 'codex', workflow, task_mode: mode, argv: [binary, ...args], registration: 'automatic-project-directory', model_override: false,
    primary_thread: primaryThread, preflight, preflight_only: preflightOnly, boundary_probe: boundary, history_collection: history,
    effective_thread_model: threadStart?.model ?? threadStart?.thread?.model ?? null, effective_thread_reasoning: threadStart?.reasoningEffort ?? threadStart?.thread?.reasoningEffort ?? null,
    thread_persistence: { requested_ephemeral: preflightOnly, observed_ephemeral: threadStart?.thread?.ephemeral ?? null, root_path: threadStart?.thread?.path ?? null }, instruction_sources: threadStart?.instructionSources ?? null, active_permission_profile: threadStart?.activePermissionProfile ?? null,
    execution_started: executionStarted, terminal_turn: observableTrace(primaryOutcome), failure, global_config_unchanged: beforeConfig.sha256 === afterConfig.sha256, global_config_observation: { before: beforeConfig, after: afterConfig, change_attribution: beforeConfig.sha256 === afterConfig.sha256 ? 'not-applicable' : 'unknown; comparison alone does not identify the writer' }, observed: observation, cleanup, capability_deviations: capabilityDeviations, case_compliant: false,
    status: failure || preflightOnly ? 'blocked-or-failed' : primaryOutcome?.status === 'completed' ? 'completed-unscored' : 'failed', preflight_passed: preflightPassed, failure_stage: failure ? preflightPassed ? 'execution-or-cleanup' : 'preflight' : null, filesystem_enforcement: readonlyBindFiles ? 'readonly-trial-exact-bind-files' : 'native-exact-files', timeout_seconds: timeoutSeconds, independent_acceptance: 'pending' };
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
  const prepared = { schema_version: 1, status: 'prepared-no-model-execution', workflow: caseId, task_mode: mode, editable_files: editable, runtime_output_paths: runtimeOutputs, verification_argv: verifier, verification_kind: entry.verification_kind ?? 'acceptance', expected_native_roles: nativeRoleDefinitions(trial).map(role => role.name), timeout_seconds: entry.timeout_seconds ?? (caseId === 'tal-backend-delivery' ? 600 : 300), timeout_origin: entry.timeout_seconds === undefined ? 'runner-default' : 'fixture', trial, evidence, prompt, baseline, source_digest: plan.manifest.source_digest, fixture_index_sha256: sha256(indexFile.bytes), scope_enforcement: 'declared narrow native profile plus required pre-turn boundary probes; post-run hash audit remains independent evidence', rubric_access: 'withheld from trial; native read confinement must pass its boundary probe before a model turn' };
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
  const args = options(argv, { '--case': 'one', '--output': 'one', '--fixtures': 'one', '--binary': 'one', '--timeout': 'one', '--run': 'boolean', '--preflight-only': 'boolean', '--help': 'boolean' });
  if (args['--help']) { console.log('Usage: node scripts/native-smoke.mjs --case <workflow-id> --output <new-directory-outside-repo> [--fixtures <root>] [--binary <codex>] [--timeout <seconds>] [--run | --preflight-only]\nDefault prepares files only. --preflight-only runs metadata and boundary probes with no model turn. --run executes one native Codex workflow only after those gates; models inherit. Raw evidence stays outside the repository.'); return; }
  if (args['--run'] && args['--preflight-only']) throw new Error('--run and --preflight-only are mutually exclusive');
  if (!args['--case'] || !args['--output']) throw new Error('--case and --output are required');
  const prepared = prepareCase({ fixtureRoot: args['--fixtures'] ?? path.join(repositoryRoot, 'evals/engineering-toolkit/native-fixtures'), caseId: args['--case'], outputRoot: args['--output'] });
  if (!args['--run'] && !args['--preflight-only']) { console.log(JSON.stringify({ status: prepared.status, trial: prepared.trial, evidence: prepared.evidence }, null, 2)); return; }
  const binary = args['--binary'] ?? '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex';
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (version.status !== 0) throw new Error(`Native binary version check failed: ${version.error?.message ?? version.stderr}`);
  const report = await collectNativeRun({ trialRoot: prepared.trial, evidenceRoot: prepared.evidence, workflow: prepared.workflow, prompt: prepared.prompt, mode: prepared.task_mode, editableFiles: prepared.editable_files, runtimeOutputPaths: prepared.runtime_output_paths, expectedNativeRoles: prepared.expected_native_roles, binary, preflightOnly: Boolean(args['--preflight-only']), timeoutSeconds: args['--timeout'] ? Number(args['--timeout']) : prepared.timeout_seconds });
  report.host_version = version.stdout.trim();
  report.host_binary_sha256 = sha256(fs.readFileSync(fs.realpathSync(binary)));
  try { report.changed_files = scopeChanges(prepared); if (report.changed_files.some(x => !x.allowed)) report.status = 'failed-scope'; }
  catch (error) { report.status = 'failed-scope'; report.scope_error = error.message; }
  if (report.status === 'completed-unscored' && prepared.verification_argv.length) {
    const invocation = verifierInvocation(binary, prepared.trial, prepared.verification_argv, { editableFiles: prepared.editable_files, runtimeOutputPaths: prepared.runtime_output_paths });
    const check = await runBoundedCommand({ ...invocation, timeoutMs: 60000 });
    fs.writeFileSync(path.join(prepared.evidence, 'verification.stdout.txt'), check.stdout ?? '', { mode: 0o600 }); fs.writeFileSync(path.join(prepared.evidence, 'verification.stderr.txt'), check.stderr ?? '', { mode: 0o600 });
    report.independent_verification = { argv: [invocation.binary, ...invocation.args], kind: prepared.verification_kind, exit_code: check.exit_code, signal: check.signal, error: check.error, timed_out: check.timed_out, cleanup: check.cleanup, isolation: 'named native profile: deny root, minimal system reads, trial reads, declared writes, network disabled; managed configuration included; credential environment variables withheld', limits: ['Command sandbox checks do not enumerate all native model tools.'] };
    if (check.exit_code !== 0 || check.timed_out || !check.cleanup.terminated) report.status = 'failed-verification';
    try { report.changed_files = scopeChanges(prepared); if (report.changed_files.some(x => !x.allowed)) report.status = 'failed-scope'; }
    catch (error) { report.status = 'failed-scope'; report.scope_error = error.message; }
  }
  try { report.final_files = [...readTree(prepared.trial)].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode })); } catch (error) { report.scope_error ??= error.message; report.status = 'failed-scope'; }
  saveJson(path.join(prepared.evidence, 'run.json'), report);
  console.log(JSON.stringify({ status: report.status, evidence: prepared.evidence, named_native_children: report.observed.named_native_children.length, observed_reads: report.observed.observed_reads.length, global_config_unchanged: report.global_config_unchanged }, null, 2));
  if ((args['--preflight-only'] ? !report.preflight_passed : report.status !== 'completed-unscored') || !report.global_config_unchanged) process.exitCode = 1;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
