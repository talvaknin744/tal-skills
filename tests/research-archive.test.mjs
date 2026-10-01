import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateCoverageAttribution } from '../scripts/research/coverage.mjs';

const base = new URL('../docs/research/engineering-toolkit/2026-10-01/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('archive-manifest.json', base)));
const entry = id => manifest.publishers.find(item => item.publisher_id === id);
const proof = id => JSON.parse(fs.readFileSync(new URL(entry(id).coverage_path, base)));

test('each published coverage summary and gap list belongs to its surveyed publisher', () => {
  for (const publisher of manifest.publishers) {
    validateCoverageAttribution(publisher, JSON.parse(fs.readFileSync(new URL(publisher.coverage_path, base))));
  }
});

test('a valid proof from another publisher cannot replace the requested proof', () => {
  assert.throws(() => validateCoverageAttribution(entry('openai'), proof('anthropic')), /publisher mismatch/);
});

test('blocked archive gaps cannot be erased', () => {
  const altered = structuredClone(entry('pinterest'));
  altered.coverage_gaps = [];
  assert.throws(() => validateCoverageAttribution(altered, proof('pinterest')), /summary or gaps mismatch/);
});

test('blocked archive terminal qualifications cannot be erased', () => {
  const altered = structuredClone(entry('pinterest'));
  altered.coverage_summary = 'terminal';
  assert.throws(() => validateCoverageAttribution(altered, proof('pinterest')), /summary or gaps mismatch/);
});

test('an unbound binary history-completeness flag cannot be introduced', () => {
  const altered = { ...entry('pinterest'), history_or_access_gap: false };
  assert.throws(() => validateCoverageAttribution(altered, proof('pinterest')), /Unbound coverage flag/);
});

test('combined proofs require one matching publisher and preserve terminal objects', () => {
  const discord = proof('discord');
  const altered = structuredClone(entry('discord'));
  altered.coverage_summary.proven = true;
  assert.throws(() => validateCoverageAttribution(altered, discord), /summary or gaps mismatch/);
  const matching = discord.publishers.find(item => item.publisher_id === 'discord');
  discord.publishers.push(structuredClone(matching));
  assert.throws(() => validateCoverageAttribution(entry('discord'), discord), /publisher mismatch/);
});
