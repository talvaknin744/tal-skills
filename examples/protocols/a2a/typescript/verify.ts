import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CancelTaskRequest, GetTaskRequest, ListTasksRequest, SendMessageRequest, SubscribeToTaskRequest, TaskState, type Task, type Message } from '@a2a-js/sdk';
import { ClientFactory, JsonRpcTransportFactory } from '@a2a-js/sdk/client';

const [base, output] = process.argv.slice(2);
assert(base && output, 'Usage: node dist/verify.js BASE_URL OUTPUT_JSON');
assert.equal(new URL(base).hostname, '127.0.0.1', 'These synthetic identities are loopback-only');

type Metrics = {
  gates: string[];
  receipts: Record<string, { operation: string }>;
  cleanup: Record<string, number>;
  effects: Record<string, number>;
};
type Case = { id: string; status: 'passed' | 'failed' | 'observed-unsafe-stock'; observed?: unknown; error?: unknown };
type Wire = { request: { params: { message?: { parts?: { text?: string }[] } } }; version: string | null };
type Envelope = { error?: { code: number; message: string }; result?: { task?: { id: string; contextId: string; status: { state: string } }; status?: { state: string } } };
const cases: Case[] = [];
const wire: Wire[] = [];
const options = () => ({ signal: AbortSignal.timeout(10_000) });
const headers = (principal = 'alice') => ({
  Authorization: `Bearer fixture-${principal}`, 'Content-Type': 'application/json', 'A2A-Version': '1.0',
});
const factory = (principal: string) => new ClientFactory({ transports: [new JsonRpcTransportFactory({
  fetchImpl: async (url, init = {}) => {
    const requestHeaders = new Headers(init.headers);
    requestHeaders.set('Authorization', `Bearer fixture-${principal}`);
    if (typeof init.body === 'string') wire.push({ request: JSON.parse(init.body), version: requestHeaders.get('A2A-Version') });
    return fetch(url, { ...init, headers: requestHeaders });
  },
})] });
const alice = await factory('alice').createFromUrl(base);
const bob = await factory('bob').createFromUrl(base);
const request = (text: string, extra: { messageId?: string; taskId?: string; contextId?: string } = {}, immediate = false) =>
  SendMessageRequest.fromJSON({
    message: { messageId: crypto.randomUUID(), role: 'ROLE_USER', parts: [{ text }], ...extra },
    configuration: { returnImmediately: immediate },
  });
const task = (result: Task | Message): Task => {
  assert('id' in result, 'Expected a Task, not a direct Message');
  return result;
};
async function metrics(): Promise<Metrics> {
  const response = await fetch(`${base}/_control/metrics`, { headers: headers(), ...options() });
  assert.equal(response.ok, true);
  return response.json();
}
async function release(id: string) {
  const response = await fetch(`${base}/_control/release/${id}`, { method: 'POST', headers: headers(), ...options() });
  assert.equal(response.ok, true);
}
async function waitFor(predicate: (value: Metrics) => boolean): Promise<Metrics> {
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    const current = await metrics();
    if (predicate(current)) return current;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Fixture barrier was not reached within five seconds');
}
function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const value = error as { name?: string; message?: string; reason?: string; envelopeCode?: number };
  return { name: value.name, message: value.message, reason: value.reason, code: value.envelopeCode };
}
async function rejected(operation: () => Promise<unknown>) {
  try { await operation(); } catch (error) { return errorDetails(error); }
  throw new Error('Expected rejection');
}
async function check(id: string, operation: () => Promise<unknown>, status: Case['status'] = 'passed') {
  try { cases.push({ id, status, observed: await operation() }); }
  catch (error) { cases.push({ id, status: 'failed', error: errorDetails(error) }); }
}
async function rpc(method: string, params: unknown, endpoint = 'guarded', principal = 'alice'): Promise<Envelope> {
  const response = await fetch(`${base}/${endpoint}/rpc`, {
    method: 'POST', headers: headers(principal), ...options(),
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  });
  assert.equal(response.ok, true);
  const text = await response.text();
  const data = text.startsWith('data:') ? text.split('\n').find(line => line.startsWith('data:'))!.slice(5) : text;
  return JSON.parse(data);
}
const wireMessage = (text: string, extra = {}) => ({ message: {
  messageId: crypto.randomUUID(), role: 'ROLE_USER', parts: [{ text }], ...extra,
} });

await check('discovery-wire-version-and-artifact', async () => {
  const result = task(await alice.sendMessage(request('immediate'), options()));
  assert.equal(result.status?.state, TaskState.TASK_STATE_COMPLETED);
  assert.equal(result.artifacts[0]?.parts[0]?.content?.$case, 'text');
  assert.equal(wire.at(-1)?.version, '1.0');
  assert.equal(wire.at(-1)?.request.params.message?.parts?.[0]?.text, 'immediate');
  return { taskId: result.id, wireVersion: '1.0', state: 'completed' };
});
await check('continuation-and-terminal-rejection', async () => {
  const paused = task(await alice.sendMessage(request('input'), options()));
  assert.equal(paused.status?.state, TaskState.TASK_STATE_INPUT_REQUIRED);
  const done = task(await alice.sendMessage(request('finish', { taskId: paused.id, contextId: paused.contextId }), options()));
  assert.equal(done.id, paused.id);
  assert.equal(done.status?.state, TaskState.TASK_STATE_COMPLETED);
  const terminal = await rejected(() => alice.sendMessage(request('finish', { taskId: paused.id }), options()));
  assert.equal(terminal.reason, 'UNSUPPORTED_OPERATION');
  assert.equal((await metrics()).effects[`alice/${done.id}`], 1);
  return { taskId: done.id, terminal };
});
await check('terminal-operation-preflight', async () => {
  const completed = task(await alice.sendMessage(request('immediate'), options()));
  const cancel = await rejected(() => alice.cancelTask(CancelTaskRequest.fromJSON({ id: completed.id }), options()));
  assert.equal(cancel.reason, 'TASK_NOT_CANCELABLE');
  const subscribe = await rejected(async () => {
    for await (const _event of alice.resubscribeTask(SubscribeToTaskRequest.fromJSON({ id: completed.id }), options())) {
      throw new Error('Terminal task yielded a live event');
    }
  });
  assert.equal(subscribe.reason, 'UNSUPPORTED_OPERATION');
  const final = await alice.getTask(GetTaskRequest.fromJSON({ id: completed.id }), options());
  assert.equal(final.status?.state, TaskState.TASK_STATE_COMPLETED);
  assert.equal((await metrics()).effects[`alice/${completed.id}`], 1);
  return { taskId: completed.id, cancel, subscribe, effectCount: 1 };
});
await check('duplicate-message-id-does-not-deduplicate-effect', async () => {
  const sameMessage = request('immediate');
  const first = task(await alice.sendMessage(sameMessage, options()));
  const second = task(await alice.sendMessage(sameMessage, options()));
  assert.notEqual(first.id, second.id);
  const state = await metrics();
  assert.equal(state.effects[`alice/${first.id}`], 1);
  assert.equal(state.effects[`alice/${second.id}`], 1);
  return { tasks: [first.id, second.id], simulatedEffects: 2, protocolDeduplication: 'optional' };
});
await check('sequential-application-operation-key', async () => {
  const operation = crypto.randomUUID();
  const first = task(await alice.sendMessage(request(`dedupe:${operation}`), options()));
  const second = task(await alice.sendMessage(request(`dedupe:${operation}`), options()));
  assert.notEqual(first.id, second.id);
  assert.equal((await metrics()).effects[`alice/${operation}`], 1);
  return { tasks: [first.id, second.id], simulatedEffects: 1, scope: 'sequential memory-only fixture' };
});
await check('cancel-before-effect-and-reconcile-repeat', async () => {
  const active = task(await alice.sendMessage(request('hold-before', {}, true), options()));
  await waitFor(value => value.gates.includes(active.id));
  const canceled = await alice.cancelTask(CancelTaskRequest.fromJSON({ id: active.id }), options());
  assert.equal(canceled.status?.state, TaskState.TASK_STATE_CANCELED);
  let repeat: unknown;
  try {
    const again = await alice.cancelTask(CancelTaskRequest.fromJSON({ id: active.id }), options());
    assert.equal(again.status?.state, TaskState.TASK_STATE_CANCELED);
    repeat = { state: 'canceled' };
  } catch (error) {
    const details = errorDetails(error);
    assert.equal(details.reason, 'TASK_NOT_CANCELABLE');
    repeat = details;
  }
  await release(active.id);
  assert.equal((await alice.getTask(GetTaskRequest.fromJSON({ id: active.id }), options())).status?.state, TaskState.TASK_STATE_CANCELED);
  const state = await waitFor(value => value.cleanup[active.id] === 1);
  assert.equal(state.receipts[active.id], undefined);
  return { taskId: active.id, effects: 0, cleanup: 1, repeat };
});
await check('cancel-after-effect-reconciles-receipt', async () => {
  const active = task(await alice.sendMessage(request('hold-after', {}, true), options()));
  await waitFor(value => value.gates.includes(active.id) && Boolean(value.receipts[active.id]));
  assert.equal((await alice.cancelTask(CancelTaskRequest.fromJSON({ id: active.id }), options())).status?.state, TaskState.TASK_STATE_COMPLETED);
  const result = await alice.getTask(GetTaskRequest.fromJSON({ id: active.id }), options());
  assert.equal(result.status?.state, TaskState.TASK_STATE_COMPLETED);
  assert.equal(result.artifacts.length, 1);
  const state = await waitFor(value => value.cleanup[active.id] === 1);
  assert.equal(state.effects[`alice/${active.id}`], 1);
  return { taskId: active.id, effects: 1, cleanup: 1, scope: 'application-defined receipt recovery' };
});
await check('disconnect-one-observer-preserves-work-and-other-observer', async () => {
  const active = task(await alice.sendMessage(request('hold-before', {}, true), options()));
  await waitFor(value => value.gates.includes(active.id));
  const disconnected = new AbortController();
  const first = alice.resubscribeTask(SubscribeToTaskRequest.fromJSON({ id: active.id }), { signal: disconnected.signal });
  const second = alice.resubscribeTask(SubscribeToTaskRequest.fromJSON({ id: active.id }), options());
  try {
    assert.equal((await first.next()).done, false);
    assert.equal((await second.next()).done, false);
    disconnected.abort();
    try { await first.next(); } catch { /* Aborting the observation may surface as a transport error. */ }
    const before = await alice.getTask(GetTaskRequest.fromJSON({ id: active.id }), options());
    assert.notEqual(before.status?.state, TaskState.TASK_STATE_CANCELED);
    await release(active.id);
    let completed = false;
    let artifact = false;
    for await (const event of second) {
      artifact ||= event.payload?.$case === 'artifactUpdate';
      completed ||= event.payload?.$case === 'statusUpdate' && event.payload.value.status?.state === TaskState.TASK_STATE_COMPLETED;
    }
    assert(artifact && completed);
    assert.equal((await alice.getTask(GetTaskRequest.fromJSON({ id: active.id }), options())).status?.state, TaskState.TASK_STATE_COMPLETED);
    return { taskId: active.id, remainingObserver: ['artifact', 'completed'] };
  } finally {
    disconnected.abort();
    await first.return(undefined);
    await second.return(undefined);
  }
});
await check('caller-isolation-for-active-task-operations', async () => {
  const active = task(await alice.sendMessage(request('hold-before', {}, true), options()));
  await waitFor(value => value.gates.includes(active.id));
  try {
    const get = await rejected(() => bob.getTask(GetTaskRequest.fromJSON({ id: active.id }), options()));
    const cancel = await rejected(() => bob.cancelTask(CancelTaskRequest.fromJSON({ id: active.id }), options()));
    const subscribe = await rejected(async () => {
      for await (const _event of bob.resubscribeTask(SubscribeToTaskRequest.fromJSON({ id: active.id }), options())) throw new Error('Foreign event leaked');
    });
    const send = await rejected(() => bob.sendMessage(request('finish', { taskId: active.id }), options()));
    assert.deepEqual([get.reason, cancel.reason, subscribe.reason, send.reason], Array(4).fill('TASK_NOT_FOUND'));
    assert.equal((await bob.listTasks(ListTasksRequest.fromJSON({}), options())).tasks.length, 0);
    return { get, cancel, subscribe, send, foreignListSize: 0 };
  } finally { await alice.cancelTask(CancelTaskRequest.fromJSON({ id: active.id }), options()); }
});
await check('authentication-gate-before-dispatch', async () => {
  for (const authorization of ['', 'Bearer invalid-fixture-value']) {
    const response = await fetch(`${base}/guarded/rpc`, {
      method: 'POST', headers: { ...headers(), Authorization: authorization }, ...options(),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ListTasks', params: {} }),
    });
    assert.equal(response.status, 401);
    await response.arrayBuffer();
  }
  return { rejected: ['missing', 'invalid'], scope: 'fixed local identity map only' };
});
await check('required-fields-enums-and-conflicting-content', async () => {
  const valid = wireMessage('immediate').message;
  for (const message of [
    { ...valid, role: 'not-a-role' }, { ...valid, messageId: undefined },
    { ...valid, role: undefined }, { ...valid, parts: [{ text: 'immediate', url: 'https://invalid.example' }] },
  ]) assert.equal((await rpc('SendMessage', { message })).error?.code, -32602);
  return { invalidRequests: 4, code: -32602 };
});

// Keep the unsafe stock results visible. They are observations, not passing guards.
await check('stock-empty-part-runs-effect', async () => {
  const result = await rpc('SendMessage', { message: { messageId: crypto.randomUUID(), role: 'ROLE_USER', parts: [{}] } }, 'stock');
  assert(result.result?.task);
  assert.equal((await metrics()).effects[`alice/${result.result.task.id}`], 1);
  return { taskId: result.result.task.id, effectCount: 1, expectedBoundary: 'reject before dispatch', stockBoundary: 'unsafe acceptance' };
}, 'observed-unsafe-stock');
await check('stock-context-mismatch-runs-effect', async () => {
  const start = await rpc('SendMessage', wireMessage('input'), 'stock');
  assert(start.result?.task);
  const result = await rpc('SendMessage', wireMessage('finish', { taskId: start.result.task.id, contextId: 'wrong-context' }), 'stock');
  assert.equal(result.result?.task?.contextId, start.result.task.contextId);
  assert.equal((await metrics()).effects[`alice/${start.result.task.id}`], 1);
  return { taskId: start.result.task.id, effectCount: 1, expectedBoundary: 'reject context mismatch', stockBoundary: 'unsafe acceptance' };
}, 'observed-unsafe-stock');
for (const method of ['SendMessage', 'SendStreamingMessage']) {
  await check(`guard-empty-part-${method}`, async () => {
    const before = (await metrics()).effects;
    const result = await rpc(method, { message: { messageId: crypto.randomUUID(), role: 'ROLE_USER', parts: [{}] } });
    assert.equal(result.error?.code, -32602);
    assert.deepEqual((await metrics()).effects, before);
    return { code: -32602, additionalEffects: 0 };
  });
  await check(`guard-context-and-owner-${method}`, async () => {
    const start = await rpc('SendMessage', wireMessage('input'));
    assert(start.result?.task);
    const original = start.result.task;
    const params = wireMessage('finish', { taskId: original.id, contextId: 'wrong-context' });
    assert.equal((await rpc(method, params)).error?.code, -32602);
    assert.equal((await rpc(method, params, 'guarded', 'bob')).error?.code, -32001);
    assert.equal((await metrics()).effects[`alice/${original.id}`] ?? 0, 0);
    assert.equal((await rpc('GetTask', { id: original.id })).result?.status?.state, 'TASK_STATE_INPUT_REQUIRED');
    const valid = await rpc('SendMessage', wireMessage('finish', { taskId: original.id }));
    assert.equal(valid.result?.task?.contextId, original.contextId);
    assert.equal(valid.result?.task?.status.state, 'TASK_STATE_COMPLETED');
    return { taskId: original.id, effectsBeforeValidContinuation: 0, inferredContext: original.contextId };
  });
}
await check('wire-version-boundary', async () => {
  const observations = [];
  for (const version of ['1.0.1', '9.9', '']) {
    const requestHeaders: Record<string, string> = headers();
    if (version) requestHeaders['A2A-Version'] = version;
    else delete requestHeaders['A2A-Version'];
    const response = await fetch(`${base}/guarded/rpc`, {
      method: 'POST', headers: requestHeaders, ...options(),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'SendMessage', params: wireMessage('immediate') }),
    });
    const envelope: Envelope = await response.json();
    if (version === '1.0.1') assert(envelope.result?.task);
    else assert.equal(envelope.error?.code, -32009);
    observations.push({ version: version || 'absent', code: envelope.error?.code ?? null });
  }
  return observations;
});

const report = {
  probe: 'typescript-to-python', runAt: new Date().toISOString(), runtime: process.version,
  client: '@a2a-js/sdk@1.2.1', server: 'a2a-sdk==1.1.5', wireVersion: '1.0',
  cases, passed: cases.filter(value => value.status === 'passed').length,
  observedUnsafeStock: cases.filter(value => value.status === 'observed-unsafe-stock').length,
  failed: cases.filter(value => value.status === 'failed').length,
  limitations: ['synthetic identity', 'sequential memory-only operation key', 'simulated counter effects', 'not full conformance'],
};
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, observedUnsafeStock: report.observedUnsafeStock, failed: report.failed, output }));
process.exitCode = report.failed ? 1 : 0;
