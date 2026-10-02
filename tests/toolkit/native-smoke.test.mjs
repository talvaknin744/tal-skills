import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import TOML from '@iarna/toml';
import Ajv from 'ajv';
import { createFixture } from './fixtures.mjs';
import { sessionOverrides, nativePermissionProfile, nativeLocalEnvironment, assertNativeLocalEnvironment, collectNativeFeatures, nativeRoleDefinitions, probeNativeIsolation, collectThreadHistory, AppServerClient, summarizeEvents, discoveredChildThreads, collectNativeRun, prepareCase, scopeChanges, observableTrace, spawnOwned, stopHost, verifierInvocation, runBoundedCommand } from '../../scripts/native-smoke.mjs';
import { linuxContainerArgs, linuxTarget, assertLinuxTargetRuntime, runLinuxSmoke, linuxReviewPolicy, stageLinuxImplementation, assertComposedLinuxMounts, probeComposedLinuxWrites, probeVerifierAvailability, linuxTimeout, cleanupLinuxContainer, runOwnedLinuxContainer, linuxRunPassed, TESTED_LINUX_IMAGE, TESTED_PYTHON_LINUX_IMAGE, TESTED_LINUX_BINARY_SHA256, TESTED_PYTHON_BINARY_SHA256 } from '../../scripts/native-linux-smoke.mjs';

function fakeChild(handler) {
  const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.exitCode = null; child.signalCode = null;
  let buffer = '';
  const send = message => child.stdout.write(`${JSON.stringify(message)}\n`);
  child.stdin.on('data', data => { buffer += data; let i; while ((i = buffer.indexOf('\n')) >= 0) { const line = buffer.slice(0, i); buffer = buffer.slice(i + 1); if (line) queueMicrotask(() => handler(JSON.parse(line), send)); } });
  child.kill = signal => { child.signalCode = signal; queueMicrotask(() => { child.emit('exit', null, signal); child.stdout.end(); child.stderr.end(); child.emit('close', null, signal); }); };
  return child;
}
const rootFor = t => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal native unit-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return fs.realpathSync(root); };
function selectedConfig(argv, root) {
  const config = {};
  for (let i = 0; i < argv.length; i++) if (argv[i] === '-c') {
    const entry = TOML.parse(argv[++i]);
    for (const [key, value] of Object.entries(entry)) config[key] = { ...(config[key] && typeof config[key] === 'object' ? config[key] : {}), ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}) };
    Object.assign(config, Object.fromEntries(Object.entries(entry).filter(([, value]) => !value || typeof value !== 'object')));
  }
  return { config: { model: 'inherited', model_reasoning_effort: 'inherited-effort', ...config }, layers: [{ name: { type: 'project', dotCodexFolder: path.join(root, '.codex') }, disabledReason: null }] };
}
const successfulBoundary = async () => ({ passed: true, checks: [{ id: 'synthetic-boundary', passed: true }], network: { enforcement: 'synthetic' } });
const disabledFeatureNames = ['apps', 'plugins', 'remote_plugin', 'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use', 'image_generation', 'hooks', 'memories', 'workspace_dependencies', 'skill_mcp_dependency_install'];
function metadataResult(request, root, { environmentStatus = 'ready', features = {} } = {}) {
  if (request.method === 'environment/status') return { status: environmentStatus };
  if (request.method === 'environment/info') return { cwd: new URL(`file://${root}`).href, shell: { name: 'sh', path: '/bin/sh' } };
  if (request.method === 'experimentalFeature/list') return { data: Object.entries({ shell_tool: true, unified_exec: true, multi_agent: true, multi_agent_v2: false, ...Object.fromEntries(disabledFeatureNames.map(name => [name, false])), ...features }).map(([name, enabled]) => ({ name, enabled, defaultEnabled: enabled, stage: 'stable' })), nextCursor: null };
}
function isolatedFakeHost(root, methods, { unrelatedAfterOverride = false, instructions = [], environments = [nativeLocalEnvironment(root)], agentsEnabled, ...metadataOptions } = {}) {
  return (_binary, argv) => fakeChild((request, send) => {
    methods.push(request.method); const result = value => send({ id: request.id, result: value });
    if (request.method === 'initialize') result({});
    if (request.method === 'config/read') { const selected = selectedConfig(argv, root); if (agentsEnabled !== undefined) selected.config.agents.enabled = agentsEnabled; result(selected); }
    if (request.method === 'skills/list') result({ data: [{ skills: [{ name: 'tal-backend-delivery', path: path.join(root, '.agents/skills/tal-backend-delivery/SKILL.md'), enabled: true }, ...(unrelatedAfterOverride ? [{ name: 'unrelated', path: '/synthetic/global/SKILL.md', enabled: true }] : [])], errors: [] }] });
    if (request.method === 'thread/start') result({ thread: { id: 'root', ephemeral: request.params.ephemeral, environments }, activePermissionProfile: { id: request.params.permissions }, instructionSources: instructions });
    const metadata = metadataResult(request, root, metadataOptions); if (metadata) result(metadata);
  });
}

test('narrow profiles deny external reads and grant only declared writes without modifying global config', t => {
  const root = rootFor(t); fs.mkdirSync(path.join(root, 'outputs'));
  const profile = nativePermissionProfile(root, { editableFiles: ['service.py'], runtimeOutputPaths: ['outputs/'] });
  assert.equal(profile.profile.filesystem[':root'], 'deny');
  assert.equal(profile.profile.filesystem[root], 'read');
  assert.equal(profile.profile.filesystem[path.join(root, 'service.py')], 'write');
  assert.equal(profile.profile.filesystem[path.join(root, 'outputs')], 'write');
  assert.equal(profile.profile.network.enabled, false);
  assert.throws(() => nativePermissionProfile(root, { editableFiles: ['.codex/config.toml'] }), /runner-managed/);
  fs.symlinkSync('/tmp', path.join(root, 'escape'));
  assert.throws(() => nativePermissionProfile(root, { editableFiles: ['escape/foreign'] }), /symlinks/);
});

test('a native sandbox startup failure is preserved and never counted as a denied-read pass', async t => {
  const root = rootFor(t), calls = [];
  const result = await probeNativeIsolation({ binary: 'synthetic-codex', trialRoot: root, runCommand: async invocation => { calls.push(invocation); return { exit_code: 65, stderr: 'sandbox-exec: unbound variable: TIOCSTI', cleanup: { terminated: true } }; } });
  assert.equal(calls.length, 1);
  assert.equal(result.passed, false);
  assert.equal(result.checks[0].id, 'sandbox-startup');
  assert.match(result.checks[0].stderr, /TIOCSTI/);
  assert.equal(result.network.enforcement, 'not-probed');
});

test('denied directory write probes cannot target an external or preexisting path', async t => {
  const root = rootFor(t); fs.mkdirSync(path.join(root, 'existing'));
  await assert.rejects(probeNativeIsolation({ binary: 'unused', trialRoot: root, deniedWriteDirectories: ['../outside'] }), /Unsafe path/);
  await assert.rejects(probeNativeIsolation({ binary: 'unused', trialRoot: root, deniedWriteDirectories: ['existing/'] }), /absent owned trial path/);
  fs.symlinkSync(os.tmpdir(), path.join(root, 'escape'));
  await assert.rejects(probeNativeIsolation({ binary: 'unused', trialRoot: root, deniedWriteDirectories: ['escape/new/'] }), /symlinks/);
});

test('a failed boundary gate prevents turn/start and preserves the failure evidence', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods), isolationProbe: async () => ({ passed: false, checks: [{ id: 'sandbox-startup', passed: false, stderr: 'synthetic TIOCSTI' }] }) });
  assert.equal(report.execution_started, false);
  assert.equal(methods.includes('turn/start'), false);
  assert.match(report.failure, /sandbox-startup/);
  assert.match(fs.readFileSync(path.join(evidence, 'events.jsonl'), 'utf8'), /synthetic TIOCSTI/);
  assert.equal(report.cleanup.terminated, true);
});

test('preflight-only validates controls without starting a model or claiming case compliance', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods), isolationProbe: successfulBoundary, preflightOnly: true });
  assert.equal(report.preflight_passed, true);
  assert.equal(report.execution_started, false);
  assert.equal(methods.includes('turn/start'), false);
  assert.equal(report.thread_persistence.requested_ephemeral, true);
  assert.equal(report.case_compliant, false);
  assert.equal(report.preflight.local_environment.selection_verified, true);
  assert.equal(report.preflight.resolved_features.flags.multi_agent.enabled, true);
  assert.match(report.preflight.resolved_features.basis, /not a complete tool registry/);
});

test('missing, disabled, remote, or overbroad environments block before sandbox probes and model turns', async t => {
  for (const mutation of [() => null, () => [], root => [{ ...nativeLocalEnvironment(root), environmentId: 'remote' }], root => [{ ...nativeLocalEnvironment(root), cwd: '/' }], root => [{ ...nativeLocalEnvironment(root), runtimeWorkspaceRoots: ['/'] }], root => [nativeLocalEnvironment(root), nativeLocalEnvironment(root)]]) {
    const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
    let probed = false;
    const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods, { environments: mutation(root) }), isolationProbe: async () => { probed = true; return successfulBoundary(); } });
    assert.equal(probed, false); assert.equal(report.execution_started, false); assert.equal(methods.includes('turn/start'), false);
    assert.match(report.failure, /local environment|owned local trial/);
  }
});

test('unready local environment and missing required shell or delegation features fail closed', async t => {
  for (const options of [{ environmentStatus: 'pending' }, { features: { shell_tool: false } }, { features: { unified_exec: false } }, { features: { multi_agent: false } }, { features: { plugins: true } }, { agentsEnabled: false }]) {
    const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
    let probed = false;
    const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods, options), isolationProbe: async () => { probed = true; return successfulBoundary(); } });
    assert.equal(probed, false); assert.equal(report.execution_started, false); assert.equal(methods.includes('turn/start'), false);
    assert.match(report.failure, /not ready|feature|agents are disabled/);
  }
});

test('local environment requires usable shell and canonical cwd metadata', t => {
  const root = rootFor(t), expected = nativeLocalEnvironment(root), thread = { environments: [expected] }, ready = { status: 'ready' };
  assert.throws(() => assertNativeLocalEnvironment(thread, expected, ready, { cwd: new URL(`file://${root}`).href }), /shell metadata/);
  assert.throws(() => assertNativeLocalEnvironment(thread, expected, ready, { shell: { name: 'sh', path: '/bin/sh' } }), /cwd metadata/);
  assert.throws(() => assertNativeLocalEnvironment(thread, expected, ready, { shell: { name: 'sh', path: '/bin/sh' }, cwd: 'file:///' }), /cwd differs/);
});

test('resolved feature pagination retains all observed flags and rejects absent or looping metadata', async () => {
  const requests = [], client = { request: async (_method, params) => { requests.push(params); return { data: [{ name: params.cursor ? 'second' : 'first', enabled: true, defaultEnabled: false, stage: 'stable' }], nextCursor: params.cursor ? null : 'two' }; } };
  const result = await collectNativeFeatures(client, 'owned-thread');
  assert.deepEqual(Object.keys(result.flags), ['first', 'second']); assert.equal(result.pages, 2); assert.equal(requests[1].threadId, 'owned-thread');
  client.request = async () => ({ data: null }); await assert.rejects(collectNativeFeatures(client, 'owned-thread'), /unavailable/);
  let index = 0; client.request = async () => ({ data: [{ name: String(index++), enabled: true }], nextCursor: 'loop' }); await assert.rejects(collectNativeFeatures(client, 'owned-thread'), /Repeated.*cursor/);
});

test('model timeout preserves successful preflight and reports an execution failure', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
  const host = isolatedFakeHost(root, []);
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', timeoutSeconds: 1, spawnHost: (binary, argv, options) => {
    const child = host(binary, argv, options); child.stdin.on('data', bytes => { for (const line of bytes.toString().trim().split('\n')) { const request = JSON.parse(line); const result = request.method === 'turn/start' ? { turn: { id: 'pending' } } : request.method === 'thread/read' ? { thread: { turns: [] } } : request.method === 'thread/items/list' ? { data: [], nextCursor: null } : undefined; if (result) child.stdout.write(`${JSON.stringify({ id: request.id, result })}\n`); } }); return child;
  }, isolationProbe: successfulBoundary });
  assert.equal(report.preflight_passed, true); assert.equal(report.execution_started, true); assert.equal(report.failure_stage, 'execution-or-cleanup'); assert.match(report.failure, /Workflow timeout after 1s/); assert.notEqual(report.status, 'completed-unscored');
});

test('explicit implementation scaffolds only declared outputs and preserves original input baseline', t => {
  const root = rootFor(t); fs.writeFileSync(path.join(root, 'input.md'), 'original input');
  const prepared = { trial: root, task_mode: 'implementation', editable_files: ['rollout-plan.md'], runtime_output_paths: ['reviews/', 'handoffs/'], baseline: [{ path: 'input.md', sha256: 'original' }] }, before = structuredClone(prepared.baseline);
  const policy = stageLinuxImplementation(prepared);
  assert.equal(fs.readFileSync(path.join(root, 'rollout-plan.md')).length, 0); assert.equal(fs.readFileSync(path.join(root, 'input.md'), 'utf8'), 'original input'); assert.deepEqual(prepared.baseline, before);
  assert.equal(policy.atomic_save_supported, false); assert.equal(policy.model_edit_handler_verified, false); assert.equal(policy.scaffolds.find(item => item.path === 'rollout-plan.md').bytes, 0);
  assert.throws(() => stageLinuxImplementation(prepared, { atomicSaveRequired: true }), /Atomic saves/);
  assert.throws(() => stageLinuxImplementation({ ...prepared, runtime_output_paths: ['rollout-plan.md/'] }), /disjoint/);
  assert.throws(() => stageLinuxImplementation({ ...prepared, task_mode: 'review' }), /requires declared/);
  fs.symlinkSync('/tmp', path.join(root, 'escape')); assert.throws(() => stageLinuxImplementation({ ...prepared, editable_files: ['escape/output.md'] }), /symlinks/);
});

test('native parent grant is opt-in and requires existing files with unchanged external denial', t => {
  const root = rootFor(t); fs.writeFileSync(path.join(root, 'output.md'), ''); fs.mkdirSync(path.join(root, 'reviews'));
  const scope = { editableFiles: ['output.md'], runtimeOutputPaths: ['reviews/'] };
  assert.equal(nativePermissionProfile(root, scope).profile.filesystem[root], 'read');
  const composed = nativePermissionProfile(root, { ...scope, readonlyBindFiles: true }); assert.equal(composed.profile.filesystem[root], 'write'); assert.equal(composed.profile.filesystem[':root'], 'deny'); assert.equal(composed.profile.network.enabled, false); assert.equal(composed.profile.filesystem[path.join(root, 'output.md')], undefined);
  assert.throws(() => nativePermissionProfile(root, { ...scope, editableFiles: ['absent.md'], readonlyBindFiles: true }), /ENOENT/);
  assert.throws(() => nativePermissionProfile(root, { ...scope, runtimeOutputPaths: ['file-output'], readonlyBindFiles: true }), /directory runtime outputs/);
});

test('physical mount inventory fails closed for writable trial, extra mounts or wrong exact targets', t => {
  const root = rootFor(t), file = path.join(root, 'output.md'), runtime = path.join(root, 'reviews');
  const line = (id, target, option) => `${id} 1 0:1 / ${target.replaceAll(' ', '\\040')} ${option},relatime - ext4 /dev/root ${option}`;
  const params = { trialRoot: root, editableFiles: ['output.md'], runtimeOutputPaths: ['reviews/'] }, lines = [line(1, root, 'ro'), line(2, file, 'rw'), line(3, runtime, 'rw')];
  assert.equal(assertComposedLinuxMounts({ ...params, mountInfo: lines.join('\n') }).passed, true);
  assert.throws(() => assertComposedLinuxMounts({ ...params, mountInfo: [line(1, root, 'rw'), ...lines.slice(1)].join('\n') }), /uniquely readonly/);
  assert.throws(() => assertComposedLinuxMounts({ ...params, mountInfo: [...lines, line(4, path.join(root, 'private'), 'rw')].join('\n') }), /inventory differs/);
  assert.throws(() => assertComposedLinuxMounts({ ...params, mountInfo: lines.slice(0, -1).join('\n') }), /inventory differs/);
});

test('composed file probes restore declared content after a partially successful native edit', async t => {
  const root = rootFor(t), file = path.join(root, 'output.md'); fs.writeFileSync(file, 'original'); fs.writeFileSync(path.join(root, 'prompt.md'), 'input');
  let calls = 0; const report = await probeComposedLinuxWrites({ binary: 'fake-codex', trialRoot: root, editableFiles: ['output.md'], runtimeOutputPaths: [], runCommand: async invocation => {
    calls++; if (calls === 2) { const patch = invocation.args.at(-1), text = patch.match(/\n\+([^\n]+)/)[1]; fs.writeFileSync(file, `${text}\n`); }
    return { exit_code: calls === 3 ? 1 : 0, cleanup: { terminated: true } };
  } });
  assert.equal(report.passed, false); assert.equal(fs.readFileSync(file, 'utf8'), 'original'); assert.equal(report.restored_hashes[0].unchanged, true);
});

test('composed collector requires mount and edit control proof before model execution', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex')); fs.writeFileSync(path.join(root, 'output.md'), '');
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'implementation', editableFiles: ['output.md'], readonlyBindFiles: true, evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods), isolationProbe: successfulBoundary });
  assert.equal(report.preflight_passed, false); assert.equal(report.execution_started, false); assert.equal(methods.includes('turn/start'), false); assert.match(report.failure, /verified physical mounts/);
});

test('Linux timeout budget preserves its source and rejects unbounded or invalid values', () => {
  const prepared = { timeout_seconds: 300, timeout_origin: 'runner-default' }; assert.deepEqual(linuxTimeout(undefined, prepared), { seconds: 300, origin: 'runner-default', fixture_or_default_seconds: 300 }); assert.equal(linuxTimeout(1200, prepared).origin, 'caller-override');
  for (const bad of [0, 1801, Infinity, NaN, 1.1]) assert.throws(() => linuxTimeout(bad, prepared), /between 1 and 1800/);
});

test('missing verifier runtime fails closed while discovery and executable startup are distinct controls', async t => {
  const root = rootFor(t), calls = [];
  const missing = await probeVerifierAvailability({ binary: 'fake-codex', trialRoot: root, argv: ['python3', '-B', 'observe.py'], scope: {}, runCommand: async invocation => { calls.push(invocation); return { exit_code: 1, stdout: '', cleanup: { terminated: true } }; } });
  assert.equal(missing.passed, false); assert.equal(calls.length, 1);
  let index = 0; const broken = await probeVerifierAvailability({ binary: 'fake-codex', trialRoot: root, argv: ['python3', '-B', 'observe.py'], scope: {}, runCommand: async () => ({ exit_code: index++ ? 127 : 0, stdout: '/usr/bin/python3\n', cleanup: { terminated: true } }) });
  assert.equal(broken.passed, false); assert.equal(broken.checks.length, 2); assert.equal(broken.checks[0].passed, true); assert.equal(broken.checks[1].passed, false);
  assert.equal((await probeVerifierAvailability({ binary: 'unused', trialRoot: root, argv: [], scope: {} })).required, false);
});

test('native role definition evidence preserves names and hashes without claiming a resolved registry', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'), folder = path.join(root, '.codex/agents'); fs.mkdirSync(evidence); fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'tal-reviewer.toml'), 'name="tal-reviewer"\ndescription="Review the owned draft"\ndeveloper_instructions="Read the declared inputs"\n');
  const roles = nativeRoleDefinitions(root); assert.equal(roles[0].name, 'tal-reviewer'); assert.match(roles[0].description_sha256, /^[a-f0-9]{64}$/); assert.equal(roles[0].developer_instructions, undefined);
  let probed = false; const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', expectedNativeRoles: ['tal-missing'], evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, []), isolationProbe: async () => { probed = true; return successfulBoundary(); } });
  assert.equal(probed, false); assert.equal(report.execution_started, false); assert.match(report.failure, /role definition is missing/);
  fs.writeFileSync(path.join(folder, 'tal-reviewer.toml'), 'name="wrong"\ndescription="description"\ndeveloper_instructions="instructions"\n'); assert.throws(() => nativeRoleDefinitions(root), /matching name/);
});

test('unrelated skills and instruction sources fail closed before the boundary or model', async t => {
  for (const options of [{ unrelatedAfterOverride: true }, { instructions: ['/global/AGENTS.md'] }]) {
    const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
    let probed = false;
    const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods, options), isolationProbe: async () => { probed = true; return successfulBoundary(); } });
    assert.equal(probed, false); assert.equal(report.execution_started, false); assert.equal(methods.includes('turn/start'), false);
    assert.match(report.failure, /Unrelated|unrelated/);
  }
});

test('visible review prompts and user inputs keep locators while absent payloads stay explicit gaps', () => {
  const events = [
    { method: 'item/completed', params: { threadId: 'owner', turnId: 'one', item: { id: 'review-call', type: 'collabAgentToolCall', tool: 'spawnAgent', senderThreadId: 'owner', receiverThreadIds: ['reviewer'], prompt: 'Review the stable candidate: exact draft', status: 'completed' } } },
    { tal_request: { method: 'thread/items/list', threadId: 'reviewer' }, result: { data: [{ turnId: 'child-turn', item: { id: 'prompt-item', type: 'userMessage', content: [{ type: 'text', text: 'Received exact draft' }] } }, { turnId: 'child-turn', item: { id: 'answer-item', type: 'agentMessage', text: 'Candidate reviewed', phase: 'final_answer' } }] } },
    { method: 'item/completed', params: { threadId: 'owner', item: { type: 'subAgentActivity', agentThreadId: 'opaque-reviewer', kind: 'interaction' } } }
  ];
  const observed = summarizeEvents(events, '/trial');
  assert.equal(observed.delegation[0].prompt, 'Review the stable candidate: exact draft');
  assert.equal(observed.delegation[1].prompt_available, false);
  assert.equal(observed.messages[0].role, 'user');
  assert.equal(observed.messages[0].turn_id, 'child-turn');
  assert.equal(observed.messages[0].item_id, 'prompt-item');
  assert.match(observed.messages[0].evidence, /result\/data\/0\/item/);
});

test('observed native tool item tags preserve IDs and locators without claiming availability', () => {
  const observed = summarizeEvents([{ method: 'item/completed', params: { threadId: 'owner', turnId: 'turn', item: { id: 'mcp-id', type: 'mcpToolCall', server: 'synthetic-server', tool: 'synthetic-tool', status: 'completed' } } }, { method: 'item/completed', params: { item: { id: 'hidden', type: 'reasoning', text: 'omitted' } } }], '/trial');
  assert.equal(observed.native_items.length, 1);
  assert.deepEqual(observed.native_items[0], { item_type: 'mcpToolCall', item_id: 'mcp-id', thread_id: 'owner', turn_id: 'turn', host_event_method: 'item/completed', tool_name: 'synthetic-tool', server_name: 'synthetic-server', status: 'completed', evidence: 'events.jsonl:1' });
  assert.match(observed.limits[1], /not the complete available tool inventory/);
});

test('history collection follows supported item cursors and reports unsupported or looping histories', async () => {
  const requests = [], limits = [];
  const client = { writeEvent: event => limits.push(event), request: async (method, params) => {
    requests.push({ method, params });
    if (method === 'thread/read') return { thread: { historyMode: 'paginated', turns: [] } };
    return { data: [], nextCursor: params.cursor ? null : 'second' };
  } };
  assert.deepEqual(await collectThreadHistory(client, 'child'), { kind: 'item-pagination', complete: true, pages: 2 });
  assert.equal(requests[2].params.cursor, 'second');
  client.request = async method => method === 'thread/read' ? { thread: { turns: [] } } : { data: [], nextCursor: 'loop' };
  assert.equal((await collectThreadHistory(client, 'child')).complete, false);
  assert.match(limits.at(-1).params.message, /Repeated/);
  client.request = async () => { throw new Error('unsupported history API'); };
  assert.equal((await collectThreadHistory(client, 'child')).complete, false);
  assert.match(limits.at(-1).params.message, /unsupported/);
});

test('child snapshots retain native role metadata and distinguish active reads from terminal completion', async () => {
  const events = [], client = { writeEvent: event => events.push(event), request: async () => ({ thread: { id: 'child', status: { type: 'active' }, source: { subAgent: { thread_spawn: { parent_thread_id: 'parent', agent_role: 'tal-durability', agent_path: '/root/review' } } }, turns: [{ id: 'child-turn', status: 'inProgress', items: [] }] } }) };
  const history = await collectThreadHistory(client, 'child'); assert.equal(history.complete, true); assert.equal(history.thread_snapshot.terminal_turn_observed, false); assert.equal(history.thread_snapshot.agent_role, 'tal-durability'); assert.match(events[0].params.message, /not terminal child completion/);
  const observed = summarizeEvents([{ result: await client.request() }], '/trial'); assert.equal(observed.named_native_children[0].agent_role, 'tal-durability'); assert.equal(observed.named_native_children[0].agent_path, '/root/review');
});

test('an alternate host model mismatch blocks before the boundary probe or model turn', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'), methods = []; fs.mkdirSync(evidence); fs.mkdirSync(path.join(root, '.codex'));
  let probed = false;
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: isolatedFakeHost(root, methods), inheritedDefaults: { model: 'required-inherited-model', reasoning_effort: 'inherited-effort' }, isolationProbe: async () => { probed = true; return successfulBoundary(); } });
  assert.equal(probed, false); assert.equal(report.execution_started, false); assert.equal(methods.includes('turn/start'), false);
  assert.match(report.failure, /inherited preferences/);
});

test('Linux wrapper rejects mutable image tags, root identities, and unvalidated seccomp policies', t => {
  const root = rootFor(t), seccomp = path.join(root, 'profile.json'); fs.writeFileSync(seccomp, '{"defaultAction":"SCMP_ACT_ALLOW"}');
  const args = { image: TESTED_LINUX_IMAGE, runId: '00000000-0000-4000-8000-000000000000', runnerRoot: root, trialRoot: root, homeRoot: root, evidenceRoot: root, authPath: seccomp, seccompPath: seccomp, uid: 501, gid: 20 };
  assert.throws(() => linuxContainerArgs({ ...args, image: 'node:latest' }), /immutable/);
  assert.throws(() => linuxContainerArgs({ ...args, image: `sha256:${'0'.repeat(64)}` }), /exact tested target/);
  assert.throws(() => linuxContainerArgs({ ...args, uid: 0 }), /non-root/);
  assert.throws(() => linuxContainerArgs(args), /differs from the tested/);
});

test('only the two explicit Linux targets are accepted before fixture or account access', async () => {
  assert.equal(linuxTarget(TESTED_LINUX_IMAGE).python_required, false);
  assert.equal(linuxTarget(TESTED_PYTHON_LINUX_IMAGE).python_required, true);
  assert.throws(() => linuxTarget('node:latest'), /immutable/);
  const unknown = `sha256:${'0'.repeat(64)}`;
  assert.throws(() => linuxTarget(unknown), /exact tested targets/);
  await assert.rejects(runLinuxSmoke({ image: unknown, fixtureRoot: '/does-not-exist', outputRoot: '/does-not-exist' }), /exact tested targets/);
});

test('derived target requires exact native and Python runtime identity before authentication', () => {
  const native = { native_binary_sha256: TESTED_LINUX_BINARY_SHA256, native_version: 'codex-cli 0.159.2' };
  assert.equal(assertLinuxTargetRuntime(TESTED_LINUX_IMAGE, native).validated_before_authentication, true);
  const observed = { ...native, python_runtime: { realpath: '/usr/bin/python3.11', sha256: TESTED_PYTHON_BINARY_SHA256, version: 'Python 3.11.2' } };
  assert.equal(assertLinuxTargetRuntime(TESTED_PYTHON_LINUX_IMAGE, observed).python_required, true);
  assert.throws(() => assertLinuxTargetRuntime(TESTED_PYTHON_LINUX_IMAGE, native), /Python runtime/);
  for (const key of ['realpath', 'sha256', 'version']) assert.throws(() => assertLinuxTargetRuntime(TESTED_PYTHON_LINUX_IMAGE, { ...observed, python_runtime: { ...observed.python_runtime, [key]: 'unexpected' } }), /Python runtime/);
  assert.throws(() => assertLinuxTargetRuntime(TESTED_PYTHON_LINUX_IMAGE, { ...observed, native_binary_sha256: 'wrong' }), /native binary/);
  assert.throws(() => assertLinuxTargetRuntime(TESTED_PYTHON_LINUX_IMAGE, { ...observed, native_version: 'codex-cli 0.142.5' }), /native version/);
});

test('readonly Linux review disables optional runtime directories and blocks write-dependent cases', () => {
  const original = { task_mode: 'review', editable_files: [], runtime_output_paths: ['__pycache__/'], verification_argv: [] };
  assert.deepEqual(linuxReviewPolicy(original).granted, []);
  assert.deepEqual(linuxReviewPolicy(original).declared, ['__pycache__/']);
  assert.throws(() => linuxReviewPolicy({ ...original, task_mode: 'implementation' }), /implementation/);
  assert.throws(() => linuxReviewPolicy({ ...original, editable_files: ['service.py'] }), /no edits/);
  assert.throws(() => linuxReviewPolicy({ ...original, verification_argv: ['python3', 'verify.py'] }), /verification/);
  assert.throws(() => linuxReviewPolicy({ ...original, runtime_output_paths: ['output.json'] }), /file outputs/);
});

function fakeDocker(runId, { createTimeout = false, wrongOwner = false, removeFailure = false } = {}) {
  let present = true; const calls = [], id = 'owned-id', name = `tal-native-linux-${runId}`;
  const docker = argv => {
    calls.push(argv);
    if (argv[0] === 'create') { if (createTimeout) throw new Error('Docker create timed out after daemon creation'); return id; }
    if (argv[0] === 'ps') return present ? id : '';
    if (argv[0] === 'inspect') { if (!present) throw new Error('No such object'); return JSON.stringify([{ Id: id, Name: `/${name}`, Config: { Labels: { 'tal.skills.native-linux-run': wrongOwner ? 'foreign' : runId } }, State: { Running: true, ExitCode: 0 } }]); }
    if (argv[0] === 'rm') { if (removeFailure) throw new Error('Docker removal unavailable'); present = false; return id; }
    throw new Error('Unexpected synthetic Docker command');
  };
  return { docker, calls };
}

test('uncertain Docker create recovers and removes only the known UUID-owned container', async () => {
  const runId = '00000000-0000-4000-8000-000000000000', host = fakeDocker(runId, { createTimeout: true });
  let started = false;
  const result = await runOwnedLinuxContainer({ args: ['create'], runId, timeoutMs: 1000, docker: host.docker, runCommand: async () => { started = true; } });
  assert.equal(started, false);
  assert.match(result.failure, /timed out/);
  assert.equal(result.cleanup.container_absent, true);
  assert.equal(host.calls.filter(argv => argv[0] === 'rm').length, 1);
});

test('container ownership and removal failures are retained for the caller final audit', () => {
  const runId = '00000000-0000-4000-8000-000000000000';
  const foreign = fakeDocker(runId, { wrongOwner: true });
  const refused = cleanupLinuxContainer({ runId, docker: foreign.docker });
  assert.equal(refused.container_absent, false);
  assert.equal(foreign.calls.some(argv => argv[0] === 'rm'), false);
  assert.match(refused.errors[0], /ownership/);
  const failed = cleanupLinuxContainer({ runId, docker: fakeDocker(runId, { removeFailure: true }).docker });
  assert.equal(failed.container_absent, false);
  assert.match(failed.errors[0], /removal unavailable/);
});

test('Linux wrapper success requires verified host transport cleanup and complete audits', () => {
  const run = { execution: { exit_code: 0, timed_out: false }, cleanup: { container_absent: true, host_transport: { terminated: true } }, original_auth_unchanged: true, original_config_unchanged: true, changed_files: [] };
  assert.equal(linuxRunPassed(run), true);
  assert.equal(linuxRunPassed({ ...run, cleanup: { ...run.cleanup, host_transport: { terminated: false } } }), false);
  assert.equal(linuxRunPassed({ ...run, cleanup: { ...run.cleanup, host_transport: null } }), false);
  assert.equal(linuxRunPassed({ ...run, audit_errors: ['unavailable audit'] }), false);
  const authorized = { ...run, changed_files: [{ path: 'output.md', allowed: true }] };
  assert.equal(linuxRunPassed(authorized), false);
  assert.equal(linuxRunPassed({ ...authorized, allow_declared_changes: true }), true);
  assert.equal(linuxRunPassed({ ...authorized, allow_declared_changes: true, changed_files: [{ path: 'input.md', allowed: false }] }), false);
});

test('session trust safely encodes a quoted path as an inline TOML table without model overrides', t => {
  const base = rootFor(t), root = path.join(base, 'quoted "project" ü'); fs.mkdirSync(root);
  const args = sessionOverrides(root);
  assert.equal(TOML.parse(args.find(value => value.startsWith('projects='))).projects[root].trust_level, 'trusted');
  assert.equal(args.some(value => /model|reasoning/.test(value)), false);
});

test('RPC client correlates responses and preserves notifications while redacting config details', async () => {
  const logged = [];
  const child = fakeChild((request, send) => { send({ method: 'thread/started', params: { thread: { id: 'one' } } }); send({ id: request.id, result: { config: { model: 'inherited', private_endpoint: 'never-publish' } } }); });
  const client = new AppServerClient(child, { writeEvent: event => logged.push(event) });
  const result = await client.request('config/read');
  assert.equal(result.config.private_endpoint, 'never-publish');
  assert.equal(JSON.stringify(logged).includes('never-publish'), false);
  assert.equal(logged[0].method, 'thread/started');
});

test('RPC timeout is bounded and unexpected interactive requests are never granted', async () => {
  const sent = [];
  const child = fakeChild(request => sent.push(request));
  const client = new AppServerClient(child, { requestTimeoutMs: 20 });
  const blocked = new Promise(resolve => client.once('interactive-request', resolve));
  child.stdout.write(`${JSON.stringify({ id: 9, method: 'item/commandExecution/requestApproval', params: {} })}\n`);
  await blocked; await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(sent[0].error.code, -32601);
  await assert.rejects(client.request('never-replies'), /RPC timeout/);
});

test('observation does not infer native role dispatch from assistant self-report', () => {
  const observation = summarizeEvents([{ method: 'item/completed', params: { threadId: 'primary', item: { type: 'agentMessage', text: 'I used tal-python and read the skill.' } } }], '/trial');
  assert.equal(observation.named_native_children.length, 0);
  assert.equal(observation.observed_reads.length, 0);
});

test('protocol-only V2 activity without child thread/started still records native role identity and child skill reads', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence);
  fs.mkdirSync(path.join(root, '.codex'));
  const workflow = 'tal-backend-delivery', requests = [];
  const spawnHost = (_binary, argv) => {
    assert.equal(argv.some(value => /model=|reasoning/.test(value)), false);
    return fakeChild((request, send) => {
      requests.push(request);
      const response = result => send({ id: request.id, result });
      if (request.method === 'initialize') response({ userAgent: 'fake-schema-host' });
      if (request.method === 'config/read') response(selectedConfig(argv, root));
      if (request.method === 'skills/list') response({ data: [{ skills: [{ name: workflow, description: 'Workflow description', path: path.join(root, '.agents/skills', workflow, 'SKILL.md'), enabled: true, scope: 'repo' }], errors: [] }] });
      if (request.method === 'thread/start') response({ activePermissionProfile: { id: request.params.permissions }, instructionSources: [], thread: { id: 'primary', model: 'inherited', reasoningEffort: 'inherited-effort', ephemeral: false, environments: request.params.environments } });
      const metadata = metadataResult(request, root); if (metadata) response(metadata);
      if (request.method === 'turn/start') {
        response({ turn: { id: 'turn-1', status: 'inProgress' } });
        send({ method: 'turn/started', params: { threadId: 'primary', turn: { id: 'turn-1' } } });
        send({ method: 'item/completed', params: { threadId: 'primary', item: { type: 'subAgentActivity', agentThreadId: 'child', agentPath: '/root/python', kind: 'started' } } });
        send({ method: 'turn/completed', params: { threadId: 'primary', turn: { id: 'turn-1', status: 'completed' } } });
      }
      if (request.method === 'thread/read') response({ thread: { id: request.params.threadId, parentThreadId: request.params.threadId === 'child' ? 'primary' : null, agentRole: request.params.threadId === 'child' ? 'tal-python' : null, model: 'inherited', turns: [{ id: 'visible-turn', items: request.params.threadId === 'child' ? [{ id: 'read-1', type: 'commandExecution', cwd: root, command: 'cat .agents/skills/python-backend/SKILL.md', commandActions: [{ type: 'read', path: '.agents/skills/python-backend/SKILL.md' }], exitCode: 0, status: 'completed' }] : [] }] } });
    });
  };
  const report = await collectNativeRun({ trialRoot: root, workflow, prompt: 'Perform the local task.', mode: 'implementation', evidenceRoot: evidence, binary: 'fake-host', spawnHost, isolationProbe: successfulBoundary });
  assert.equal(report.status, 'completed-unscored');
  assert.equal(report.model_override, false);
  assert.equal(report.observed.named_native_children[0].agent_role, 'tal-python');
  assert.equal(report.observed.observed_reads[0].path, '.agents/skills/python-backend/SKILL.md');
  assert.match(report.observed.observed_reads[0].evidence, /result\/thread\/turns/);
  assert.equal(requests.some(x => x.method === 'turn/start' && x.params.model), false);
  assert.equal(requests.find(x => x.method === 'thread/start').params.ephemeral, false);
  assert.deepEqual(report.thread_persistence, { requested_ephemeral: false, observed_ephemeral: false, root_path: null });
  assert.equal(requests.find(x => x.method === 'turn/start').params.permissions, nativePermissionProfile(root).id);
  assert.deepEqual(requests.find(x => x.method === 'thread/start').params.environments, [nativeLocalEnvironment(root)]);
  assert.deepEqual(requests.find(x => x.method === 'turn/start').params.environments, [nativeLocalEnvironment(root)]);
  assert.equal(requests.find(x => x.method === 'turn/start').params.sandboxPolicy, undefined);
  assert.equal(report.case_compliant, false);
  assert.ok(report.capability_deviations.length);
  assert.equal(report.global_config_unchanged, true);
  assert.equal(report.global_config_observation.before.sha256, report.global_config_observation.after.sha256);
  assert.equal(report.global_config_observation.change_attribution, 'not-applicable');
  assert.match(report.global_config_observation.before.observed_at, /^\d{4}-\d\d-\d\dT/);
  const validate = new Ajv().compile(JSON.parse(fs.readFileSync('evals/engineering-toolkit/native-planning/run-record.schema.json', 'utf8')));
  assert.equal(validate(report), true, JSON.stringify(validate.errors));
});

test('child discovery uses native activity and observed thread IDs, not assistant text', () => {
  const events = [
    { method: 'item/completed', params: { threadId: 'root', item: { type: 'agentMessage', text: 'I spawned invented-child.' } } },
    { method: 'item/completed', params: { threadId: 'command-only-child', item: { type: 'commandExecution' } } },
    { method: 'item/completed', params: { threadId: 'root', item: { type: 'subAgentActivity', agentThreadId: 'activity-child' } } },
    { method: 'thread/started', params: { thread: { id: 'started-child', parentThreadId: 'root' } } },
    { method: 'item/completed', params: { threadId: 'root', item: { type: 'collabAgentToolCall', receiverThreadIds: ['legacy-child', 'root', 'activity-child'] } } }
  ];
  assert.deepEqual(discoveredChildThreads(events, 'root'), ['command-only-child', 'activity-child', 'started-child', 'legacy-child']);
});

test('preparation withholds rubrics, preserves native inputs, and detects unauthorized source changes', t => {
  const f = createFixture(t), fixtureRoot = path.join(f.directory, 'native-fixtures');
  fs.mkdirSync(path.join(fixtureRoot, 'tal-backend-delivery/rawfiles'), { recursive: true });
  fs.writeFileSync(path.join(fixtureRoot, 'case-index.json'), JSON.stringify({ cases: [{ id: 'tal-backend-delivery', task_mode: 'implement', editable_files: ['service.py', 'test_service.py'], runtime_output_paths: ['__pycache__/'], verification_argv: ['python3', '-B', 'verify.py'], acceptance: ['WITHHELD-RUBRIC'] }] }));
  fs.writeFileSync(path.join(fixtureRoot, 'tal-backend-delivery/prompt.md'), 'Fix service.py.');
  fs.writeFileSync(path.join(fixtureRoot, 'tal-backend-delivery/rawfiles/service.py'), 'print(1)\n');
  fs.writeFileSync(path.join(fixtureRoot, 'tal-backend-delivery/rawfiles/verify.py'), 'print("checks")\n');
  const prepared = prepareCase({ sourceRoot: f.source, fixtureRoot, caseId: 'tal-backend-delivery', outputRoot: path.join(f.directory, 'prepared') });
  assert.equal(prepared.status, 'prepared-no-model-execution');
  assert.equal(fs.existsSync(path.join(prepared.trial, 'case-index.json')), false);
  assert.equal(JSON.stringify(prepared).includes('WITHHELD-RUBRIC'), false);
  fs.appendFileSync(path.join(prepared.trial, 'service.py'), '# change\n');
  fs.writeFileSync(path.join(prepared.trial, 'test_service.py'), '# permitted new test\n');
  fs.appendFileSync(path.join(prepared.trial, 'verify.py'), '# unauthorized\n');
  fs.mkdirSync(path.join(prepared.trial, '__pycache__')); fs.writeFileSync(path.join(prepared.trial, '__pycache__/generated.pyc'), 'temporary');
  const changes = scopeChanges(prepared);
  assert.equal(changes.find(x => x.path === 'service.py').allowed, true);
  assert.equal(changes.find(x => x.path === 'test_service.py').allowed, true);
  assert.equal(changes.find(x => x.path === 'verify.py').allowed, false);
  assert.equal(changes.find(x => x.path.startsWith('__pycache__/')).allowed, true);
});

test('missing native discovery ends before thread/start or model execution', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence);
  const methods = [];
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: () => fakeChild((request, send) => {
    methods.push(request.method);
    if (request.id !== undefined) send({ id: request.id, result: request.method === 'skills/list' ? { data: [{ skills: [] }] } : {} });
  }) });
  assert.equal(report.execution_started, false);
  assert.equal(report.status, 'blocked-or-failed');
  assert.match(report.failure, /not discovered/);
  assert.equal(methods.includes('thread/start'), false);
});

test('malformed protocol output is reported without treating it as native evidence', async () => {
  const child = fakeChild(() => {}), client = new AppServerClient(child, { requestTimeoutMs: 50 });
  const request = client.request('config/read');
  child.stdout.write('not-json\n');
  await assert.rejects(request, /JSON|Unexpected token/);
});

test('late config response stays redacted after its request timeout', async () => {
  const logged = [], child = fakeChild(() => {});
  const client = new AppServerClient(child, { requestTimeoutMs: 5, writeEvent: value => logged.push(value) });
  await assert.rejects(client.request('config/read'), /RPC timeout/);
  client.accept({ id: 1, result: { config: { model: 'inherited', private_endpoint: 'synthetic-private-marker' } } });
  assert.equal(logged[0].result.model, 'inherited');
  assert.equal(JSON.stringify(logged).includes('synthetic-private-marker'), false);
});

test('observable traces omit reasoning payloads from notifications and nested thread snapshots', () => {
  const values = [{ method: 'item/reasoning/textDelta', params: { threadId: 'one', delta: 'private-marker' } }, { result: { thread: { reasoningEffort: 'inherited', turns: [{ items: [{ type: 'reasoning', id: 'r', summary: ['private-marker'], content: ['private-marker'] }, { type: 'agentMessage', text: 'public answer', encrypted_content: 'private-marker' }] }] } } }];
  const visible = observableTrace(values);
  assert.equal(JSON.stringify(visible).includes('private-marker'), false);
  assert.equal(visible[1].result.thread.reasoningEffort, 'inherited');
  assert.equal(visible[1].result.thread.turns[0].items[1].text, 'public answer');
});

test('owned process-group cleanup stops a real leader and its SIGTERM-ignoring descendant', { skip: process.platform === 'win32' }, async t => {
  const root = rootFor(t);
  const source = `const {spawn}=require('node:child_process'); process.on('SIGTERM',()=>{}); const c=spawn(process.execPath,['-e', 'process.on("SIGTERM",()=>{}); console.log("ready"); setInterval(()=>{},1000)'],{stdio:['ignore','pipe','inherit']}); c.stdout.on('data',()=>console.log(c.pid)); setInterval(()=>{},1000);`;
  const child = spawnOwned(process.execPath, ['-e', source], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  let readyTimer;
  await Promise.race([new Promise(resolve => child.stdout.once('data', resolve)), new Promise((_, reject) => { readyTimer = setTimeout(() => reject(new Error('Descendant did not start')), 5000); })]).finally(() => clearTimeout(readyTimer));
  const cleanup = await stopHost(child, { graceMs: 100 });
  assert.equal(cleanup.owned_process_group, child.pid);
  assert.equal(cleanup.terminated, true);
  assert.deepEqual(cleanup.remaining_live_processes, []);
});

test('bounded commands time out and clean up the owned process group', { skip: process.platform === 'win32' }, async t => {
  const result = await runBoundedCommand({ binary: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'], options: { cwd: rootFor(t), stdio: ['pipe', 'pipe', 'pipe'] }, timeoutMs: 30 });
  assert.equal(result.timed_out, true);
  assert.equal(result.cleanup.terminated, true);
});

test('independent verifier uses native managed sandbox, disabled network, and a credential-free environment', t => {
  const root = rootFor(t), invocation = verifierInvocation('codex', root, ['python3', '-B', 'verify.py']);
  const profile = nativePermissionProfile(root);
  assert.equal(invocation.args[2], profile.id);
  assert.equal(invocation.args.includes('--include-managed-config'), true);
  assert.deepEqual(TOML.parse(invocation.args[5]).permissions[profile.id], profile.profile);
  assert.deepEqual(invocation.args.slice(-4), ['--', 'python3', '-B', 'verify.py']);
  assert.deepEqual(Object.keys(invocation.options.env).filter(key => /TOKEN|SECRET|KEY|PASSWORD/.test(key)), []);
  assert.equal(invocation.options.env.HOME, process.env.HOME);
});

test('asynchronous stdin EPIPE records failure and still cleans up the host', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence);
  let child;
  const report = await collectNativeRun({ trialRoot: root, workflow: 'tal-backend-delivery', prompt: 'Do the task.', mode: 'review', evidenceRoot: evidence, binary: 'fake-host', spawnHost: () => {
    child = fakeChild(() => child.stdin.emit('error', Object.assign(new Error('synthetic EPIPE'), { code: 'EPIPE' })));
    return child;
  } });
  assert.equal(report.execution_started, false);
  assert.equal(report.status, 'blocked-or-failed');
  assert.match(report.failure, /synthetic EPIPE/);
  assert.equal(report.cleanup.terminated, true);
  assert.equal(fs.existsSync(path.join(evidence, 'run.json')), true);
});
