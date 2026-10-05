// Exact receipts retain original identities through redaction and link-only moves.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
const safePath = value => typeof value === 'string' && !path.posix.isAbsolute(value)
  && !/[\\\x00-\x1f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
export function originalPublishedDigest(bytes, relative, repository = root, expectedDigest) {
  const files = [];
  for (const name of ['path-redactions.json', 'archive-link-transforms.json', 'package-relocations.json', 'research-relocations.json', 'release-publication.json']) {
    const manifest = path.join(repository, 'docs', name);
    if (!fs.existsSync(manifest)) continue;
    const receipt = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (receipt.schema_version !== 1 || !Array.isArray(receipt.files)) throw new Error('Invalid publication transformation receipt');
    for (const entry of receipt.files) {
      if (!['personal-home-path-redaction', 'archive-member-link', 'package-relocation-link', 'research-relocation', 'research-member-link', 'release-publication'].includes(entry.transformation)) throw new Error(`Unknown publication transformation: ${name}`);
      const originalPath = entry.original_path ?? entry.path;
      const publishedPath = entry.published_path ?? entry.path;
      if (!safePath(originalPath) || !safePath(publishedPath) || !hashPattern.test(entry.original_sha256)
        || !hashPattern.test(entry.published_sha256)) throw new Error(`Invalid publication binding: ${name}`);
      if (entry.original_sha256 === entry.published_sha256 && originalPath === publishedPath) throw new Error(`Empty publication binding: ${name}`);
      files.push({ originalPath, publishedPath, originalHash: entry.original_sha256, publishedHash: entry.published_sha256 });
    }
  }
  // Callers of historical inventories may still supply the archived path.
  let currentPath = relative;
  const relocations = files.filter(entry => entry.originalPath !== entry.publishedPath);
  for (const entry of relocations) if (entry.originalPath === currentPath) currentPath = entry.publishedPath;
  let digest = sha256(bytes);
  const consumed = new Set();
  while (true) {
    if (expectedDigest !== undefined && digest === expectedDigest) return digest;
    const candidates = files.filter(entry => entry.publishedPath === currentPath && !consumed.has(entry));
    if (!candidates.length) return digest;
    const matching = candidates.filter(entry => entry.publishedHash === digest);
    if (matching.length !== 1) throw new Error(`Redacted publication changed or ambiguous binding: ${currentPath}`);
    const entry = matching[0]; consumed.add(entry);
    digest = entry.originalHash; currentPath = entry.originalPath;
  }
}
