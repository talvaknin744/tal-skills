import assert from 'node:assert/strict';
import { Readable, Writable, PassThrough } from 'node:stream';
import { finished, pipeline } from 'node:stream/promises';

function gate() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function bounded(promise, label, milliseconds = 2000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Deadline awaiting ${label}`)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Observe terminal ownership separately from an abortable finished() observer.
function trackClose(stream) {
  const closed = gate();
  const errors = [];
  const onError = (error) => { errors.push(error); };
  stream.on('error', onError);
  stream.once('close', closed.resolve);
  return {
    errors,
    async join() {
      if (!stream.closed) await bounded(closed.promise, 'stream close');
      stream.off('error', onError);
      assert.equal(stream.closed, true);
    },
  };
}

async function observerControl() {
  const stream = new PassThrough();
  const owned = trackClose(stream);
  const controller = new AbortController();
  // Attach a rejection handler before aborting: no unhandled promise loser.
  const observation = finished(stream, { signal: controller.signal, cleanup: true })
    .then(() => ({ outcome: 'fulfilled' }), (error) => ({ outcome: 'rejected', error }));
  try {
    controller.abort();
    const result = await bounded(observation, 'aborted observer');
    assert.equal(result.outcome, 'rejected');
    assert.equal(result.error.name, 'AbortError');
    assert.equal(stream.destroyed, false);

    const received = gate();
    stream.once('data', (chunk) => received.resolve(chunk.toString()));
    stream.write('work-after-observer-cancellation');
    assert.equal(await bounded(received.promise, 'continued stream work'), 'work-after-observer-cancellation');

    const completion = finished(stream, { cleanup: true });
    stream.end();
    await bounded(completion, 'owner-completed stream');
    await owned.join();
    return {
      observer_error: result.error.name,
      stream_destroyed_when_observer_rejected: false,
      stream_delivered_data_after_observer_cancellation: true,
      owner_subsequently_closed_stream: true,
    };
  } finally {
    stream.destroy();
    await bounded(observation, 'observer cleanup');
    await owned.join();
  }
}

async function pipelineOwnsTeardown() {
  const demanded = gate();
  // A read request acknowledges that the pipeline has started. No sleep and
  // no pending external operation are needed to hold this source open.
  const source = new Readable({ read() { demanded.resolve(); } });
  const destination = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const sourceOwner = trackClose(source);
  const destinationOwner = trackClose(destination);
  const controller = new AbortController();
  const operation = pipeline(source, destination, { signal: controller.signal })
    .then(() => ({ outcome: 'fulfilled' }), (error) => ({ outcome: 'rejected', error }));
  try {
    await bounded(demanded.promise, 'pipeline read demand');
    assert.equal(source.destroyed, false);
    assert.equal(destination.destroyed, false);
    controller.abort();
    const result = await bounded(operation, 'aborted pipeline');
    assert.equal(result.outcome, 'rejected');
    assert.equal(result.error.name, 'AbortError');
    await sourceOwner.join();
    await destinationOwner.join();
    assert.equal(source.destroyed, true);
    assert.equal(destination.destroyed, true);
    return {
      read_demand_observed_before_abort: true,
      pipeline_error: result.error.name,
      source_destroyed_and_closed: true,
      destination_destroyed_and_closed: true,
      pipeline_settlement_joined: true,
    };
  } finally {
    controller.abort();
    source.destroy();
    destination.destroy();
    await bounded(operation, 'pipeline cleanup');
    await sourceOwner.join();
    await destinationOwner.join();
  }
}

const scenarios = [];
for (const [id, expected, probe] of [
  ['finished-cancels-observation-only', 'observed-unsafe', observerControl],
  ['pipeline-abort-closes-owned-streams', 'pass', pipelineOwnsTeardown],
]) {
  try {
    scenarios.push({ id, status: expected, evidence: await probe() });
  } catch (error) {
    scenarios.push({ id, status: 'fail', evidence: { error: error.stack ?? String(error) } });
  }
}
console.log(JSON.stringify({
  language: 'node', runtime: process.versions.node, scenarios,
  limitations: [
    'finished() is not unsafe; the unsafe control is treating observer cancellation as stopped work.',
    'Only built-in in-memory Node streams are exercised; no HTTP sockets, external resources, or custom async generators.',
    'No backpressure, throughput, memory bound, or arbitrary third-party teardown claim.',
  ],
}));
process.exitCode = scenarios.some((scenario) => scenario.status === 'fail') ? 1 : 0;
