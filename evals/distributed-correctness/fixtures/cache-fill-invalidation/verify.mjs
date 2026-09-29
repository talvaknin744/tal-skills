import assert from 'node:assert/strict';
import { LabelService } from './service.mjs';
import { Cache, Database } from './model.mjs';

const checks = [];
const check = (name, run) => checks.push({ name, run });
function setup() {
  const database = new Database([
    { id: 'north', label: 'Original', revision: 1 },
    { id: 'south', label: 'Separate', revision: 1 },
  ]);
  const cache = new Cache();
  return { database, cache, a: new LabelService(database, cache), b: new LabelService(database, cache) };
}

check('a delayed fill cannot regress reads started after a completed write', async () => {
  const { database, a, b } = setup();
  const gate = database.pauseNextRead();
  const overlappingRead = a.read('north');
  await gate.captured;
  const committed = await b.write('north', 'Revised');
  gate.release();
  await overlappingRead; // This read overlaps the write; either snapshot is permitted.
  assert.deepEqual(await b.read('north'), committed);
});

check('evicting a cached value does not allow an older delayed fill to return', async () => {
  const { database, cache, a, b } = setup();
  const gate = database.pauseNextRead();
  const overlappingRead = a.read('north');
  await gate.captured;
  const committed = await b.write('north', 'Revised');
  await b.read('north');
  await cache.evict('north');
  gate.release();
  await overlappingRead;
  assert.deepEqual(await b.read('north'), committed);
});

check('a delayed earlier write notification cannot erase knowledge of a newer revision', async () => {
  const { database, cache, a, b } = setup();
  const gate = database.pauseNextRead();
  const overlappingRead = a.read('north');
  await gate.captured;
  await b.write('north', 'Second');
  const committed = await b.write('north', 'Third');
  await cache.advanceFloor('north', 2);
  await cache.evict('north');
  gate.release();
  await overlappingRead;
  assert.deepEqual(await b.read('north'), committed);
});

check('a populated cache serves repeated reads without extra database reads', async () => {
  const { database, a, b } = setup();
  const first = await a.read('north');
  assert.deepEqual(await b.read('north'), first);
  assert.equal(database.readCount, 1);
});

check('a write to another account leaves a populated entry usable', async () => {
  const { database, a, b } = setup();
  const first = await a.read('north');
  await b.write('south', 'Another');
  assert.deepEqual(await b.read('north'), first);
  assert.equal(database.readCount, 1);
});

let failures = 0;
for (const { name, run } of checks) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}\n${error.stack}`);
  }
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
process.exitCode = failures ? 1 : 0;
