import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  assert.equal(plugin.version, '1.0.0');
  assert.equal(plugin.description, 'Composable engineering skills, native agents, and workflows for reliable backend and distributed systems.');
  assert.equal(plugin.author.name, 'Tal Vaknin');
  assert.equal(plugin.repository, 'https://github.com/talvaknin744/tal-skills');
  assert.equal(plugin.license, 'MIT');
  assert.deepEqual(plugin.keywords, ['agent-skills', 'codex', 'claude-code', 'distributed-systems', 'backend', 'reliability']);
  assert.equal(plugin.skills.length, 35);
  assert.deepEqual([...plugin.skills].sort(), actualSkills);
  assert.ok(plugin.skills.every((skill) => !skill.startsWith('./skills/misc/')));

  assert.equal(marketplace.name, 'tal-skills');
  assert.deepEqual(marketplace.owner, { name: 'Tal Vaknin' });
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].source, './');
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].version, plugin.version);
});
