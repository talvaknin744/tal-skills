import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Meta bounded publisher prose and malformed metadata refusals', t => {
  const probe = spawnSync('python3', ['-c', 'import requests, bs4'], { cwd: root, encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    t.skip('Optional collector environment unavailable, requires Python and declared requests and bs4 dependencies');
    return;
  }
  const result = spawnSync('python3', ['tests/research-crawler/meta-portability-checks.py'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, timeout: 120000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
