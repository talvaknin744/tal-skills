const HASH = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(`Research archive manifest: ${message}`);
}

export function parseResearchArchiveManifest(markdown) {
  if (typeof markdown !== 'string') fail('expected Markdown text');
  const archiveName = markdown.match(/^- Archive: `([^`]+)`$/m)?.[1];
  const archiveSha256 = markdown.match(/^- Archive SHA-256: ([a-f0-9]{64})$/m)?.[1];
  const archiveBytes = Number(markdown.match(/^- Compressed size: (\d+) bytes$/m)?.[1]);
  const releaseUrl = markdown.match(/^- Planned GitHub v1\.0\.0 release URL \(pending upload\): (https:\/\/[^\s]+)$/m)?.[1];
  const coverageCatalogSha256 = markdown.match(/^- Coverage catalog SHA-256: ([a-f0-9]{64})$/m)?.[1];
  if (!archiveName || !archiveSha256 || !Number.isSafeInteger(archiveBytes) || archiveBytes <= 0 || !releaseUrl || !coverageCatalogSha256) {
    fail('missing or invalid archive identity');
  }
  if (!markdown.includes('| Repository-relative original path | Bytes | SHA-256 | Record count |')) {
    fail('missing archived-file table');
  }
  const entries = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\| (?:<a id="[a-z0-9-]+"><\/a>)?([^|]+) \| (\d+) \| ([a-f0-9]{64}) \| (\d+) \|$/);
    if (!match) continue;
    const [, fileText, bytesText, sha256, countText] = match;
    const file = fileText.trim();
    if (file.startsWith('/') || /[\\\x00-\x1f]/.test(file)
      || file.split('/').some(part => !part || part === '.' || part === '..')) fail(`unsafe path: ${file}`);
    if (!file.startsWith('docs/research/')) fail(`path outside research: ${file}`);
    const bytes = Number(bytesText), recordCount = Number(countText);
    if (!Number.isSafeInteger(bytes) || bytes <= 0 || !Number.isSafeInteger(recordCount) || recordCount < 0) {
      fail(`invalid size or record count: ${file}`);
    }
    if (!HASH.test(sha256)) fail(`invalid digest: ${file}`);
    if (entries.has(file)) fail(`duplicate path: ${file}`);
    entries.set(file, { path: file, bytes, sha256, recordCount });
  }
  if (!entries.size) fail('empty archived-file table');
  return { archiveName, archiveSha256, archiveBytes, coverageCatalogSha256, releaseUrl, entries };
}

export function validateResearchInventoryBindings(parsed, publisherManifest, researchRoot = 'docs/research/engineering-toolkit/2026-10-01') {
  const used = new Set();
  for (const publisher of publisherManifest.publishers ?? []) {
    const inventoryPath = `${researchRoot}/${publisher.inventory_path}`;
    const entry = parsed.entries.get(inventoryPath);
    if (!entry) fail(`publisher inventory missing from table: ${publisher.publisher_id}`);
    if (used.has(inventoryPath) && entry.sha256 !== publisher.inventory_sha256) {
      fail(`shared inventory digest mismatch: ${publisher.publisher_id}`);
    }
    if (entry.sha256 !== publisher.inventory_sha256) fail(`inventory digest mismatch: ${publisher.publisher_id}`);
    if (['array', 'articles', 'records'].includes(publisher.inventory_format)
        && (publisherManifest.publishers ?? []).filter(item => item.inventory_path === publisher.inventory_path).length === 1
        && entry.recordCount !== publisher.record_count) fail(`inventory record count mismatch: ${publisher.publisher_id}`);
    used.add(inventoryPath);
  }
  return used;
}

export function validateResearchCoverageBindings(parsed, publisherManifest, researchRoot = 'docs/research/engineering-toolkit/2026-10-01') {
  const used = new Set();
  for (const publisher of publisherManifest.publishers ?? []) {
    const coveragePath = `${researchRoot}/${publisher.coverage_path}`;
    const entry = parsed.entries.get(coveragePath);
    if (!entry || entry.sha256 !== publisher.coverage_sha256) {
      throw new Error(`Research archive coverage digest missing or mismatched: ${publisher.publisher_id}`);
    }
    used.add(coveragePath);
  }
  return used;
}
