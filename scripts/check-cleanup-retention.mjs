#!/usr/bin/env node
// Phase 1 acceptance: original retained outcomes and freezes remain hash-bound.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { originalPublishedDigest, sha256 } from './lib/published-file.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = process.argv[2] ?? '67eba56a33168f2d52c8d17397a1038f76e3f20d';
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const names = git(['ls-tree', '-r', '--name-only', '-z', baseline]).toString('utf8').split('\0').filter(Boolean);
const sourceTrees = new Set(['evidence', 'candidate', 'candidates', 'candidate-dependencies', 'original-project', 'final-project', 'trial']);
let checked = 0;
for (const name of names) {
  const parts = name.split('/'), base = parts.at(-1);
  if (!name.startsWith('evals/') && !name.startsWith('docs/research/')) continue;
  const protectedName = /(?:^|[-.])(score|scores|rubric|review)(?:[-.]|$)/.test(base)
    || base.endsWith('manifest.json') || base === 'snapshot.json' || /freeze/.test(base);
  if (!protectedName) continue;
  // Raw source copies in the explicitly archived trees remain in the verified
  // release asset. The run-level results outside those trees stay in source.
  if (name.startsWith('evals/engineering-toolkit/runs/') && parts.slice(3, -1).some(part => sourceTrees.has(part))) continue;
  if (name.startsWith('evals/performance/runs/') && parts.slice(3, -1).includes('candidate')) continue;
  const currentName = name.startsWith('docs/research/') ? name.slice(5) : name;
  const filename = path.join(root, currentName);
  if (!fs.existsSync(filename)) throw new Error(`Protected retained file deleted: ${name}`);
  const original = git(['show', `${baseline}:${name}`]);
  const actual = originalPublishedDigest(fs.readFileSync(filename), name, root);
  if (actual !== sha256(original)) throw new Error(`Protected retained file changed without an original binding: ${name}`);
  checked++;
}
console.log(`Phase 1 retention verified: ${checked} original outcomes, rubrics, reviews, manifests and freezes; source-copy exclusions remain in the hash-verified release archive`);
