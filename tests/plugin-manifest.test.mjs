import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const plugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/plugin.json'), 'utf8'));
const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));

test('Claude plugin manifest has package metadata and all supported skill packages', () => {
  const actualSkills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((bucket) => bucket.isDirectory() && bucket.name !== 'misc')
    .flatMap((bucket) => fs.readdirSync(path.join(root, 'skills', bucket.name), { withFileTypes: true })
      .filter((skill) => skill.isDirectory() && fs.existsSync(path.join(root, 'skills', bucket.name, skill.name, 'SKILL.md')))
      .map((skill) => `./skills/${bucket.name}/${skill.name}`))
    .sort();

  assert.equal(plugin.name, 'tal-skills');
  assert.equal(plugin.version, packageJson.version);
  assert.equal(plugin.description, 'Composable engineering skills, native agents, and workflows for reliable backend and distributed systems.');
  assert.equal(plugin.author.name, 'Tal Vaknin');
  assert.equal(plugin.repository, 'https://github.com/talvaknin744/tal-skills');
  assert.equal(plugin.license, 'MIT');
  assert.deepEqual(plugin.keywords, ['agent-skills', 'codex', 'claude-code', 'distributed-systems', 'backend', 'reliability']);
  assert.equal(plugin.skills.length, 35);
  assert.deepEqual([...plugin.skills].sort(), actualSkills);
  assert.ok(plugin.skills.every((skill) => !skill.startsWith('./skills/misc/')));

  assert.equal(marketplace.name, packageJson.name);
  assert.equal(marketplace.metadata.version, packageJson.version);
  assert.deepEqual(marketplace.owner, { name: 'Tal Vaknin' });
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].source, './');
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].version, packageJson.version);
  assert.equal(marketplace.plugins[0].version, plugin.version);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-skills-version-'));
  try {
    fs.mkdirSync(path.join(temporary, 'scripts'));
    fs.mkdirSync(path.join(temporary, '.claude-plugin'));
    fs.copyFileSync(path.join(root, 'scripts/sync-plugin-version.mjs'), path.join(temporary, 'scripts/sync-plugin-version.mjs'));
    fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify(packageJson));
    fs.writeFileSync(path.join(temporary, '.claude-plugin/plugin.json'), JSON.stringify(plugin));
    const stale = structuredClone(marketplace);
    stale.plugins[0].version = '0.0.0';
    const temporaryMarketplace = path.join(temporary, '.claude-plugin/marketplace.json');
    fs.writeFileSync(temporaryMarketplace, JSON.stringify(stale));
    const run = args => spawnSync(process.execPath, [path.join(temporary, 'scripts/sync-plugin-version.mjs'), ...args], { encoding: 'utf8' });
    const mismatch = run(['--check']);
    assert.equal(mismatch.status, 1, 'a stale plugin entry must fail even when marketplace metadata matches');
    assert.match(mismatch.stderr, /plugins\[0\]\.version 0\.0\.0/);
    assert.equal(run([]).status, 0);
    assert.equal(JSON.parse(fs.readFileSync(temporaryMarketplace, 'utf8')).plugins[0].version, packageJson.version);
    assert.equal(run(['--check']).status, 0);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
