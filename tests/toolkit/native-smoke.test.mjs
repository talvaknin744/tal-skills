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
import { sessionOverrides, AppServerClient, summarizeEvents, collectNativeRun, prepareCase, scopeChanges, observableTrace, spawnOwned, stopHost, verifierInvocation, runBoundedCommand } from '../../scripts/native-smoke.mjs';

function fakeChild(handler) {
  const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.exitCode = null; child.signalCode = null;
  let buffer = '';
  const send = message => child.stdout.write(`${JSON.stringify(message)}\n`);
  child.stdin.on('data', data => { buffer += data; let i; while ((i = buffer.indexOf('\n')) >= 0) { const line = buffer.slice(0, i); buffer = buffer.slice(i + 1); if (line) queueMicrotask(() => handler(JSON.parse(line), send)); } });
  child.kill = signal => { child.signalCode = signal; queueMicrotask(() => { child.emit('exit', null, signal); child.stdout.end(); child.stderr.end(); child.emit('close', null, signal); }); };
  return child;
}
const rootFor = t => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tal native unit-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return fs.realpathSync(root); };

test('session trust safely encodes a quoted path as an inline TOML table without model overrides', t => {
  const base = rootFor(t), root = path.join(base, 'quoted "project" ü'); fs.mkdirSync(root);
  const args = sessionOverrides(root);
  assert.equal(TOML.parse(args[1]).projects[root].trust_level, 'trusted');
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

test('protocol-only fake host records native role identity, child skill reads, inherited model, and terminal completion', async t => {
  const root = rootFor(t), evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence);
  fs.mkdirSync(path.join(root, '.codex'));
  const workflow = 'tal-backend-delivery', requests = [];
  const spawnHost = (_binary, argv) => {
    assert.equal(argv.some(value => /model=|reasoning/.test(value)), false);
    return fakeChild((request, send) => {
      requests.push(request);
      const response = result => send({ id: request.id, result });
      if (request.method === 'initialize') response({ userAgent: 'fake-schema-host' });
      if (request.method === 'config/read') response({ config: { model: 'inherited', model_reasoning_effort: 'inherited-effort' }, layers: [{ name: { type: 'project', dotCodexFolder: path.join(root, '.codex') }, disabledReason: null }] });
      if (request.method === 'skills/list') response({ data: [{ skills: [{ name: workflow, description: 'Workflow description', path: path.join(root, '.agents/skills', workflow, 'SKILL.md'), enabled: true, scope: 'repo' }], errors: [] }] });
      if (request.method === 'thread/start') response({ thread: { id: 'primary', model: 'inherited', reasoningEffort: 'inherited-effort' } });
      if (request.method === 'turn/start') {
        response({ turn: { id: 'turn-1', status: 'inProgress' } });
        send({ method: 'turn/started', params: { threadId: 'primary', turn: { id: 'turn-1' } } });
        send({ method: 'thread/started', params: { thread: { id: 'child', parentThreadId: 'primary', agentRole: 'tal-python', model: 'inherited' } } });
        send({ method: 'turn/completed', params: { threadId: 'primary', turn: { id: 'turn-1', status: 'completed' } } });
      }
      if (request.method === 'thread/read') response({ thread: { id: 'child', parentThreadId: 'primary', agentRole: 'tal-python', model: 'inherited', turns: [{ items: [{ id: 'read-1', type: 'commandExecution', cwd: root, command: 'cat .agents/skills/python-backend/SKILL.md', commandActions: [{ type: 'read', path: '.agents/skills/python-backend/SKILL.md' }], exitCode: 0, status: 'completed' }] }] } });
    });
  };
  const report = await collectNativeRun({ trialRoot: root, workflow, prompt: 'Perform the local task.', mode: 'implementation', evidenceRoot: evidence, binary: 'fake-host', spawnHost });
  assert.equal(report.status, 'completed-unscored');
  assert.equal(report.model_override, false);
  assert.equal(report.observed.named_native_children[0].agent_role, 'tal-python');
  assert.equal(report.observed.observed_reads[0].path, '.agents/skills/python-backend/SKILL.md');
  assert.match(report.observed.observed_reads[0].evidence, /result\/thread\/turns/);
  assert.equal(requests.some(x => x.method === 'turn/start' && x.params.model), false);
  assert.equal(requests.find(x => x.method === 'turn/start').params.sandboxPolicy.networkAccess, false);
  assert.equal(requests.find(x => x.method === 'turn/start').params.sandboxPolicy.excludeSlashTmp, true);
  assert.equal(report.case_compliant, false);
  assert.ok(report.capability_deviations.length);
  assert.equal(report.global_config_unchanged, true);
  const validate = new Ajv().compile(JSON.parse(fs.readFileSync('evals/engineering-toolkit/native-planning/run-record.schema.json', 'utf8')));
  assert.equal(validate(report), true, JSON.stringify(validate.errors));
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
  assert.deepEqual(invocation.args, ['sandbox', '-P', ':workspace', '--include-managed-config', '--sandbox-state-disable-network', '-C', root, '--', 'python3', '-B', 'verify.py']);
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
