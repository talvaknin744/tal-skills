import assert from 'node:assert/strict';
export async function runScenario(makeCounter) {
 const counter = makeCounter(async () => {});
 await counter.increment();
 await counter.increment();
 assert.equal(counter.value(), 2, 'two accepted increments must add two');
}
