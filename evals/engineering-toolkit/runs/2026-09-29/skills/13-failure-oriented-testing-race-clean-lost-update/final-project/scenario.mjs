import assert from 'node:assert/strict';

export async function runScenario(makeCounter) {
  const releases = [];
  const counter = makeCounter(() => new Promise(resolve => {
    releases.push(resolve);
  }));

  // Retained schedule: A reaches its checkpoint, then B reaches its checkpoint;
  // release A and await its completion, then release B and await its completion.
  // Both supplied models reach the hook synchronously when increment is called.
  const first = counter.increment();
  const second = counter.increment();

  releases[0]();
  await first;
  releases[1]();
  await second;

  // The split update lets both calls read 0, then each writes 1. A complete
  // update preserves both increments, regardless of the checkpoint's position.
  assert.equal(counter.value(), 2, 'two accepted increments must add two');
}
