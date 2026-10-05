import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, generateBundle } from '../../scripts/toolkit/index.mjs';
import { createFixture } from './fixtures.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('catalog exposes all 49 public packages, including the Temporal integration packages', () => {
  const catalog = loadCatalog(repositoryRoot);
  assert.equal(catalog.skills.size, 49);
  for (const name of ['temporal-cloud-setup', 'temporal-cloud', 'temporal-developer', 'temporal-ops', 'temporal-observability', 'temporal-serverless', 'temporal-workertuning', 'temporal-workflow-design-critic']) {
    assert.ok(catalog.skills.has(name), `missing selectable skill ${name}`);
    const bundle = generateBundle(catalog, { host: 'codex', skills: [name] });
    assert.ok(bundle.files.has(`.agents/skills/${name}/SKILL.md`));
  }
});

test('workflow catalog accepts explicit invocation metadata while preserving unknown-field rejection', t => {
  const fixture = createFixture(t);
  fixture.write('workflows/tal-backend-delivery/WORKFLOW.md', '---\nschema_version: 1\nname: tal-backend-delivery\ndescription: Deliver a backend change.\nagents:\n  - tal-python\nskills: []\ndisable-model-invocation: true\n---\nUse the [handoff](../_shared/handoff.md), implement and verify.\n');
  const validWorkflow = fs.readFileSync(path.join(fixture.source, 'workflows/tal-backend-delivery/WORKFLOW.md'), 'utf8');
  const workflow = loadCatalog(fixture.source).workflows.get('tal-backend-delivery');
  assert.equal(workflow.metadata['disable-model-invocation'], true);
  fixture.write('workflows/tal-backend-delivery/WORKFLOW.md', validWorkflow.replace('disable-model-invocation: true', 'unexpected: true'));
  assert.throws(() => loadCatalog(fixture.source), /Unknown metadata/);
  fixture.write('workflows/tal-backend-delivery/WORKFLOW.md', validWorkflow.replace('disable-model-invocation: true', 'disable-model-invocation: "true"'));
  assert.throws(() => loadCatalog(fixture.source), /Invalid disable-model-invocation/);
});
