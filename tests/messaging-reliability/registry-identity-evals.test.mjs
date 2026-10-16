import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Authored corpus and fixture integrity, not agent or vendor runtime behavior.
const root = fileURLToPath(new URL('../../', import.meta.url));
const corpusPath = path.join(root, 'evals/messaging-reliability/cases-v2-registry-identity.json');
const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
const readJSON = async relative => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');

test('registry extension preserves the exact original corpus and required regression selection', async () => {
  const bytes = await readFile(path.join(root, 'evals/messaging-reliability/cases.json'));
  assert.equal(sha256(bytes), '86c1a8ca1e78b82f8814e37573110ca3057c453730c3f9ba9c304bf0ab6c018b');
  const old = JSON.parse(bytes);
  assert.deepEqual(old.cases.map(item => item.id), ['reordered-account-events', 'commit-before-ack', 'local-observer-callback']);
  const map = await readFile(path.join(root, 'evals/messaging-reliability/extension-map-v2-registry-identity.md'), 'utf8');
  for (const item of old.cases) assert.ok(map.includes(`\`${item.id}\``));
});

test('registry extension has two review positives and a natural local nontrigger', () => {
  assert.equal(corpus.format_version, 1);
  assert.equal(corpus.cases.length, 3);
  assert.equal(corpus.cases.filter(item => item.activation === 'activate').length, 2);
  assert.equal(corpus.cases.filter(item => item.activation === 'do_not_auto_activate').length, 1);
  for (const key of ['id', 'prompt', 'fixture_dir']) {
    assert.equal(new Set(corpus.cases.map(item => item[key])).size, 3);
  }
});

for (const item of corpus.cases) {
  test(`${item.id}: scope, capabilities and observable criteria remain explicit`, () => {
    assert.match(item.id, /^v2-[a-z0-9-]+$/);
    assert.ok(item.prompt.length > 100);
    assert.equal(item.prompt.includes('messaging-reliability'), false);
    assert.ok(item.tags.length >= 2);
    assert.ok(['review', 'nontrigger'].includes(item.task_mode));
    assert.equal(item.activation === 'do_not_auto_activate', item.task_mode === 'nontrigger');
    assert.deepEqual(item.capabilities, { web: false, subagents: false, commands: true });
    assert.equal(item.editable_files, undefined);
    assert.ok(item.rubric.length >= 3);
    assert.equal(new Set(item.rubric.map(rule => rule.id)).size, item.rubric.length);
    assert.ok(item.rubric.some(rule => rule.severity === 'critical'));
    for (const rule of item.rubric) {
      assert.ok(['critical', 'major', 'minor'].includes(rule.severity));
      assert.ok(rule.criterion.length > 30);
    }
  });

  test(`${item.id}: raw project is complete and isolated from private scoring`, async () => {
    assert.match(item.fixture_dir, /^evals\/messaging-reliability\/fixtures\/v2-[a-z0-9-]+$/);
    const fixturesRoot = await realpath(path.join(root, 'evals/messaging-reliability/fixtures'));
    const project = await realpath(path.join(root, item.fixture_dir));
    assert.ok(project.startsWith(fixturesRoot + path.sep));
    assert.equal(new Set(item.fixtures).size, item.fixtures.length);
    assert.deepEqual((await readdir(project)).sort(), [...item.fixtures].sort());
    let bytes = 0;
    for (const fixture of item.fixtures) {
      assert.equal(path.isAbsolute(fixture), false);
      assert.equal(/cases\.json|rubric|scores|expected-answer/i.test(fixture), false);
      const resolved = await realpath(path.join(project, fixture));
      assert.ok(resolved.startsWith(project + path.sep));
      assert.ok((await stat(resolved)).isFile());
      const content = await readFile(resolved, 'utf8');
      assert.ok(content.trim().length >= 40);
      if (fixture.endsWith('.json')) assert.doesNotThrow(() => JSON.parse(content));
      bytes += Buffer.byteLength(content);
    }
    assert.ok(bytes >= 150);
  });
}

test('context collision fixture keeps identical retained ID with distinguishable writer schemas and business units', async () => {
  const prefix = 'evals/messaging-reliability/fixtures/v2-contextual-id-collision';
  const inventory = await readJSON(`${prefix}/registry-inventory.json`);
  const record = await readJSON(`${prefix}/retained-record.json`);
  const wire = Buffer.from(record.value_hex, 'hex');
  assert.equal(wire[0], 0);
  assert.equal(wire.readUInt32BE(1), record.envelope.schema_id);
  assert.equal(wire.readUInt32BE(1), inventory.source.schema_id);
  assert.equal(record.envelope.registry_and_context_in_wire, false);
  const retail = inventory.target.contexts.find(item => item.context === '.retail');
  const imported = inventory.target.contexts.find(item => item.context === '.imported-wholesale');
  assert.equal(retail.schema_id, inventory.source.schema_id);
  assert.notEqual(retail.schema.name, inventory.source.schema.name);
  assert.deepEqual(retail.schema.fields, inventory.source.schema.fields);
  assert.notEqual(retail.business_unit, inventory.source.business_unit);
  assert.deepEqual(imported.schema, inventory.source.schema);
  assert.equal(imported.actual_client_decode_verified, false);
  assert.equal(record.lookup_captures.every(item => item.decoder_exception === null), true);
  assert.notEqual(record.lookup_captures[0].business_effect_usd, record.lookup_captures[1].business_effect_usd);
  assert.equal(record.ledger_observation.amount_decimal, record.lookup_captures[0].business_effect_usd);
  assert.ok(inventory.clients.some(item => item.version === null && item.context_base_path_observed === null));
});

test('restore fixture retains original ID collision and missing historical reference without inventing an impossible registration', async () => {
  const inventory = await readJSON('evals/messaging-reliability/fixtures/v2-registry-restore-identity-gap/recovery-inventory.json');
  const retained = inventory.retained_sample;
  const wire = Buffer.from(retained.value_hex, 'hex');
  assert.equal(wire[0], 0);
  assert.equal(wire.readUInt32BE(1), retained.source_writer_id);
  const original = inventory.source.schemas.find(item => item.id === retained.source_writer_id);
  const collision = inventory.target.schemas.find(item => item.id === retained.source_writer_id);
  assert.notEqual(collision.schema.name, original.schema.name);
  const restoredOrder = inventory.target.schemas.find(item => item.subject === original.subject);
  assert.notEqual(restoredOrder.id, original.id);
  assert.equal(inventory.target.version, null);
  assert.equal(inventory.target.mode_mutability, null);
  assert.equal(inventory.source.backup.reconstruction_verified, false);
  assert.equal(inventory.business_topic_check.raw_checksums_equal, true);
  for (const side of ['source', 'target']) {
    for (const schema of inventory[side].schemas) {
      for (const reference of schema.references) {
        assert.ok(inventory[side].schemas.some(item => item.subject === reference.subject && item.version === reference.version));
      }
    }
  }
  for (const reference of original.references) {
    assert.equal(inventory.target.schemas.some(item => item.subject === reference.subject && item.version === reference.version), false);
  }
  assert.equal(inventory.target.consumer_admission, 'paused');
  assert.equal(inventory.target.client.actual_retained_decode_verified, false);
});
