import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { exportRecords } from './export.ts';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

// A watchdog is only a failure bound. No successful assertion depends on a delay.
async function bounded(promise, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Watchdog: ${label}`)), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function trackedExport(source, destination, signal) {
  const state = { status: 'pending' };
  state.done = Promise.resolve().then(() => exportRecords(source, destination, { signal })).then(
    () => { state.status = 'fulfilled'; return { status: 'fulfilled' }; },
    error => { state.status = 'rejected'; return { status: 'rejected', error }; },
  );
  return state;
}

class Source extends Readable {
  constructor(total) {
    super({ objectMode: true, highWaterMark: 1 });
    this.total = total;
    this.produced = 0;
    this.destroyCalls = 0;
    this.closedGate = deferred();
    this.on('close', () => this.closedGate.resolve());
    // Test observation prevents a broken implementation's unhandled error from
    // terminating the verifier; it does not clean up either stream for it.
    this.on('error', () => {});
  }
  _read() {
    if (this.produced < this.total) this.push({ sequence: this.produced++ });
    else if (Number.isFinite(this.total)) this.push(null);
  }
  _destroy(error, callback) {
    this.destroyCalls += 1;
    callback(error);
  }
}

class OpenSource extends Source {
  constructor() { super(Infinity); }
  _read() {
    if (this.produced === 0) this.push({ sequence: this.produced++ });
    // Remain open until the operation cancels or fails.
  }
}

class Sink extends Writable {
  constructor({ holdWrite = false, holdFinal = false } = {}) {
    super({ objectMode: true, highWaterMark: 1 });
    this.holdWrite = holdWrite;
    this.holdFinal = holdFinal;
    this.records = [];
    this.destroyCalls = 0;
    this.firstWrite = deferred();
    this.finalEntered = deferred();
    this.errorSeen = deferred();
    this.closedGate = deferred();
    this.on('error', error => this.errorSeen.resolve(error));
    this.on('close', () => this.closedGate.resolve());
  }
  _write(record, encoding, callback) {
    this.records.push(record);
    if (this.records.length === 1) {
      if (this.holdWrite) this.writeCallback = callback;
      this.firstWrite.resolve();
      if (this.holdWrite) return;
    }
    callback();
  }
  _final(callback) {
    if (this.holdFinal) this.finalCallback = callback;
    this.finalEntered.resolve();
    if (!this.holdFinal) callback();
  }
  releaseWrite(error) {
    const callback = this.writeCallback;
    this.writeCallback = undefined;
    callback?.(error);
  }
  releaseFinal() {
    const callback = this.finalCallback;
    this.finalCallback = undefined;
    callback?.();
  }
  _destroy(error, callback) {
    this.destroyCalls += 1;
    callback(error);
  }
}

async function closedExactlyOnce(source, destination) {
  await bounded(Promise.all([source.closedGate.promise, destination.closedGate.promise]), 'owned streams close');
  assert.equal(source.destroyCalls, 1, 'source cleanup must run once');
  assert.equal(destination.destroyCalls, 1, 'destination cleanup must run once');
}

async function cleanup(source, destination) {
  source.destroy();
  destination.destroy();
  destination.releaseWrite();
  destination.releaseFinal();
  await bounded(Promise.all([source.closedGate.promise, destination.closedGate.promise]), 'verifier cleanup');
}

const cases = [
  ['completion_after_finish', async () => {
    const source = new Source(4), destination = new Sink({ holdFinal: true });
    try {
      const operation = trackedExport(source, destination);
      await bounded(destination.finalEntered.promise, 'destination finalization starts');
      // Drain promise reactions triggered by entry into _final, without sleeping.
      await Promise.resolve(); await Promise.resolve();
      assert.equal(operation.status, 'pending', 'export resolved before destination finish');
      assert.equal(destination.writableFinished, false);
      destination.releaseFinal();
      assert.equal((await bounded(operation.done, 'successful completion')).status, 'fulfilled');
      assert.equal(destination.writableFinished, true);
      assert.deepEqual(destination.records, [0, 1, 2, 3].map(sequence => ({ sequence })));
      await closedExactlyOnce(source, destination);
    } finally { await cleanup(source, destination); }
  }],
  ['slow_sink_backpressure', async () => {
    const source = new Source(64), destination = new Sink({ holdWrite: true });
    try {
      const operation = trackedExport(source, destination);
      await bounded(destination.firstWrite.promise, 'first sink write');
      // A check-phase checkpoint lets the finite synchronous source expose any
      // greedy reads. Progress remains blocked by the explicit write gate.
      await new Promise(resolve => setImmediate(resolve));
      assert.ok(destination.writableLength <= 1, `queued ${destination.writableLength} records behind a blocked write`);
      assert.ok(source.produced <= 4, `greedily consumed ${source.produced} records`);
      assert.equal(operation.status, 'pending');
      destination.releaseWrite();
      assert.equal((await bounded(operation.done, 'slow sink completion')).status, 'fulfilled');
      assert.deepEqual(destination.records, Array.from({ length: 64 }, (_, sequence) => ({ sequence })));
      await closedExactlyOnce(source, destination);
    } finally { await cleanup(source, destination); }
  }],
  ['sink_error_closes_source', async () => {
    const source = new OpenSource(), destination = new Sink({ holdWrite: true });
    const failure = new Error('synthetic sink failure');
    try {
      const operation = trackedExport(source, destination);
      await bounded(destination.firstWrite.promise, 'first sink write');
      destination.releaseWrite(failure);
      assert.equal(await bounded(destination.errorSeen.promise, 'sink error notification'), failure);
      const result = await bounded(operation.done, 'sink error propagation');
      assert.equal(result.status, 'rejected'); assert.equal(result.error, failure);
      assert.equal(source.destroyed, true, 'sink failure left source active');
      await closedExactlyOnce(source, destination);
    } finally { await cleanup(source, destination); }
  }],
  ['source_error_closes_sink', async () => {
    const source = new OpenSource(), destination = new Sink();
    const failure = new Error('synthetic source failure');
    try {
      const operation = trackedExport(source, destination);
      await bounded(destination.firstWrite.promise, 'first sink write');
      source.destroy(failure);
      const result = await bounded(operation.done, 'source error propagation');
      assert.equal(result.status, 'rejected'); assert.equal(result.error, failure);
      assert.equal(destination.destroyed, true, 'source failure left sink active');
      await closedExactlyOnce(source, destination);
    } finally { await cleanup(source, destination); }
  }],
  ['abort_closes_owned_pipeline', async () => {
    const source = new OpenSource(), destination = new Sink({ holdWrite: true });
    const controller = new AbortController();
    try {
      const operation = trackedExport(source, destination, controller.signal);
      await bounded(destination.firstWrite.promise, 'first sink write');
      controller.abort(new Error('synthetic caller cancellation'));
      const result = await bounded(operation.done, 'abort propagation');
      assert.equal(result.status, 'rejected'); assert.equal(result.error?.name, 'AbortError');
      assert.equal(source.destroyed, true, 'abort left source active');
      assert.equal(destination.destroyed, true, 'abort left sink active');
      await closedExactlyOnce(source, destination);
    } finally { await cleanup(source, destination); }
  }],
];

const results = [];
for (const [name, run] of cases) {
  try { await run(); results.push({ check: name, status: 'pass' }); }
  catch (error) { results.push({ check: name, status: 'fail', error: `${error.name}: ${error.message}` }); }
}
console.log(JSON.stringify({ node: process.version, checks: results }, null, 2));
if (results.some(result => result.status !== 'pass')) process.exitCode = 1;
