import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('optional research collector deterministic contracts, without network', t => {
  const probe = spawnSync('python3', ['-c', 'import requests, bs4'], { cwd: root, encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    t.skip('Collector environment unavailable: Python, requests and beautifulsoup4 are optional; see scripts/research/requirements-blog-crawler.txt');
    return;
  }
  const result = spawnSync('python3', ['tests/research-crawler/collector-checks.py'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, timeout: 120000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
