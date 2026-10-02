#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { options, repositoryRoot } from './toolkit/cli.mjs';
import { readTree, sha256, contained, safeRelative } from './toolkit/paths.mjs';
import { AppServerClient, spawnOwned, stopHost, sessionOverrides, prepareCase, collectNativeRun, probeNativeIsolation, scopeChanges, runBoundedCommand, verifierInvocation, nativePermissionProfile } from './native-smoke.mjs';

// Explicit opt-in alternate host. This wrapper never installs software or
// silently substitutes a different native binary. The tested image contains
// official @openai/codex 0.159.2, Node 24 and pinned CA/nc/ps packages. The
// separately tested derived target adds Debian's signed Python packages.
export const TESTED_LINUX_IMAGE = 'sha256:9076492a589ef293008a171ecf4a118d735f775f78fc4c04ccbc5cac5b252783';
export const TESTED_PYTHON_LINUX_IMAGE = 'sha256:0da57c19da961dfda2bf169edad81cbe4407d3c1d056f2c1edbcdc3ede6d9652';
export const TESTED_LINUX_BINARY_SHA256 = '113aa5d5952a6fd3950a88323219747d0c91978ebee948509a540c8a460e59a3';
export const TESTED_PYTHON_BINARY_SHA256 = '304aa87a76ebb13fd22d253ac157f14980ff2cdb23e6274f3b045571405e07dc';
export const TESTED_SECCOMP_SHA256 = 'a10f9206f58d22c6b7d1fe4b82899bd4b5f0e5362cfbc4d9030ffab30678e5e7';
export function linuxTarget(image) {
  if (!/^sha256:[a-f0-9]{64}$/.test(image)) throw new Error('An immutable local Docker image id is required');
  if (image === TESTED_LINUX_IMAGE) return { image, kind: 'original-review-target', python_required: false };
  if (image === TESTED_PYTHON_LINUX_IMAGE) return { image, kind: 'derived-python-target', python_required: true };
  throw new Error('Linux image differs from the exact tested targets');
}
export function assertLinuxTargetRuntime(image, observed) {
  const target = linuxTarget(image);
  if (observed.native_binary_sha256 !== TESTED_LINUX_BINARY_SHA256) throw new Error('Linux native binary differs from the exact tested target');
  if (observed.native_version !== 'codex-cli 0.159.2') throw new Error('Linux image native version differs from the validated target');
  if (target.python_required && (observed.python_runtime?.realpath !== '/usr/bin/python3.11' || observed.python_runtime?.sha256 !== TESTED_PYTHON_BINARY_SHA256 || observed.python_runtime?.version !== 'Python 3.11.2')) throw new Error('Python runtime differs from the exact tested derived target');
  return { ...target, ...observed, validated_before_authentication: true };
}
const label = 'tal.skills.native-linux-run';
const json = (filename, value) => fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
function command(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 20000 });
  if (result.status !== 0) throw new Error(`Docker ${args[0]} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout.trim();
}
function mount(source, target, readonly = true) {
  if (/[\r\n,]/.test(source)) throw new Error('Docker bind paths cannot contain commas or newlines');
  return `type=bind,source=${fs.realpathSync(source)},target=${target}${readonly ? ',readonly' : ''}`;
}
export function linuxContainerArgs({ image, runId, runnerRoot, trialRoot, homeRoot, evidenceRoot, authPath, seccompPath, uid, gid, editableFiles = [], runtimeOutputPaths = [] }) {
  linuxTarget(image);
  if (!/^[a-f0-9-]{36}$/.test(runId)) throw new Error('A fresh UUID run identity is required');
  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(gid) || gid < 0) throw new Error('Linux smoke requires a non-root numeric identity');
  if (sha256(fs.readFileSync(seccompPath)) !== TESTED_SECCOMP_SHA256) throw new Error('Seccomp profile differs from the tested namespace-only additions');
  if (editableFiles.length) nativePermissionProfile(trialRoot, { editableFiles, runtimeOutputPaths, readonlyBindFiles: true });
  else if (runtimeOutputPaths.length) throw new Error('Runtime write mounts require explicit declared-file implementation mode');
  const writes = [...editableFiles, ...runtimeOutputPaths].flatMap(name => ['--mount', mount(contained(trialRoot, name.replace(/\/$/, '')), `/trial/${name.replace(/\/$/, '')}`, false)]);
  return ['create', '--pull=never', '--name', `tal-native-linux-${runId}`, '--label', `${label}=${runId}`, '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--security-opt', `seccomp=${fs.realpathSync(seccompPath)}`, '--user', `${uid}:${gid}`, '-e', 'HOME=/home/node', '--pids-limit', '256', '--memory', '1g', '--cpus', '2', '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m', '--tmpfs', '/probe:rw,nosuid,nodev,size=32m', '--mount', mount(runnerRoot, '/app'), '--mount', mount(trialRoot, '/trial'), ...writes, '--mount', mount(homeRoot, '/home/node/.codex', false), '--mount', mount(authPath, '/home/node/.codex/auth.json'), '--mount', mount(evidenceRoot, '/evidence', false), image, 'node', '/app/scripts/native-linux-smoke.mjs', '--internal-driver', '/app/driver.json'];
}
export function linuxReviewPolicy(prepared) {
  if (prepared.task_mode !== 'review' || prepared.editable_files.length) throw new Error('Linux wrapper currently permits review-only fixtures with no edits; implementation edit methods remain unverified');
  if (prepared.runtime_output_paths.some(name => !name.endsWith('/')) || (prepared.runtime_output_paths.length && prepared.verification_argv.length)) throw new Error('Readonly Linux review cannot support file outputs or verification with declared runtime writes');
  return { declared: prepared.runtime_output_paths, granted: [], enforcement: 'Entire trial is physically readonly; optional declared runtime directories are disabled and receive no native write grant.' };
}
export function stageLinuxImplementation(prepared, { atomicSaveRequired = false } = {}) {
  if (prepared.task_mode !== 'implementation' || !prepared.editable_files.length) throw new Error('Existing-file implementation requires declared editable outputs');
  if (atomicSaveRequired) throw new Error('Atomic saves are unsupported by exact writable file mounts');
  if (prepared.runtime_output_paths.some(name => !name.endsWith('/'))) throw new Error('Implementation runtime outputs must be declared directories');
  const names = [...prepared.editable_files, ...prepared.runtime_output_paths.map(name => name.slice(0, -1))];
  for (const name of names) {
    safeRelative(name);
    if (name.startsWith('.') || name === 'prompt.md') throw new Error('Writable mounts cannot include runner-managed paths');
    if (names.some(other => other !== name && (name.startsWith(`${other}/`) || other.startsWith(`${name}/`))) || names.filter(other => other === name).length > 1) throw new Error('Declared writable mounts must be disjoint');
  }
  // Check all existing ancestors before making scaffolds; no supplied input or
  // symlink is modified. Empty placeholders contain no task answer.
  nativePermissionProfile(prepared.trial, { editableFiles: prepared.editable_files, runtimeOutputPaths: prepared.runtime_output_paths });
  const scaffolds = [];
  for (const name of prepared.editable_files) {
    const target = contained(prepared.trial, name);
    if (!fs.existsSync(target)) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, '', { flag: 'wx', mode: 0o644 }); scaffolds.push({ path: name, kind: 'empty-declared-output', bytes: 0, sha256: sha256(Buffer.alloc(0)) }); }
    else if (!fs.lstatSync(target).isFile()) throw new Error('Declared editable outputs must be regular files');
  }
  for (const name of [...prepared.runtime_output_paths, '.git/', '.aws/']) {
    const target = contained(prepared.trial, name.slice(0, -1));
    if (!fs.existsSync(target)) { fs.mkdirSync(target, { recursive: true }); scaffolds.push({ path: name, kind: name.startsWith('.') ? 'empty-native-reserved-directory' : 'empty-declared-runtime-directory' }); }
    else if (!fs.lstatSync(target).isDirectory() || fs.lstatSync(target).isSymbolicLink()) throw new Error('Runtime/reserved paths must be directories without symlinks');
  }
  return { declared: prepared.runtime_output_paths, granted: prepared.runtime_output_paths, editable_files: prepared.editable_files, scaffolds, original_baseline_preserved: true, atomic_save_supported: false, model_edit_handler_verified: false, enforcement: 'Physically readonly trial with exact writable existing-file and declared runtime-directory bind mounts; native parent-directory write grant alone does not grant physical writes.' };
}
export function assertComposedLinuxMounts({ mountInfo, trialRoot, editableFiles, runtimeOutputPaths }) {
  const decode = value => value.replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
  const mounts = mountInfo.split('\n').filter(Boolean).map(line => { const fields = line.split(' - ')[0].split(' '); return { target: decode(fields[4]), options: fields[5]?.split(',') ?? [] }; });
  const root = mounts.filter(item => item.target === trialRoot);
  if (root.length !== 1 || !root[0].options.includes('ro')) throw new Error('Composed trial mount is not uniquely readonly');
  const expected = [...editableFiles, ...runtimeOutputPaths].map(name => contained(trialRoot, name.replace(/\/$/, '')));
  const nested = mounts.filter(item => item.target.startsWith(`${trialRoot}/`));
  if (nested.length !== expected.length || nested.some(item => !expected.includes(item.target) || !item.options.includes('rw')) || expected.some(target => nested.filter(item => item.target === target).length !== 1)) throw new Error('Composed writable mount inventory differs from declared exact targets');
  return { passed: true, readonly_trial: root[0], writable_targets: nested, basis: 'Actual container /proc/self/mountinfo; all nested trial mounts must match declared writable targets' };
}
export async function probeComposedLinuxWrites({ binary, trialRoot, editableFiles, runtimeOutputPaths, runCommand = runBoundedCommand }) {
  const checks = [], restored = [], ownedRuntime = [], scope = { editableFiles, runtimeOutputPaths, readonlyBindFiles: true };
  const execute = async (id, argv, expected) => {
    const invocation = verifierInvocation(binary, trialRoot, argv, scope), result = await runCommand({ ...invocation, timeoutMs: 10000 });
    const passed = !result.error && !result.timed_out && result.cleanup?.terminated && (expected === 0 ? result.exit_code === 0 : [1, 2].includes(result.exit_code));
    checks.push({ id, expected_exit: expected, passed, argv: [invocation.binary, ...invocation.args], ...result }); return passed;
  };
  const id = crypto.randomUUID(), immutable = path.join(trialRoot, 'prompt.md'), immutableBefore = sha256(fs.readFileSync(immutable)), absent = path.join(trialRoot, `tal-undeclared-${id}.md`);
  try {
    if (!await execute('composed-sandbox-startup', ['/usr/bin/true'], 0)) return { passed: false, checks };
    for (const [index, name] of editableFiles.entries()) {
      const target = contained(trialRoot, name), before = fs.readFileSync(target); restored.push({ target, before });
      const text = `owned-inplace-probe-${id}`, patch = `*** Begin Patch\n*** Add File: ${name}\n+${text}\n*** End Patch`;
      if (!await execute(`composed-native-add-existing-${index + 1}`, [binary, '--codex-run-as-apply-patch', patch], 0)) break;
      checks.at(-1).passed &&= fs.readFileSync(target, 'utf8') === `${text}\n`;
      if (!checks.at(-1).passed) break;
      const update = `*** Begin Patch\n*** Update File: ${name}\n@@\n-${text}\n+${text}-updated\n*** End Patch`;
      if (!await execute(`composed-native-update-existing-${index + 1}`, [binary, '--codex-run-as-apply-patch', update], 0)) break;
      checks.at(-1).passed &&= fs.readFileSync(target, 'utf8') === `${text}-updated\n`;
    }
    if (checks.every(check => check.passed)) {
      for (const [index, name] of runtimeOutputPaths.entries()) {
        const target = contained(trialRoot, `${name}tal-probe-${id}`); ownedRuntime.push(target);
        await execute(`composed-runtime-write-${index + 1}`, ['/usr/local/bin/node', '-e', 'require("fs").writeFileSync(process.argv[1],"owned-runtime-probe\\n")', target], 0);
        checks.at(-1).passed &&= fs.existsSync(target) && fs.readFileSync(target, 'utf8') === 'owned-runtime-probe\n';
      }
      await execute('composed-immutable-write-denied', ['/usr/local/bin/node', '-e', 'require("fs").writeFileSync(process.argv[1],"forbidden")', immutable], 'denied');
      await execute('composed-new-file-denied', [binary, '--codex-run-as-apply-patch', `*** Begin Patch\n*** Add File: ${path.basename(absent)}\n+forbidden\n*** End Patch`], 'denied');
      await execute('composed-atomic-parent-temp-denied', ['/usr/local/bin/node', '-e', 'require("fs").writeFileSync(process.argv[1],"forbidden")', absent], 'denied');
      if (ownedRuntime.length) await execute('composed-atomic-bound-file-rename-denied', ['/usr/local/bin/node', '-e', 'require("fs").renameSync(process.argv[1],process.argv[2])', ownedRuntime[0], contained(trialRoot, editableFiles[0])], 'denied');
    }
  } finally { for (const { target, before } of restored) fs.writeFileSync(target, before); for (const target of ownedRuntime) fs.rmSync(target, { force: true }); }
  const restoredHashes = restored.map(({ target, before }) => ({ path: path.relative(trialRoot, target), unchanged: sha256(fs.readFileSync(target)) === sha256(before) }));
  return { passed: checks.every(check => check.passed) && checks.length === 1 + editableFiles.length * 2 + runtimeOutputPaths.length + 3 + (runtimeOutputPaths.length ? 1 : 0) && restoredHashes.every(item => item.unchanged) && sha256(fs.readFileSync(immutable)) === immutableBefore && !fs.existsSync(absent), checks, restored_hashes: restoredHashes, limits: ['Actual installed patch CLI helper is tested under native command sandbox; actual model edit handler remains unverified.', 'Atomic save and absent undeclared file creation are denied; no writable parent fallback.'] };
}
// Recover by the predeclared identity even if Docker create succeeded daemon-side
// but its client failed before returning an id. Audit errors are retained and
// never prevent the caller from writing its final failure record.
export function cleanupLinuxContainer({ runId, containerId, docker = command }) {
  const name = `tal-native-linux-${runId}`, errors = [], candidates = new Set(containerId ? [containerId] : []), verified = new Map(), states = [];
  const list = () => docker(['ps', '-a', '--filter', `label=${label}=${runId}`, '--format', '{{.ID}}']).split(/\s+/).filter(Boolean);
  const inspectName = () => {
    try { return JSON.parse(docker(['inspect', name]))[0]; }
    catch (error) { if (!/No such (object|container)/i.test(error.message)) errors.push(error.message); return null; }
  };
  try { for (const id of list()) candidates.add(id); } catch (error) { errors.push(error.message); }
  const named = inspectName(); if (named) candidates.add(named.Id);
  for (const id of candidates) {
    try {
      const inspected = JSON.parse(docker(['inspect', id]))[0];
      if (inspected.Config.Labels?.[label] !== runId || inspected.Name !== `/${name}`) throw new Error('Refusing cleanup of a container with the wrong ownership identity');
      verified.set(inspected.Id, inspected);
    } catch (error) { errors.push(error.message); }
  }
  for (const [id, inspected] of verified) {
    states.push({ id, running: inspected.State.Running, exit_code: inspected.State.ExitCode });
    try { docker(['rm', '--force', id]); } catch (error) { errors.push(error.message); }
  }
  let remaining = null;
  try { remaining = list(); } catch (error) { errors.push(error.message); }
  const finalNamed = inspectName();
  return { container_absent: remaining?.length === 0 && !finalNamed && errors.length === 0, remaining_container_ids: remaining, states_before_removal: states, errors };
}
export async function runOwnedLinuxContainer({ args, runId, timeoutMs, docker = command, runCommand = runBoundedCommand }) {
  let containerId = null, execution = null, failure = null;
  try {
    containerId = docker(args);
    execution = await runCommand({ binary: 'docker', args: ['start', '--attach', containerId], options: { stdio: ['pipe', 'pipe', 'pipe'] }, timeoutMs });
  } catch (error) { failure = error.message; }
  const cleanup = { ...cleanupLinuxContainer({ runId, containerId, docker }), host_transport: execution?.cleanup ?? null };
  return { execution, cleanup, failure };
}
export function linuxRunPassed({ execution, cleanup, original_auth_unchanged, original_config_unchanged, changed_files, audit_errors = [], allow_declared_changes = false }) {
  return execution?.exit_code === 0 && !execution.timed_out && cleanup.container_absent && cleanup.host_transport?.terminated === true && original_auth_unchanged && original_config_unchanged && Array.isArray(changed_files) && changed_files.every(change => allow_declared_changes && change.allowed === true) && audit_errors.length === 0;
}
async function readInheritedDefaults(binary, trial) {
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (version.status !== 0 || version.stdout.trim() !== 'codex-cli 0.159.2') throw new Error('The preference source must be the installed Codex 0.159.2 binary');
  const child = spawnOwned(binary, ['app-server', '--stdio', ...sessionOverrides(trial)], { cwd: trial, stdio: ['pipe', 'pipe', 'pipe'] });
  const client = new AppServerClient(child); client.on('protocol-error', () => {});
  try {
    await client.request('initialize', { clientInfo: { name: 'tal-inherited-preferences', version: '1' }, capabilities: { experimentalApi: true } }); client.notify('initialized');
    const { config } = await client.request('config/read', { cwd: trial });
    if (typeof config.model !== 'string' || !config.model) throw new Error('Effective inherited model was not exposed');
    if (config.model_provider && config.model_provider !== 'openai') throw new Error('Custom provider transport has not been validated for this Linux target');
    if (config.agents?.default_subagent_model || config.agents?.default_subagent_reasoning_effort) throw new Error('Custom child defaults need explicit transport validation');
    return { model: config.model, reasoning_effort: config.model_reasoning_effort ?? null, model_provider: config.model_provider ?? 'openai', source_binary: binary, source_binary_sha256: sha256(fs.readFileSync(fs.realpathSync(binary))) };
  } finally { const cleanup = await stopHost(child); if (!cleanup.terminated) throw new Error('Preference metadata host cleanup failed'); }
}
function copyRuntime(destination) {
  const files = ['scripts/native-smoke.mjs', 'scripts/native-linux-smoke.mjs', 'scripts/lib/markdown-links.mjs', ...[...readTree(repositoryRoot, 'scripts/toolkit')].map(([filename]) => filename)];
  const hashes = {};
  for (const filename of files) { const target = path.join(destination, filename); fs.mkdirSync(path.dirname(target), { recursive: true }); const bytes = fs.readFileSync(path.join(repositoryRoot, filename)); fs.writeFileSync(target, bytes); hashes[filename] = sha256(bytes); }
  for (const name of ['@iarna/toml', 'yaml']) {
    const source = path.join(repositoryRoot, 'node_modules', name), target = path.join(destination, 'node_modules', name);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.cpSync(source, target, { recursive: true, dereference: false });
    hashes[`node_modules/${name}/package.json`] = sha256(fs.readFileSync(path.join(source, 'package.json')));
  }
  return hashes;
}
async function driver(inputFile) {
  const input = JSON.parse(fs.readFileSync(inputFile, 'utf8')), binary = '/usr/local/bin/codex';
  const target = linuxTarget(input.image);
  const nativeBinary = '/usr/local/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-arm64/vendor/aarch64-unknown-linux-musl/bin/codex';
  const binarySha256 = sha256(fs.readFileSync(nativeBinary));
  if (binarySha256 !== TESTED_LINUX_BINARY_SHA256) throw new Error('Linux native binary differs from the exact tested target');
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 });
  if (version.status !== 0 || version.stdout.trim() !== 'codex-cli 0.159.2') throw new Error('Linux image native version differs from the validated target');
  let pythonRuntime = null;
  if (target.python_required) {
    const executable = '/usr/bin/python3', realpath = fs.realpathSync(executable), python = spawnSync(executable, ['--version'], { encoding: 'utf8', timeout: 10000 });
    if (python.status !== 0) throw new Error('Pinned Python runtime startup failed before authentication');
    pythonRuntime = { executable, realpath, sha256: sha256(fs.readFileSync(realpath)), version: python.stdout.trim() };
  }
  const targetRuntime = assertLinuxTargetRuntime(input.image, { native_binary_sha256: binarySha256, native_version: version.stdout.trim(), python_runtime: pythonRuntime });
  const schema = spawnSync(binary, ['app-server', 'generate-json-schema', '--experimental', '--out', '/evidence/schema'], { encoding: 'utf8', timeout: 10000 });
  if (schema.status !== 0) throw new Error('Installed Linux native schema generation failed');
  const schemaHashes = Object.fromEntries([...readTree('/evidence', 'schema')].map(([name, file]) => [name, sha256(file.bytes)]));
  const authHost = spawnOwned(binary, ['app-server', '--stdio', ...sessionOverrides('/trial')], { cwd: '/trial', stdio: ['pipe', 'pipe', 'pipe'] });
  const authClient = new AppServerClient(authHost); authClient.on('protocol-error', () => {});
  let accountKind = null;
  try {
    await authClient.request('initialize', { clientInfo: { name: 'tal-engine-auth-metadata', version: '1' }, capabilities: { experimentalApi: true } }); authClient.notify('initialized');
    const account = await authClient.request('account/read', { refreshToken: false }); accountKind = account.account?.type ?? null;
    if (accountKind !== 'chatgpt') throw new Error('The trusted Linux engine did not confirm inherited ChatGPT authentication');
  } finally { const cleanup = await stopHost(authHost); if (!cleanup.terminated) throw new Error('Engine auth metadata cleanup failed'); }
  const composition = input.existing_file_inplace ? assertComposedLinuxMounts({ mountInfo: fs.readFileSync('/proc/self/mountinfo', 'utf8'), trialRoot: '/trial', editableFiles: input.editable_files, runtimeOutputPaths: input.runtime_output_policy.granted }) : null;
  const report = await collectNativeRun({ trialRoot: '/trial', evidenceRoot: '/evidence', workflow: input.workflow, prompt: input.prompt, mode: input.task_mode, editableFiles: input.editable_files, runtimeOutputPaths: input.runtime_output_policy.granted, readonlyBindFiles: input.existing_file_inplace, expectedNativeRoles: input.expected_native_roles, binary, timeoutSeconds: input.timeout_seconds, preflightOnly: input.preflight_only, inheritedDefaults: input.inherited, isolationProbe: async params => {
    const boundary = await probeNativeIsolation({ ...params, probeParent: '/probe', deniedWriteDirectories: input.existing_file_inplace ? [] : input.runtime_output_policy.declared });
    if (input.existing_file_inplace && boundary.passed) { boundary.composed_mounts = composition; boundary.composed_writes = await probeComposedLinuxWrites(params); boundary.passed &&= boundary.composed_writes.passed; }
    if (boundary.passed) { boundary.verifier_availability = await probeVerifierAvailability({ binary, trialRoot: '/trial', argv: input.verification_argv, scope: { editableFiles: input.editable_files, runtimeOutputPaths: input.runtime_output_policy.granted, readonlyBindFiles: input.existing_file_inplace } }); boundary.checks.push(...boundary.verifier_availability.checks); boundary.passed &&= boundary.verifier_availability.passed; }
    return boundary;
  } });
  report.host_version = version.stdout.trim(); report.engine_auth = { kind: accountKind, identity_omitted: true, readonly_transport: true };
  report.host_binary_sha256 = binarySha256; report.installed_schema_sha256 = schemaHashes;
  report.target_runtime = targetRuntime;
  report.runtime_output_policy = input.runtime_output_policy;
  report.timeout_budget = input.timeout;
  if (report.effective_thread_model !== input.inherited.model || report.effective_thread_reasoning !== input.inherited.reasoning_effort) { report.status = 'blocked-or-failed'; report.failure ??= 'Linux effective model or effort differs from inherited preferences'; }
  if (!input.preflight_only && report.status === 'completed-unscored' && input.verification_argv.length) {
    const invocation = verifierInvocation(binary, '/trial', input.verification_argv, { editableFiles: input.editable_files, runtimeOutputPaths: input.runtime_output_policy.granted, readonlyBindFiles: input.existing_file_inplace }), check = await runBoundedCommand({ ...invocation, timeoutMs: 60000 });
    fs.writeFileSync('/evidence/verification.stdout.txt', check.stdout ?? '', { mode: 0o600 }); fs.writeFileSync('/evidence/verification.stderr.txt', check.stderr ?? '', { mode: 0o600 });
    report.independent_verification = { argv: [binary, ...invocation.args], kind: input.verification_kind, ...check };
    if (check.exit_code !== 0 || check.timed_out || !check.cleanup.terminated) report.status = 'failed-verification';
  }
  json('/evidence/run.json', report);
  console.log(JSON.stringify({ status: report.status, preflight_passed: report.preflight_passed, execution_started: report.execution_started, failure: report.failure }));
  if (input.preflight_only ? !report.preflight_passed : report.status !== 'completed-unscored') process.exitCode = 1;
}
export function linuxTimeout(timeoutSeconds, prepared) {
  const selected = timeoutSeconds ?? prepared.timeout_seconds;
  if (!Number.isInteger(selected) || selected < 1 || selected > 1800) throw new Error('Linux timeout must be an integer between 1 and 1800 seconds');
  return { seconds: selected, origin: timeoutSeconds === undefined ? prepared.timeout_origin : 'caller-override', fixture_or_default_seconds: prepared.timeout_seconds };
}
export async function probeVerifierAvailability({ binary, trialRoot, argv, scope, runCommand = runBoundedCommand }) {
  if (!argv.length) return { passed: true, required: false, checks: [] };
  const executables = [argv[0]];
  const checks = [];
  for (const executable of executables) {
    const command = ['/bin/sh', '-c', 'command -v "$1"', 'probe', executable];
    const invocation = verifierInvocation(binary, trialRoot, command, scope), result = await runCommand({ ...invocation, timeoutMs: 10000 });
    const passed = !result.error && !result.timed_out && result.cleanup?.terminated && result.exit_code === 0 && Boolean(result.stdout?.trim());
    checks.push({ id: 'verifier-executable-available', executable, argv: [invocation.binary, ...invocation.args], ...result, passed });
    if (passed && ['python3', 'python', 'node'].includes(path.basename(executable))) {
      const version = verifierInvocation(binary, trialRoot, [executable, '--version'], scope), observed = await runCommand({ ...version, timeoutMs: 10000 });
      checks.push({ id: 'verifier-runtime-startup', executable, argv: [version.binary, ...version.args], ...observed, passed: !observed.error && !observed.timed_out && observed.cleanup?.terminated && observed.exit_code === 0 && Boolean(observed.stdout?.trim() || observed.stderr?.trim()) });
    }
  }
  return { passed: checks.every(check => check.passed), required: true, checks, limits: ['Executable discovery/runtime startup establish verifier availability, not fixture correctness. The actual verifier runs separately after a model completion.'] };
}
export async function runLinuxSmoke({ caseId, outputRoot, fixtureRoot, image, seccompPath, sourceBinary, preflightOnly = true, existingFileInplace = false, atomicSaveRequired = false, timeoutSeconds }) {
  const target = linuxTarget(image);
  const prepared = prepareCase({ caseId, outputRoot, fixtureRoot });
  const runtimeOutputPolicy = existingFileInplace ? stageLinuxImplementation(prepared, { atomicSaveRequired }) : linuxReviewPolicy(prepared);
  const timeout = linuxTimeout(timeoutSeconds, prepared);
  json(path.join(prepared.evidence, 'linux-scope.json'), { existing_file_inplace: existingFileInplace, original_baseline: prepared.baseline, runtime_output_policy: runtimeOutputPolicy, staged_files: [...readTree(prepared.trial)].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode })) });
  const runner = path.join(outputRoot, 'runner'), home = path.join(outputRoot, 'codex-home'); fs.mkdirSync(runner); fs.mkdirSync(home, { mode: 0o700 });
  const inherited = await readInheritedDefaults(sourceBinary, prepared.trial), sourceHashes = copyRuntime(runner);
  fs.writeFileSync(path.join(home, 'config.toml'), `model=${JSON.stringify(inherited.model)}\n${inherited.reasoning_effort ? `model_reasoning_effort=${JSON.stringify(inherited.reasoning_effort)}\n` : ''}`, { mode: 0o600 });
  const actualHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), auth = path.join(actualHome, 'auth.json'), userConfig = path.join(actualHome, 'config.toml');
  const authBefore = sha256(fs.readFileSync(auth)), configBefore = fs.existsSync(userConfig) ? sha256(fs.readFileSync(userConfig)) : null;
  const input = { image, workflow: prepared.workflow, prompt: prepared.prompt, task_mode: prepared.task_mode, expected_native_roles: prepared.expected_native_roles, editable_files: existingFileInplace ? prepared.editable_files : [], existing_file_inplace: existingFileInplace, timeout_seconds: timeout.seconds, timeout, preflight_only: preflightOnly, inherited, verification_argv: prepared.verification_argv, verification_kind: prepared.verification_kind, runtime_output_policy: runtimeOutputPolicy };
  json(path.join(runner, 'driver.json'), input);
  const runId = crypto.randomUUID(), args = linuxContainerArgs({ image, runId, runnerRoot: runner, trialRoot: prepared.trial, homeRoot: home, evidenceRoot: prepared.evidence, authPath: auth, seccompPath, uid: process.getuid(), gid: process.getgid(), editableFiles: input.editable_files, runtimeOutputPaths: runtimeOutputPolicy.granted });
  let execution = null, cleanup = null;
  const record = { run_id: runId, image, target, expected_binary_sha256: TESTED_LINUX_BINARY_SHA256, expected_python_binary_sha256: target.python_required ? TESTED_PYTHON_BINARY_SHA256 : null, argv: ['docker', ...args], seccomp_sha256: sha256(fs.readFileSync(seccompPath)), source_sha256: sourceHashes, inherited, timeout, runtime_output_policy: runtimeOutputPolicy, allow_declared_changes: existingFileInplace, limits: ['Alternate Linux host requires independent native loading and task grading.', 'Full native model-tool inventory remains unavailable; case_compliant must not be inferred from these command probes.', existingFileInplace ? 'Only declared existing-file in-place edits and scoped runtime directories are supported; atomic edits remain denied and the actual model edit handler remains unverified.' : 'No implementation file-write or atomic editor guarantee is established.'] };
  json(path.join(prepared.evidence, 'linux-host.json'), record);
  try {
    const lifecycle = await runOwnedLinuxContainer({ args, runId, timeoutMs: (timeout.seconds + 120) * 1000 });
    execution = lifecycle.execution; cleanup = lifecycle.cleanup; record.failure = lifecycle.failure;
    fs.writeFileSync(path.join(prepared.evidence, 'docker.stdout.txt'), execution?.stdout ?? '', { mode: 0o600 }); fs.writeFileSync(path.join(prepared.evidence, 'docker.stderr.txt'), execution?.stderr ?? '', { mode: 0o600 });
  } finally {
    record.cleanup = cleanup; record.execution = execution ? { exit_code: execution.exit_code, timed_out: execution.timed_out, error: execution.error } : null;
    record.audit_errors = [];
    for (const [key, audit] of Object.entries({ original_auth_unchanged: () => authBefore === sha256(fs.readFileSync(auth)), original_config_unchanged: () => configBefore === (fs.existsSync(userConfig) ? sha256(fs.readFileSync(userConfig)) : null), changed_files: () => scopeChanges(prepared), final_files: () => [...readTree(prepared.trial)].map(([name, file]) => ({ path: name, sha256: sha256(file.bytes), mode: file.mode })) })) {
      try { record[key] = audit(); } catch (error) { record.audit_errors.push({ key, message: error.message }); }
    }
    json(path.join(prepared.evidence, 'linux-host.json'), record);
  }
  const reportPath = path.join(prepared.evidence, 'run.json');
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath)) : { status: 'blocked-or-failed', failure: 'No native report produced' };
  return { prepared, report, host: record, passed: linuxRunPassed({ execution, cleanup, ...record }) };
}
async function main(argv) {
  if (argv[0] === '--internal-driver') { await driver(argv[1]); return; }
  const args = options(argv, { '--case': 'one', '--output': 'one', '--fixtures': 'one', '--image': 'one', '--seccomp': 'one', '--source-binary': 'one', '--timeout-seconds': 'one', '--existing-file-inplace': 'boolean', '--require-atomic-save': 'boolean', '--run': 'boolean', '--help': 'boolean' });
  if (args['--help']) { console.log('Usage: node scripts/native-linux-smoke.mjs --case <workflow> --output <new-owned-outside-repo-dir> --image <immutable-local-image-id> --seccomp <tested-profile-json> [--fixtures <root>] [--source-binary <installed-0.159.2>] [--existing-file-inplace] [--run]\nDefault runs no-model metadata/auth/isolation probes for review-only fixtures. --existing-file-inplace explicitly allows declared output scaffolds and exact writable file/runtime mounts after composition probes; atomic saves are unsupported. --run starts a native model case only after its gates. No image install or host fallback occurs.'); return; }
  for (const name of ['--case', '--output', '--image', '--seccomp']) if (!args[name]) throw new Error(`${name} is required`);
  if (args['--require-atomic-save']) throw new Error('Atomic saves are unsupported; no model or container was started');
  const result = await runLinuxSmoke({ caseId: args['--case'], outputRoot: path.resolve(args['--output']), fixtureRoot: args['--fixtures'] ?? path.join(repositoryRoot, 'evals/engineering-toolkit/extension-fixtures'), image: args['--image'], seccompPath: args['--seccomp'], sourceBinary: args['--source-binary'] ?? '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex', preflightOnly: !args['--run'], existingFileInplace: Boolean(args['--existing-file-inplace']), timeoutSeconds: args['--timeout-seconds'] === undefined ? undefined : Number(args['--timeout-seconds']) });
  console.log(JSON.stringify({ status: result.report.status, preflight_passed: result.report.preflight_passed, execution_started: result.report.execution_started, evidence: result.prepared.evidence, cleanup: result.host.cleanup, passed: result.passed }, null, 2)); if (!result.passed) process.exitCode = 1;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
