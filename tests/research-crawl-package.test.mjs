import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('research archive retention, gap declarations and member integrity', t => {
  const probe = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    t.skip('Python unavailable; archive helper coverage requires its optional Python host');
    return;
  }
  const result = spawnSync('python3', ['tests/research-crawler/package-checks.py'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, timeout: 120000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
