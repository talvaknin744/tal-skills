import { isDeepStrictEqual } from 'node:util';

// Lane collectors use different schemas. Preserve their actual terminal
// qualifications and failures rather than interpreting them as lifetime coverage.
export function validateCoverageAttribution(publisher, document) {
  const id = publisher.publisher_id;
  if (Object.hasOwn(publisher, 'history_or_access_gap')) {
    throw new Error(`Unbound coverage flag: ${id}; use the attributed summary and gaps`);
  }
  const matches = document?.publishers?.filter(item => item.publisher_id === id);
  const proof = matches ? (matches.length === 1 ? matches[0] : null) : document;
  if (!proof || proof.publisher_id !== id) throw new Error(`Coverage publisher mismatch: ${id}`);
  const summary = proof.scope_completion ?? proof.status ?? proof.coverage_status
    ?? proof.terminal_state ?? proof.terminal ?? proof.terminal_scope;
  const gaps = proof.gaps ?? proof.failures ?? [];
  if (!summary || !publisher.scope || !Array.isArray(gaps)
    || !isDeepStrictEqual(summary, publisher.coverage_summary)
    || !isDeepStrictEqual(gaps, publisher.coverage_gaps)) {
    throw new Error(`Coverage summary or gaps mismatch: ${id}`);
  }
  return proof;
}

export function validateCoverageCatalog(manifest, catalog, expectedSource = {}) {
  if (catalog?.schema_version !== 1 || catalog.publisher_count !== manifest.publisher_count
    || catalog.all_article_bodies_read !== false || !Array.isArray(catalog.publishers)) {
    throw new Error('Coverage catalog schema/count/reading boundary mismatch');
  }
  if (catalog.source_manifest_path !== expectedSource.path
    || catalog.source_manifest_sha256 !== expectedSource.sha256) {
    throw new Error('Coverage catalog source manifest binding mismatch');
  }
  if (catalog.publishers.length !== manifest.publishers.length) throw new Error('Coverage catalog publisher count mismatch');
  const seen = new Set();
  const entries = new Map();
  const summaryKeys = ['scope_completion', 'status', 'coverage_status', 'terminal_state', 'terminal', 'terminal_scope'];
  for (const publisher of manifest.publishers) {
    const matches = catalog.publishers.filter(entry => entry.publisher_id === publisher.publisher_id);
    if (matches.length !== 1) throw new Error(`Coverage catalog publisher missing or repeated: ${publisher.publisher_id}`);
    const entry = matches[0];
    if (seen.has(entry.publisher_id)) throw new Error(`Coverage catalog publisher repeated: ${entry.publisher_id}`);
    seen.add(entry.publisher_id);
    if (entry.source_coverage_path !== publisher.coverage_path
      || entry.source_coverage_sha256 !== publisher.coverage_sha256
      || !['publisher_entry', 'single_publisher'].includes(entry.source_document_format)
      || !Number.isSafeInteger(entry.source_coverage_bytes) || entry.source_coverage_bytes <= 0) {
      throw new Error(`Coverage catalog proof binding mismatch: ${publisher.publisher_id}`);
    }
    if (!summaryKeys.includes(entry.summary_key) || !Array.isArray(entry.gaps)
      || !isDeepStrictEqual(entry.summary, publisher.coverage_summary)
      || !isDeepStrictEqual(entry.gaps, publisher.coverage_gaps)) {
      throw new Error(`Coverage catalog summary or gaps mismatch: ${publisher.publisher_id}`);
    }
    const document = { publisher_id: entry.publisher_id, [entry.summary_key]: entry.summary, [entry.gaps_key ?? 'gaps']: entry.gaps };
    validateCoverageAttribution(publisher, document);
    entries.set(entry.publisher_id, entry);
  }
  if (seen.size !== manifest.publishers.length) throw new Error('Coverage catalog contains unknown publishers');
  return entries;
}
