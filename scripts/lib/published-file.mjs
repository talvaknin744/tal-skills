// Hash-bound, explicitly recorded redactions preserve historical source identity.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function originalPublishedDigest(bytes, relative, repository = root) {
  const files = [];
  for (const name of ['path-redactions.json', 'archive-link-transforms.json']) {
    const manifest = path.join(repository, 'docs', name);
    if (!fs.existsSync(manifest)) continue;
    const receipt = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (receipt.schema_version !== 1 || !Array.isArray(receipt.files)) throw new Error('Invalid publication transformation receipt');
    files.push(...receipt.files);
  }
  const matches = files.filter(entry => entry.path === relative);
  if (matches.length > 1) throw new Error(`Duplicate path-redaction receipt: ${relative}`);
  if (!matches.length) return sha256(bytes);
  const entry = matches[0];
  if (!['personal-home-path-redaction', 'archive-member-link'].includes(entry.transformation) || !/^[a-f0-9]{64}$/.test(entry.original_sha256)
      || !/^[a-f0-9]{64}$/.test(entry.published_sha256) || entry.original_sha256 === entry.published_sha256) {
    throw new Error(`Invalid path-redaction binding: ${relative}`);
  }
  if (sha256(bytes) !== entry.published_sha256) throw new Error(`Redacted publication changed: ${relative}`);
  return entry.original_sha256;
}
