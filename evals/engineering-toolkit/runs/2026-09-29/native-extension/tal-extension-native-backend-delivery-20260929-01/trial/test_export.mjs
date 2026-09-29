import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { exportRecords } from './export.ts';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function bounded(promise, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Watchdog: ${label}`)), 2000);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

const checkpoint = () => new Promise(resolve => setImmediate(resolve));

// Real Node streams; only the record producer and resource-release gates are
// synthetic. Delaying _destroy makes outstanding owned cleanup observable.
function fixture({ open = false, blockWrite = false, autoDestroy = true, emitClose = true } = {}) {
  const writeEntered = deferred(), finish = deferred();
  const sourceDestroyEntered = deferred(), sinkDestroyEntered = deferred();
  let releaseSource, releaseSink, writeCallback, cleaning = false;
  let sourceDestroyCalls = 0, sinkDestroyCalls = 0, produced = false;
  const records = [];
  const source = new Readable({
    objectMode: true, highWaterMark: 1, autoDestroy, emitClose,
    read() {
      if (!produced) { produced = true; this.push({ sequence: 0 }); }
      else if (!open) this.push(null);
    },
    destroy(error, callback) {
      sourceDestroyCalls += 1;
      releaseSource = failure => { releaseSource = undefined; callback(failure ?? error); };
      sourceDestroyEntered.resolve();
      if (cleaning) releaseSource();
    },
  });
  const destination = new Writable({
    objectMode: true, highWaterMark: 1, autoDestroy, emitClose,
    write(record, encoding, callback) {
      records.push(record);
      if (blockWrite) writeCallback = callback;
      writeEntered.resolve();
      if (!blockWrite) callback();
    },
    destroy(error, callback) {
      sinkDestroyCalls += 1;
      releaseSink = failure => { releaseSink = undefined; callback(failure ?? error); };
      sinkDestroyEntered.resolve();
      if (cleaning) releaseSink();
    },
  });
  // Observe failures without allowing a broken exporter's unhandled error to
  // terminate the test process. These listeners perform no resource cleanup.
  source.on('error', () => {});
  destination.on('error', () => {});
  destination.on('finish', () => finish.resolve());
  return {
    source, destination, records, writeEntered, finish,
    sourceDestroyEntered, sinkDestroyEntered,
    releaseSource: error => releaseSource?.(error),
    releaseSink: error => releaseSink?.(error),
    releaseWrite(error) {
      const callback = writeCallback;
      writeCallback = undefined;
      callback?.(error);
    },
    assertClosedOnce() {
      assert.equal(source.closed, true, 'source cleanup incomplete at settlement');
      assert.equal(destination.closed, true, 'destination cleanup incomplete at settlement');
      assert.equal(sourceDestroyCalls, 1, 'source cleanup must run exactly once');
      assert.equal(sinkDestroyCalls, 1, 'destination cleanup must run exactly once');
    },
    async cleanup() {
      cleaning = true;
      source.destroy(); destination.destroy();
      releaseSource?.(); releaseSink?.();
      this.releaseWrite();
      await bounded((async () => {
        while (!source.closed || !destination.closed) await checkpoint();
      })(), 'fixture cleanup');
    },
  };
}

function trackedExport(fixture, signal) {
  const operation = { status: 'pending' };
  operation.done = Promise.resolve().then(() => exportRecords(
    fixture.source, fixture.destination, { signal },
  )).then(
    () => { operation.status = 'fulfilled'; return { status: 'fulfilled' }; },
    error => { operation.status = 'rejected'; return { status: 'rejected', error }; },
  );
  return operation;
}

async function assertPending(operation, label) {
  // Flush Node next-tick events and promise reactions; gates, not elapsed time,
  // keep resource cleanup blocked across this scheduling checkpoint.
  await checkpoint();
  assert.equal(operation.status, 'pending', label);
}

async function withFixture(options, run) {
  const streams = fixture(options);
  try { await bounded(run(streams), 'test case'); }
  finally { await streams.cleanup(); }
}

const cases = [
  ...[true, false].flatMap(emitClose => [true, false].map(autoDestroy => [
    `success_waits_for_close_autoDestroy_${autoDestroy}${emitClose ? '' : '_emitClose_false'}`,
    () => withFixture({ autoDestroy, emitClose }, async streams => {
      const operation = trackedExport(streams);
      if (autoDestroy) {
        await streams.sourceDestroyEntered.promise;
        await assertPending(operation, 'export must wait for source resource release');
        streams.releaseSource();
      }
      await streams.finish.promise;
      await assertPending(operation, 'finish does not imply owned cleanup has finished');
      if (!autoDestroy) {
        await streams.sourceDestroyEntered.promise;
        streams.releaseSource();
      }
      await streams.sinkDestroyEntered.promise;
      await assertPending(operation, 'export must wait for destination resource release');
      streams.releaseSink();
      streams.assertClosedOnce();
      assert.equal((await operation.done).status, 'fulfilled');
      assert.deepEqual(streams.records, [{ sequence: 0 }]);
      streams.assertClosedOnce();
    }),
  ])),
  ...['abort', 'source_error', 'sink_error'].map(fault => [
    `${fault}_during_owned_cleanup`,
    () => withFixture({ autoDestroy: false }, async streams => {
      const controller = new AbortController();
      const failure = new Error(`failure during cleanup: ${fault}`);
      const operation = trackedExport(streams, controller.signal);
      await streams.finish.promise;
      await streams.sourceDestroyEntered.promise;
      if (fault === 'abort') controller.abort(failure);
      streams.releaseSource(fault === 'source_error' ? failure : undefined);
      await streams.sinkDestroyEntered.promise;
      await assertPending(operation, 'teardown failure must still join destination cleanup');
      streams.releaseSink(fault === 'sink_error' ? failure : undefined);
      const result = await operation.done;
      assert.equal(result.status, 'rejected');
      if (fault === 'abort') assert.equal(result.error?.name, 'AbortError');
      else assert.equal(result.error, failure, 'preserve the original cleanup error');
      streams.assertClosedOnce();
    }),
  ]),
  ['already_aborted_waits_for_cleanup', () => withFixture({ open: true }, async streams => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled before export'));
    const operation = trackedExport(streams, controller.signal);
    await streams.sourceDestroyEntered.promise;
    await assertPending(operation, 'pre-aborted export must join owned cleanup');
    streams.releaseSource();
    await streams.sinkDestroyEntered.promise;
    await assertPending(operation, 'pre-aborted export must join destination cleanup');
    streams.releaseSink();
    const result = await operation.done;
    assert.equal(result.status, 'rejected');
    assert.equal(result.error?.name, 'AbortError');
    streams.assertClosedOnce();
  })],
  ...[true, false].map(emitClose => [
    `abort_blocked_write_waits_for_cleanup${emitClose ? '' : '_emitClose_false'}`, () => withFixture(
    { open: true, blockWrite: true, emitClose }, async streams => {
      const controller = new AbortController();
      const operation = trackedExport(streams, controller.signal);
      await streams.writeEntered.promise;
      controller.abort(new Error('cancelled during write'));
      await streams.sourceDestroyEntered.promise;
      streams.releaseSource();
      await streams.sinkDestroyEntered.promise;
      await assertPending(operation, 'abort must wait for destination resource release');
      streams.releaseSink();
      streams.assertClosedOnce();
      const result = await operation.done;
      assert.equal(result.status, 'rejected');
      assert.equal(result.error?.name, 'AbortError');
      streams.assertClosedOnce();
    },
  )]),
  ['source_failure_during_blocked_write', () => withFixture(
    { open: true, blockWrite: true }, async streams => {
      const failure = new Error('source failed while destination was blocked');
      const operation = trackedExport(streams);
      await streams.writeEntered.promise;
      streams.source.destroy(failure);
      await streams.sourceDestroyEntered.promise;
      streams.releaseSource();
      await assertPending(operation, 'source failure must wait for destination cleanup');
      await streams.sinkDestroyEntered.promise;
      streams.releaseSink();
      const result = await operation.done;
      assert.equal(result.status, 'rejected');
      assert.equal(result.error, failure, 'preserve the original source error');
      streams.assertClosedOnce();
    },
  )],
  ['sink_failure_waits_for_source_cleanup', () => withFixture(
    { open: true, blockWrite: true }, async streams => {
      const failure = new Error('sink write failed');
      const operation = trackedExport(streams);
      await streams.writeEntered.promise;
      streams.releaseWrite(failure);
      await streams.sinkDestroyEntered.promise;
      streams.releaseSink();
      await streams.sourceDestroyEntered.promise;
      await assertPending(operation, 'sink failure must wait for source resource release');
      streams.releaseSource();
      const result = await operation.done;
      assert.equal(result.status, 'rejected');
      assert.equal(result.error, failure, 'preserve the original sink error');
      streams.assertClosedOnce();
    },
  )],
];

const results = [];
for (const [name, run] of cases) {
  try { await run(); results.push({ check: name, status: 'pass' }); }
  catch (error) { results.push({ check: name, status: 'fail', error: `${error.name}: ${error.message}` }); }
}
console.log(JSON.stringify({ node: process.version, checks: results }, null, 2));
if (results.some(result => result.status !== 'pass')) process.exitCode = 1;
