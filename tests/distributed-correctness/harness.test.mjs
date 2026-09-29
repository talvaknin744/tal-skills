import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Cache } from '../../evals/distributed-correctness/fixtures/cache-fill-invalidation/model.mjs';

const execute = promisify(execFile);
const fixture = fileURLToPath(new URL('../../evals/distributed-correctness/fixtures/cache-fill-invalidation/', import.meta.url));

test('cache fixture starts red on three deterministic race schedules', async () => {
  await assert.rejects(
    execute(process.execPath, ['verify.mjs'], { cwd: fixture, timeout: 5000 }),
    error => {
      assert.equal(error.code, 1);
      assert.equal(error.stderr.split('\n').filter(line => line.startsWith('FAIL ')).length, 3);
      assert.equal(error.stdout.split('\n').filter(line => line.startsWith('PASS ')).length, 2);
      return true;
    },
  );
});

test('cache harness accepts shared conditional publication in an isolated copy', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'cache-fixture-integrity-'));
  try {
    await cp(fixture, workspace, { recursive: true });
    const source = await readFile(path.join(workspace, 'service.mjs'), 'utf8');
    // This evaluator-side correction checks that the harness is satisfiable;
    // it is not included in raw projects or passed to candidate agents.
    const corrected = source
      .replace('await this.cache.set(id, record);', 'await this.cache.publishIfFresh(id, record);')
      .replace('await this.cache.delete(id);', 'await this.cache.advanceFloor(id, record.revision);');
    assert.notEqual(corrected, source);
    await writeFile(path.join(workspace, 'service.mjs'), corrected);
    const { stdout, stderr } = await execute(process.execPath, ['verify.mjs'], { cwd: workspace, timeout: 5000 });
    assert.equal(stderr, '');
    assert.equal(stdout.split('\n').filter(line => line.startsWith('PASS ')).length, 5);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('provided cache adapter retains monotonic floors across eviction and reordering', async () => {
  const cache = new Cache();
  await cache.advanceFloor('north', 8);
  await cache.evict('north');
  await cache.advanceFloor('north', 5);
  assert.equal(await cache.publishIfFresh('north', { id: 'north', revision: 7 }), false);
  assert.equal(await cache.get('north'), undefined);
  assert.equal(await cache.publishIfFresh('north', { id: 'north', revision: 9 }), true);
  await cache.advanceFloor('north', 8);
  assert.equal((await cache.get('north')).revision, 9);
  assert.equal(await cache.publishIfFresh('north', { id: 'north', revision: 8 }), false);
  assert.equal((await cache.get('north')).revision, 9);
  assert.equal(await cache.publishIfFresh('south', { id: 'south', revision: 1 }), true);
});
