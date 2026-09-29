// Check attribution freshness. This does not rerun or grade the experiments.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reports = [
  ['examples/backend/python/evidence/verified.json', 'candidate_hashes', ''],
  ['examples/backend/typescript/verification-attempts.json', 'source_hashes', 'examples/backend/typescript'],
  ['examples/backend/go/verification-history.json', 'source_sha256', ''],
  ['examples/messaging/evidence/verification.json', 'source_sha256', 'examples/messaging'],
  ['examples/cache/report.json', 'candidate_sha256', 'examples/cache', 'verify.py'],
  ['examples/draining/verification.json', 'source_sha256', 'examples/draining'],
  ['examples/infrastructure/verification.json', 'source_hashes', 'examples/infrastructure'],
  ['examples/recovery/report.json', 'verifier_sha256', 'examples/recovery', 'verify.py'],
  ['examples/quality/evidence.json', 'candidate_sha256', 'examples/quality'],
  ['examples/protocols/mcp/observed.json', 'source_sha256', 'examples/protocols/mcp'],
  ['examples/protocols/a2a/evidence/verified-run.json', 'source_sha256', 'examples/protocols/a2a'],
  ['examples/ownership-boundaries/evidence/verified-run.json', 'source_sha256', 'examples/ownership-boundaries'],
  ['examples/sqlalchemy-gotchas/evidence/verified-run.json', 'source_sha256', 'examples/sqlalchemy-gotchas'],
];
const failures = [];
let checked = 0;
for (const [report, key, base, single] of reports) {
  const data = JSON.parse(fs.readFileSync(path.join(root, report), 'utf8'));
  const records = single ? { [single]: data[key] } : data[key];
  if (!records || typeof records !== 'object' || !Object.keys(records).length) throw new Error(`Missing source hashes: ${report}`);
  for (const [filename, expected] of Object.entries(records)) {
    if (path.isAbsolute(filename) || filename.includes('\\') || filename.split('/').some(part => !part || part === '..' || part === '.')) throw new Error(`Unsafe evidence source path in ${report}`);
    const source = path.join(base, filename);
    if (!/^[a-f0-9]{64}$/.test(expected)) throw new Error(`Invalid source hash: ${report}: ${filename}`);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, source))).digest('hex');
    if (actual !== expected) failures.push(`${report}: source changed since observation: ${source}`);
    checked++;
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Runtime evidence attribution current: ${checked} source hashes in ${reports.length} reports; experiments were not rerun`);
