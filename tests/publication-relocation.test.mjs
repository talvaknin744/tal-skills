import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { originalPublishedDigest, sha256 } from '../scripts/lib/published-file.mjs';

test('relocated evidence retains original identity through two publication stages', t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-publication-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repo, 'docs'));
  const old = 'private record', redacted = 'portable record', moved = 'portable record with current link';
  fs.writeFileSync(path.join(repo, 'docs/path-redactions.json'), JSON.stringify({schema_version:1,files:[{
    path:'docs/research/review.md', transformation:'personal-home-path-redaction', original_sha256:sha256(old),published_sha256:sha256(redacted)
  }]}));
  fs.writeFileSync(path.join(repo, 'docs/research-relocations.json'), JSON.stringify({schema_version:1,files:[{
    original_path:'docs/research/review.md',published_path:'research/review.md', transformation:'research-relocation',original_sha256:sha256(redacted),published_sha256:sha256(moved)
  }]}));
  assert.equal(originalPublishedDigest(moved,'research/review.md',repo),sha256(old));
  assert.equal(originalPublishedDigest(moved,'docs/research/review.md',repo),sha256(old));
  assert.equal(originalPublishedDigest(moved,'research/review.md',repo,sha256(redacted)),sha256(redacted));
  assert.throws(()=>originalPublishedDigest('edited score','research/review.md',repo),/publication changed/);
});

test('report spacing preserves the prior report digest and rejects later edits', t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tal-report-publication-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repo, 'docs'));
  const original = 'all84responders; score remains 0', published = 'all 84 responders; score remains 0';
  fs.writeFileSync(path.join(repo, 'docs/cleanup-followup-publication.json'), JSON.stringify({schema_version:1, files:[{
    path:'evals/run/review.md', transformation:'report-prose-spacing', original_sha256:sha256(original), published_sha256:sha256(published)
  }]}));
  assert.equal(originalPublishedDigest(published, 'evals/run/review.md', repo, sha256(original)), sha256(original));
  assert.throws(() => originalPublishedDigest(published.replace('0', '2'), 'evals/run/review.md', repo), /publication changed/);
});
