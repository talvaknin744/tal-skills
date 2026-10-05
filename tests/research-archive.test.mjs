import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { validateCoverageAttribution, validateCoverageCatalog } from '../scripts/research/coverage.mjs';
import { parseResearchArchiveManifest, validateResearchArchiveCompleteness, validateResearchCoverageBindings, validateResearchInventoryBindings } from '../scripts/research/archive-manifest.mjs';

const base = new URL('../docs/research/engineering-toolkit/2026-10-01/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('archive-manifest.json', base)));
const researchManifestText = fs.readFileSync(new URL('../docs/research/MANIFEST.md', import.meta.url), 'utf8');
const researchManifest = parseResearchArchiveManifest(researchManifestText);
const coverageCatalog = JSON.parse(fs.readFileSync(new URL('../docs/research/coverage-catalog.json', import.meta.url), 'utf8'));
const entry = id => manifest.publishers.find(item => item.publisher_id === id);
const proof = id => {
  const record = coverageCatalog.publishers.find(item => item.publisher_id === id);
  const publisher = { publisher_id: record.publisher_id, [record.summary_key]: record.summary, [record.gaps_key ?? 'gaps']: record.gaps };
  return record.source_document_format === 'publisher_entry' ? { publishers: [publisher] } : publisher;
};

test('coverage catalog snapshots validated publisher proofs bound by the unchanged archive manifest', () => {
  const manifestBytes = fs.readFileSync(new URL('archive-manifest.json', base));
  const sourceManifestSha = createHash('sha256').update(manifestBytes).digest('hex');
  const entries = validateCoverageCatalog(manifest, coverageCatalog, {
    path: 'docs/research/engineering-toolkit/2026-10-01/archive-manifest.json',
    sha256: sourceManifestSha,
  });
  assert.equal(entries.size, 60);
  assert.equal(coverageCatalog.publisher_count, 60);
  for (const publisher of manifest.publishers) {
    const snapshot = entries.get(publisher.publisher_id);
    assert.equal(snapshot.source_coverage_path, publisher.coverage_path);
    assert.equal(snapshot.source_coverage_sha256, publisher.coverage_sha256);
    validateCoverageAttribution(publisher, proof(publisher.publisher_id));
  }
});

test('coverage catalog rejects changed source identity, terminal summary, and gaps', () => {
  const expectedSource = {
    path: 'docs/research/engineering-toolkit/2026-10-01/archive-manifest.json',
    sha256: coverageCatalog.source_manifest_sha256,
  };
  const changedDigest = structuredClone(coverageCatalog);
  changedDigest.publishers.find(item => item.publisher_id === 'openai').source_coverage_sha256 = '0'.repeat(64);
  assert.throws(() => validateCoverageCatalog(manifest, changedDigest, expectedSource), /proof binding mismatch/);
  const changedSummary = structuredClone(coverageCatalog);
  changedSummary.publishers.find(item => item.publisher_id === 'pinterest').summary = 'complete';
  assert.throws(() => validateCoverageCatalog(manifest, changedSummary, expectedSource), /summary or gaps mismatch/);
  const changedGaps = structuredClone(coverageCatalog);
  changedGaps.publishers.find(item => item.publisher_id === 'pinterest').gaps = [];
  assert.throws(() => validateCoverageCatalog(manifest, changedGaps, expectedSource), /summary or gaps mismatch/);
  assert.throws(() => validateCoverageCatalog(manifest, coverageCatalog, { ...expectedSource, sha256: 'f'.repeat(64) }), /source manifest binding mismatch/);
});

test('research archive table binds every surveyed inventory to its archived content digest', () => {
  const bound = validateResearchInventoryBindings(researchManifest, manifest);
  assert.equal(bound.size, new Set(manifest.publishers.map(item => `docs/research/engineering-toolkit/2026-10-01/${item.inventory_path}`)).size);
  const proofs = validateResearchCoverageBindings(researchManifest, manifest);
  assert.equal(proofs.size, new Set(manifest.publishers.map(item => `docs/research/engineering-toolkit/2026-10-01/${item.coverage_path}`)).size);
  assert.equal(researchManifest.entries.size, 60);
  assert.ok(researchManifest.entries.has('docs/research/engineering-toolkit/2026-10-01/storage/request-log.json'));
  assert.ok(researchManifest.entries.has('docs/research/engineering-toolkit/2026-10-01/quality/probes.json'));
  assert.equal(researchManifest.archiveName, 'tal-skills-research-crawls-2026-10-01.tar.zst');
  assert.equal(researchManifest.archiveSha256.length, 64);
  assert.ok(researchManifest.archiveBytes > 0);
  assert.equal(researchManifest.coverageCatalogSha256, createHash('sha256').update(fs.readFileSync(new URL('../docs/research/coverage-catalog.json', import.meta.url))).digest('hex'));
  assert.match(researchManifest.releaseUrl, /v1\.0\.0\/tal-skills-research-crawls-2026-10-01\.tar\.zst$/);
});

test('research archive table rejects digest tampering and unsafe or duplicate paths', () => {
  const changedDigest = researchManifestText.replace(entry('openai').inventory_sha256, '0'.repeat(64));
  assert.throws(() => validateResearchInventoryBindings(parseResearchArchiveManifest(changedDigest), manifest), /inventory digest mismatch/);
  const changedProof = researchManifestText.replace(entry('openai').coverage_sha256, '1'.repeat(64));
  assert.throws(() => validateResearchCoverageBindings(parseResearchArchiveManifest(changedProof), manifest), /coverage digest missing or mismatched/);
  const unsafe = researchManifestText.replace('docs/research/engineering-toolkit/2026-10-01/agents/openai.index.json', '../openai.index.json');
  assert.throws(() => parseResearchArchiveManifest(unsafe), /unsafe path/);
  const duplicateRow = researchManifestText.match(/^\| (?:<a id="[a-z0-9-]+"><\/a>)?docs\/research\/engineering-toolkit\/2026-10-01\/agents\/openai\.index\.json \|.*$/m)?.[0];
  assert.ok(duplicateRow);
  assert.throws(() => parseResearchArchiveManifest(`${researchManifestText}${duplicateRow}\n`), /duplicate path/);
});

test('archive completeness also protects ancillary collector receipts', () => {
  validateResearchArchiveCompleteness(researchManifest, coverageCatalog);
  const omitted = structuredClone(researchManifest);
  omitted.entries.delete('docs/research/engineering-toolkit/2026-10-01/storage/request-log.json');
  assert.throws(() => validateResearchArchiveCompleteness(omitted, coverageCatalog), /complete archived inventory mismatch/);
  const substituted = structuredClone(researchManifest);
  substituted.entries.get('docs/research/engineering-toolkit/2026-10-01/storage/request-log.json').sha256 = 'a'.repeat(64);
  assert.throws(() => validateResearchArchiveCompleteness(substituted, coverageCatalog), /complete archived inventory mismatch/);
});

test('each published coverage summary and gap list belongs to its surveyed publisher', () => {
  for (const publisher of manifest.publishers) {
    validateCoverageAttribution(publisher, proof(publisher.publisher_id));
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
