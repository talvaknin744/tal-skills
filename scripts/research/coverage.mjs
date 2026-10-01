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
