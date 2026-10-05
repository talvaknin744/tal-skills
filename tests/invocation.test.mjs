import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { loadCatalog, generateBundle } from '../scripts/toolkit/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const explicitSkills = new Set([
  'architecture',
  'temporal-cloud-setup', 'temporal-ops', 'temporal-serverless',
]);
const skillRoots = ['skills', 'integrations/temporal/skills'];
const packageDirs = [...fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
  .filter(category => category.isDirectory()).flatMap(category => fs.readdirSync(path.join(root, 'skills', category.name), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, 'skills', category.name, entry.name, 'SKILL.md')))
    .map(entry => path.join(root, 'skills', category.name, entry.name))),
...fs.readdirSync(path.join(root, 'integrations/temporal/skills'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, 'integrations/temporal/skills', entry.name, 'SKILL.md')))
  .map(entry => path.join(root, 'integrations/temporal/skills', entry.name))];
const parseSkill = filename => {
  const content = fs.readFileSync(filename, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(match, `missing frontmatter: ${filename}`);
  return parse(match[1]);
};

test('all 49 skill packages agree on explicit-only versus model invocation', () => {
  assert.equal(packageDirs.length, 49);
  const names = new Set();
  for (const directory of packageDirs) {
    const skillFile = path.join(directory, 'SKILL.md');
    const metadata = parseSkill(skillFile);
    const name = metadata.name;
    names.add(name);
    const uiFile = path.join(directory, 'agents/openai.yaml');
    assert.ok(fs.existsSync(uiFile), `missing host metadata for ${name}`);
    const ui = parse(fs.readFileSync(uiFile, 'utf8'));
    assert.equal(typeof ui.interface?.display_name, 'string', `${name}: missing display_name`);
    assert.equal(typeof ui.interface?.short_description, 'string', `${name}: missing short_description`);
    assert.equal(typeof ui.interface?.default_prompt, 'string', `${name}: missing default_prompt`);
    assert.match(ui.interface.default_prompt, new RegExp(`\\$${name}\\b`), `${name}: default prompt does not invoke package`);
    const headerExplicit = metadata['disable-model-invocation'] === true;
    const hostExplicit = ui.policy?.allow_implicit_invocation === false;
    assert.equal(headerExplicit, hostExplicit, `${name}: SKILL.md and agents/openai.yaml invocation policy disagree`);
    assert.equal(headerExplicit, explicitSkills.has(name), `${name}: unexpected invocation decision`);
    assert.equal(ui.policy?.allow_implicit_invocation === true, false, `${name}: use absence for model-invoked default`);
  }
  assert.equal(names.size, 49);
  assert.equal([...explicitSkills].every(name => names.has(name)), true);
});

test('all workflow sources and both generated host packages preserve explicit-only policy', () => {
  const workflowRoot = path.join(root, 'workflows');
  const names = fs.readdirSync(workflowRoot, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name.startsWith('tal-')).map(entry => entry.name);
  assert.equal(names.length, 8);
  const catalog = loadCatalog(root);
  const bundle = generateBundle(catalog, { host: 'both', workflows: names });
  for (const name of names) {
    const source = path.join(workflowRoot, name);
    const sourceMetadata = parseSkill(path.join(source, 'WORKFLOW.md'));
    assert.equal(sourceMetadata['disable-model-invocation'], true, `${name}: canonical workflow must be explicit-only`);
    const sourcePolicy = parse(fs.readFileSync(path.join(source, 'agents/openai.yaml'), 'utf8'));
    assert.equal(sourcePolicy.policy?.allow_implicit_invocation, false, `${name}: canonical host policy must be explicit-only`);
    for (const hostRoot of ['.agents/skills', '.claude/skills']) {
      const generated = bundle.files.get(`${hostRoot}/${name}/SKILL.md`).bytes.toString();
      const generatedMeta = parse(generated.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)[1]);
      assert.equal(generatedMeta['disable-model-invocation'], true, `${hostRoot}/${name}: generated wrapper lost policy`);
      const policyBytes = bundle.files.get(`${hostRoot}/${name}/agents/openai.yaml`);
      assert.ok(policyBytes, `${hostRoot}/${name}: missing generated OpenAI policy`);
      assert.deepEqual(parse(policyBytes.bytes.toString()), sourcePolicy, `${hostRoot}/${name}: generated policy differs from canonical source`);
    }
  }
});
