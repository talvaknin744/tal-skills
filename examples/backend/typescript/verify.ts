import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createServer, type Socket } from 'node:net';
import { setTimeout as pollInterval } from 'node:timers/promises';
import pg from 'pg';
import { createPool, ReservationError, ReservationService, UnknownOutcome, type TestHooks } from './reservation.js';

const databaseURL = process.env.TAL_EXAMPLE_DATABASE_URL;
const proxyURL = process.env.TAL_EXAMPLE_PROXY_URL;
assert.ok(databaseURL && proxyURL, 'Use the common local runner to set TAL_EXAMPLE_DATABASE_URL and TAL_EXAMPLE_PROXY_URL.');
for (const value of [databaseURL, proxyURL]) {
  assert.ok(['127.0.0.1', 'localhost', '[::1]', '::1'].includes(new URL(value).hostname), 'The verifier accepts local disposable databases only.');
}
const common: { scenarios: Array<{ id: string }>; valid_quantities: number[]; invalid_quantities: unknown[] } =
  JSON.parse(readFileSync(new URL('../scenarios.json', import.meta.url), 'utf8'));
const run = randomUUID().slice(0, 8);
const observer = new pg.Client({ connectionString: databaseURL, application_name: `tal-ts-${run}-observer`, statement_timeout: 3_000 });
const pools: pg.Pool[] = [];
const applications: string[] = [];
let serial = 0;
function service(hooks: TestHooks = {}, max = 4, url = databaseURL): ReservationService {
  assert.ok(url);
  const app = `tal-ts-${run}-${serial++}`;
  applications.push(app);
  const pool = createPool(url, app, max); pools.push(pool);
  return new ReservationService(pool, hooks);
}
function tenant(): string { return `ts-${run}-${serial++}`; }
async function seed(who: string, available = 5, sku = 'item'): Promise<void> {
  await observer.query('INSERT INTO inventory (tenant_id,sku,available) VALUES ($1,$2,$3)', [who, sku, available]);
}
async function state(who: string): Promise<{ available: number; reservations: number }> {
  const result = await observer.query<{ available: number; reservations: number }>(
    `SELECT available, (SELECT count(*)::integer FROM reservations WHERE tenant_id=$1) AS reservations
     FROM inventory WHERE tenant_id=$1 AND sku='item'`, [who]);
  assert.ok(result.rows[0]); return result.rows[0];
}
async function until(check: () => Promise<boolean> | boolean, description: string, ms = 5_000): Promise<void> {
  const deadline = performance.now() + ms;
  while (performance.now() < deadline) {
    if (await check()) return;
    await pollInterval(5); // Polling interval; the observed condition is the barrier.
  }
  throw new Error(`Observation deadline: ${description}`);
}
async function lockObserved(svc: ReservationService): Promise<void> {
  await until(async () => {
    const result = await observer.query<{ present: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock') AS present",
      [svc.pool.options.application_name]);
    return result.rows[0]?.present === true;
  }, 'database lock wait');
}
function gate(): { entered: Promise<void>; release: () => void; wait: (signal: AbortSignal) => Promise<void> } {
  let announce!: () => void, release!: () => void;
  const entered = new Promise<void>((resolve) => { announce = resolve; });
  const released = new Promise<void>((resolve) => { release = resolve; });
  return { entered, release, wait: async (signal) => {
    announce(); signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const cleanup = (): void => signal.removeEventListener('abort', onAbort);
      const onAbort = (): void => { cleanup(); reject(signal.reason); };
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
      void released.then(() => { cleanup(); resolve(); });
    });
  } };
}
async function expectCode(promise: Promise<unknown>, code: string): Promise<ReservationError> {
  try { await promise; } catch (error) {
    assert.ok(error instanceof ReservationError); assert.equal(error.code, code); return error;
  }
  assert.fail(`Expected ${code}`);
}
async function verifyPool(svc: ReservationService): Promise<void> {
  assert.equal(svc.pool.waitingCount, 0);
  assert.equal(svc.pool.totalCount - svc.pool.idleCount, 0);
  assert.equal(svc.pool.listenerCount('remove'), 0);
  const client = await svc.pool.connect();
  try {
    assert.equal(client.listenerCount('error'), 0, 'Finished lease removed its checked-out client listener');
    assert.equal((await client.query<{ n: number }>('SELECT 1 AS n')).rows[0]?.n, 1);
  } finally { client.release(); }
}
const scenarios: Array<{ id: string; status: 'passed' | 'failed'; evidence: unknown }> = [];
async function scenario(id: string, action: () => Promise<unknown>): Promise<void> {
  try { scenarios.push({ id, status: 'passed', evidence: await action() }); }
  catch (error) {
    scenarios.push({ id, status: 'failed', evidence: { error: error instanceof Error ? error.message : String(error) } });
    console.error(id, error);
  }
}
async function cancellationQuery(svc: ReservationService): Promise<unknown> {
  const who = tenant(); await seed(who);
  const blocker = new pg.Client({ connectionString: databaseURL, application_name: `tal-ts-${run}-blocker`, statement_timeout: 3_000 });
  await blocker.connect();
  const controller = new AbortController(); const reason = new DOMException('Fixture canceled request', 'AbortError');
  let task: Promise<unknown> | undefined;
  try {
    await blocker.query('BEGIN');
    await blocker.query('UPDATE inventory SET available=available WHERE tenant_id=$1 AND sku=$2', [who, 'item']);
    task = svc.reserve(who, 'cancel', { sku: 'item', quantity: 1 }, { signal: controller.signal });
    // Handle rejection immediately while the observer establishes the schedule.
    const outcome = task.then(value => ({ value }), error => ({ error }));
    await lockObserved(svc); controller.abort(reason);
    const result = await outcome; assert.ok('error' in result); assert.equal(result.error, reason);
    await blocker.query('ROLLBACK');
    await until(async () => {
      const r = await observer.query<{ count: number }>(
        'SELECT count(*)::integer FROM pg_stat_activity WHERE application_name=$1', [svc.pool.options.application_name]);
      return r.rows[0]?.count === 0;
    }, 'canceled backend gone');
    assert.deepEqual(await state(who), { available: 5, reservations: 0 });
    const fresh = await svc.reserve(who, 'fresh', { sku: 'item', quantity: 1 });
    await verifyPool(svc);
    return { lockObserved: true, nativeCancellation: true, freshReceipt: fresh.reservationId, state: await state(who) };
  } finally {
    controller.abort(reason);
    if (task) await task.catch(() => undefined);
    await blocker.query('ROLLBACK').catch(() => undefined); await blocker.end();
  }
}

await observer.connect();
const version = (await observer.query<{ version: string }>('SELECT version()')).rows[0]?.version;
const startedAt = new Date().toISOString();
try {
  assert.equal((await observer.query("SELECT to_regclass('inventory') IS NOT NULL AND to_regclass('reservations') IS NOT NULL AS ready")).rows[0]?.ready, true, 'Common schema must be provisioned by the runner.');
  await scenario('sequential-duplicate', async () => {
    const who = tenant(); await seed(who); const svc = service();
    const first = await svc.reserve(who, 'key', { sku: 'item', quantity: 2 });
    assert.deepEqual(await svc.reserve(who, 'key', { sku: 'item', quantity: 2 }), first);
    assert.deepEqual(await svc.lookup(who, 'key'), first);
    assert.deepEqual(await state(who), { available: 3, reservations: 1 });
    return { sameReceipt: true, state: await state(who) };
  });
  await scenario('legitimate-repeat', async () => {
    const who = tenant(); await seed(who); const svc = service();
    const a = await svc.reserve(who, 'a', { sku: 'item', quantity: 1 });
    const b = await svc.reserve(who, 'b', { sku: 'item', quantity: 1 });
    assert.notEqual(a.reservationId, b.reservationId);
    assert.deepEqual(await state(who), { available: 3, reservations: 2 });
    return { distinctReceipts: true, state: await state(who) };
  });
  for (const conflict of [false, true]) await scenario(conflict ? 'conflicting-intent' : 'concurrent-duplicate', async () => {
    const who = tenant(); await seed(who); const held = gate();
    const owner = service({ afterInsert: held.wait }); const other = service();
    const a = owner.reserve(who, 'key', { sku: 'item', quantity: 1 });
    let b: Promise<unknown> | undefined;
    try {
      await held.entered;
      b = other.reserve(who, 'key', { sku: 'item', quantity: conflict ? 2 : 1 });
      const bResult = b.then(value => ({ value }), error => ({ error }));
      await lockObserved(other); held.release(); const first = await a; const result = await bResult;
      if (conflict) { assert.ok('error' in result && result.error instanceof ReservationError); assert.equal(result.error.code, 'IntentConflict'); }
      else { assert.ok('value' in result); assert.deepEqual(result.value, first); }
      assert.deepEqual(await state(who), { available: 4, reservations: 1 });
      return { lockObserved: true, conflictRejected: conflict, state: await state(who) };
    } finally { held.release(); await Promise.allSettled([a, ...(b ? [b] : [])]); }
  });
  await scenario('cross-tenant', async () => {
    const a = tenant(), b = tenant(), stranger = tenant(); await seed(a); await seed(b); const svc = service();
    const first = await svc.reserve(a, 'same-key', { sku: 'item', quantity: 1 });
    assert.equal(await svc.lookup(b, 'same-key'), null);
    const second = await svc.reserve(b, 'same-key', { sku: 'item', quantity: 1 });
    assert.notEqual(first.reservationId, second.reservationId); assert.equal(await svc.lookup(stranger, 'same-key'), null);
    assert.deepEqual(await svc.lookup(a, 'same-key'), first); assert.deepEqual(await svc.lookup(b, 'same-key'), second);
    assert.deepEqual(await state(a), { available: 4, reservations: 1 });
    assert.deepEqual(await state(b), { available: 4, reservations: 1 });
    return { independentReceipts: true, a: await state(a), b: await state(b) };
  });
  await scenario('last-item', async () => {
    const who = tenant(); await seed(who, 1); const held = gate();
    const owner = service({ beforeCommit: held.wait }); const other = service();
    const a = owner.reserve(who, 'first', { sku: 'item', quantity: 1 }); let b: Promise<unknown> | undefined;
    try {
      await held.entered; b = other.reserve(who, 'second', { sku: 'item', quantity: 1 });
      const bResult = expectCode(b, 'UnavailableInventory');
      await lockObserved(other); held.release(); await a; await bResult;
      assert.deepEqual(await state(who), { available: 0, reservations: 1 });
      return { lockObserved: true, state: await state(who) };
    } finally { held.release(); await Promise.allSettled([a, ...(b ? [b] : [])]); }
  });
  for (const beforeMutation of [true, false]) await scenario(beforeMutation ? 'rollback-before-mutation' : 'rollback-before-commit', async () => {
    const who = tenant(); await seed(who); const fault = new Error('Fixture pre-COMMIT failure');
    const fail = async (): Promise<void> => { throw fault; };
    const svc = service(beforeMutation ? { afterInsert: fail } : { beforeCommit: fail }, 1);
    const error = await expectCode(svc.reserve(who, 'key', { sku: 'item', quantity: 1 }), 'DatabaseFailure');
    assert.equal(error.cause, fault); assert.deepEqual(await state(who), { available: 5, reservations: 0 });
    await verifyPool(svc); const retry = new ReservationService(svc.pool);
    await retry.reserve(who, 'key', { sku: 'item', quantity: 1 });
    return { rollbackConfirmed: true, stateAfterRetry: await state(who), cleanupFailures: svc.cleanupFailures };
  });
  await scenario('unknown-commit', async () => {
    const who = tenant(); await seed(who); const svc = service({}, 1, proxyURL);
    const error = await expectCode(svc.reserve(who, 'key', { sku: 'item', quantity: 2 }), 'UnknownOutcome');
    assert.ok(error instanceof UnknownOutcome); assert.equal(error.identity.key, 'key');
    assert.deepEqual(await state(who), { available: 3, reservations: 1 });
    const direct = service(); const saved = await direct.lookup(who, 'key'); assert.ok(saved);
    const retried = await direct.reserve(who, 'key', { sku: 'item', quantity: 2 }); assert.deepEqual(retried, saved);
    assert.deepEqual(await state(who), { available: 3, reservations: 1 });
    let proxyEvidence: unknown = 'Control endpoint not supplied';
    if (process.env.TAL_EXAMPLE_PROXY_CONTROL_URL) {
      const response = await fetch(process.env.TAL_EXAMPLE_PROXY_CONTROL_URL, { signal: AbortSignal.timeout(2_000) });
      assert.equal(response.ok, true); proxyEvidence = await response.json();
    }
    return { transportReplyLost: true, originalReceiptRecovered: true, state: await state(who), proxy: proxyEvidence };
  });
  await scenario('not-observed-inflight', async () => {
    const who = tenant(); await seed(who); const held = gate(); const owner = service({ afterInsert: held.wait }); const reader = service();
    const task = owner.reserve(who, 'key', { sku: 'item', quantity: 1 });
    try {
      await held.entered; assert.equal(await reader.lookup(who, 'key'), null); held.release();
      const saved = await task; assert.deepEqual(await reader.lookup(who, 'key'), saved);
      return { absentWhileUncommitted: true, presentAfterCommit: true };
    } finally { held.release(); await task.catch(() => undefined); }
  });
  await scenario('cancellation-query', () => cancellationQuery(service({}, 1)));
  await scenario('cancellation-acquire', async () => {
    const who = tenant(); await seed(who); const svc = service({}, 1); const held = await svc.pool.connect();
    const controller = new AbortController(); const reason = new DOMException('Fixture canceled queued acquire', 'AbortError');
    let released = false;
    const task = svc.reserve(who, 'key', { sku: 'item', quantity: 1 }, { signal: controller.signal });
    const outcome = task.then(value => ({ value }), error => ({ error }));
    try {
      await until(() => svc.pool.waitingCount === 1, 'pool waiter queued'); controller.abort(reason);
      assert.equal(svc.pool.waitingCount, 1); held.release(); released = true;
      const result = await outcome; assert.ok('error' in result); assert.equal(result.error, reason);
      assert.deepEqual(await state(who), { available: 5, reservations: 0 });
      await svc.reserve(who, 'fresh', { sku: 'item', quantity: 1 }); await verifyPool(svc);
      return { lateAcquireReleased: true, nativeCancellation: true, waiting: svc.pool.waitingCount, held: svc.pool.totalCount - svc.pool.idleCount };
    } finally { if (!released) held.release(); await task.catch(() => undefined); }
  });
  await scenario('resource-recovery', async () => {
    const svc = service({}, 1); const rounds: unknown[] = [];
    for (let i = 0; i < 3; i++) rounds.push(await cancellationQuery(svc));
    await verifyPool(svc); return { rounds, waiting: svc.pool.waitingCount, held: svc.pool.totalCount - svc.pool.idleCount };
  });
  await scenario('stalled-idle-retirement', async () => {
    const peers = new Set<Socket>();
    let halfClosed = false;
    const server = createServer({ allowHalfOpen: true }, socket => {
      peers.add(socket); socket.on('error', () => undefined);
      socket.once('end', () => { halfClosed = true; });
      socket.once('close', () => peers.delete(socket));
      let input = Buffer.alloc(0), greeted = false;
      socket.on('data', chunk => {
        if (greeted) return;
        input = Buffer.concat([input, typeof chunk === 'string' ? Buffer.from(chunk) : chunk]);
        if (input.length >= 4 && input.length >= input.readUInt32BE(0)) {
          greeted = true;
          socket.write(Buffer.from('5200000008000000005a0000000549', 'hex'));
        }
      });
    });
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address(); assert.ok(address && typeof address === 'object');
    const pool = createPool(`postgresql://fixture@127.0.0.1:${address.port}/fixture?sslmode=disable`, `tal-ts-${run}-halfopen`, 1);
    pools.push(pool);
    // Only SQL answers are stubbed. Startup, client.end(), pool.remove, and TCP are real.
    pool.on('acquire', client => Object.defineProperty(client, 'query', { value: async (text: string) => ({
      rows: text.startsWith('INSERT') ? [{ reservation_id: '00000000-0000-0000-0000-000000000001', sku: 'item', quantity: 1 }] : [], rowCount: 1,
    }) }));
    const controller = new AbortController(); const reason = new DOMException('Idle cancellation', 'AbortError');
    const svc = new ReservationService(pool, { afterInsert: async () => { controller.abort(reason); throw reason; } }, 30);
    let rescued = false;
    const rescue = setTimeout(() => { rescued = true; for (const peer of peers) peer.destroy(); }, 1_500);
    const task = svc.reserve('fixture', 'key', { sku: 'item', quantity: 1 }, { signal: controller.signal });
    const outcome = task.then(value => ({ value }), error => ({ error }));
    try {
      await until(() => halfClosed, 'peer received client half-close', 1_000); const result = await outcome;
      assert.ok('error' in result); assert.equal(result.error, reason); assert.equal(rescued, false);
      assert.equal(pool.totalCount, 0); assert.equal(pool.listenerCount('remove'), 0);
      return { realSocket: true, sqlResponsesStubbed: true, peerHalfCloseObserved: true, cleanupAllowanceMs: 30, externalRescueUsed: false, nativeCancellation: true };
    } finally {
      clearTimeout(rescue); for (const peer of peers) peer.destroy();
      await task.catch(() => undefined);
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
  await scenario('boundary-validation', async () => {
    const who = tenant(); await seed(who); const svc = service({}, 1);
    const badCommands: unknown[] = [null, [], {}, { sku: 'item' }, { quantity: 1 }, { sku: 'item', quantity: 1, extra: true },
      ...[...common.invalid_quantities, NaN, Infinity].map(quantity => ({ sku: 'item', quantity })),
      ...['', 'has space', 'x'.repeat(129), 'nul\0', 'é'].map(sku => ({ sku, quantity: 1 }))];
    for (const command of badCommands) await expectCode(svc.reserve(who, 'key', command), 'InvalidInput');
    for (const key of ['', 'has space', 'x'.repeat(129), 'nul\0', 'é']) await expectCode(svc.reserve(who, key, { sku: 'item', quantity: 1 }), 'InvalidInput');
    for (const invalidTenant of ['', 'has space', 'x'.repeat(129), 'nul\0', 'é']) await expectCode(svc.reserve(invalidTenant, 'key', { sku: 'item', quantity: 1 }), 'InvalidInput');
    assert.deepEqual(await state(who), { available: 5, reservations: 0 }); assert.equal(svc.pool.totalCount, 0);
    const canceled = new DOMException('Already aborted', 'AbortError');
    await assert.rejects(svc.reserve(who, 'unused', { sku: 'item', quantity: 1 }, { signal: AbortSignal.abort(canceled) }), error => error === canceled);
    assert.equal(svc.pool.totalCount, 0);
    for (const quantity of common.valid_quantities) {
      const validTenant = tenant(); await seed(validTenant, quantity);
      await svc.reserve(validTenant, '~'.repeat(128), { sku: 'item', quantity });
      assert.deepEqual(await state(validTenant), { available: 0, reservations: 1 });
    }
    const a = await svc.reserve(who, 'key', JSON.parse('{"sku":"item","quantity":1.0}'));
    assert.deepEqual(await svc.reserve(who, 'key', JSON.parse('{"sku":"item","quantity":1e0}')), a);
    await expectCode(svc.reserve(who, 'missing', { sku: 'missing', quantity: 1 }), 'UnavailableInventory');
    return { invalidCommandCount: badCommands.length, invalidKeyCount: 5, invalidTenantCount: 5, numericIntegralFormsEquivalent: true, validQuantityCount: common.valid_quantities.length, preAbortedAcquireAvoided: true, state: await state(who) };
  });
} finally {
  await Promise.all(pools.map(pool => pool.end()));
}
await scenario('resource-finalization', async () => {
  await until(async () => {
    const result = await observer.query<{ count: number }>(
      'SELECT count(*)::integer FROM pg_stat_activity WHERE application_name=ANY($1::text[])', [applications]);
    return result.rows[0]?.count === 0;
  }, 'all server sessions gone after pools close');
  return { allApplicationSessionsGone: true };
});
const sessions = (await observer.query<{ count: number }>(
  'SELECT count(*)::integer FROM pg_stat_activity WHERE application_name=ANY($1::text[])', [applications])).rows[0]?.count;
await observer.end();
assert.ok(common.scenarios.every(required => scenarios.some(result => result.id === required.id)), 'Every shared scenario was executed');
const report = {
  language: 'typescript', runtime: process.version, drivers: { pg: JSON.parse(readFileSync(new URL('./node_modules/pg/package.json', import.meta.url), 'utf8')).version },
  startedAt, completedAt: new Date().toISOString(), postgres: version, scenarios,
  resources: { remainingApplicationSessions: sessions, poolsClosed: pools.length },
  limitations: [
    'Local PostgreSQL and nonpipeline pg only; no TLS, failover, replication, crash, restore, or external-provider atomicity.',
    'Trusted tenant is supplied by the fixture; authentication and HTTP disconnect mapping are not implemented.',
    'Fault-injected TCP COMMIT reply suppression uses the common proxy; it is not a naturally occurring network failure.',
    'Success receipts are retained without expiry. Test gates control real transaction timing and are not production extension points.',
  ],
};
const output = JSON.stringify(report, null, 2) + '\n';
if (process.env.TAL_EXAMPLE_REPORT) writeFileSync(process.env.TAL_EXAMPLE_REPORT, output);
console.log(output);
if (scenarios.some(item => item.status !== 'passed')) process.exitCode = 1;
