#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO, DEFAULT_CODEX, freezeCandidates, prepareTrial, runTrial, scoringInputs, validateScore, verifyTrial, assertSealedEvidence, requireIndependentVerification } from './lib.mjs';

const [command, ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  const key = args[i];
  if (!key.startsWith('--') || Object.hasOwn(options, key.slice(2))) throw new Error(`Invalid argument: ${key}`);
  if (key === '--execute') options.execute = true;
  else { if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value: ${key}`); options[key.slice(2)] = args[++i]; }
}
const allowed = { freeze: ['repo','out'], prepare: ['repo','freeze','skill','case','out'], run: ['trial','binary','execute','timeout-ms'], verify: ['trial','check-id'], 'score-inputs': ['trial','out'], 'check-score': ['score','rubric','trial'] };
for (const key of Object.keys(options)) if (!allowed[command]?.includes(key)) throw new Error(`Unknown option for ${command}: --${key}`);
const requireOption = name => { if (!options[name]) throw new Error(`--${name} is required`); return options[name]; };
let result;
if (command === 'freeze') {
  const output = path.resolve(requireOption('out'));
  result = await freezeCandidates(path.resolve(options.repo ?? REPO));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  result = { freeze: output, freeze_sha256: result.freeze_sha256, candidates: Object.keys(result.candidates).length };
} else if (command === 'prepare') {
  result = await prepareTrial({ repo: path.resolve(options.repo ?? REPO), freezePath: requireOption('freeze'), skill: requireOption('skill'), caseId: requireOption('case'), destination: requireOption('out') });
  result = { trial: result.trial, execution_status: result.run.execution_status, candidate_tree_sha256: result.run.candidate_tree_sha256 };
} else if (command === 'run') {
  const timeout = Number(options['timeout-ms'] ?? 180000);
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 1800000) throw new Error('Timeout must be 1,000–1,800,000 milliseconds');
  result = await runTrial({ trial: requireOption('trial'), binary: options.binary ?? DEFAULT_CODEX, execute: Boolean(options.execute), timeoutMs: timeout });
} else if (command === 'verify') {
  result = await verifyTrial({ trial: path.resolve(requireOption('trial')), checkId: requireOption('check-id') });
} else if (command === 'score-inputs') {
  result = await scoringInputs({ trial: path.resolve(requireOption('trial')), destination: path.resolve(requireOption('out')) });
} else if (command === 'check-score') {
  const score = JSON.parse(await readFile(requireOption('score'), 'utf8'));
  const { rubric } = JSON.parse(await readFile(requireOption('rubric'), 'utf8'));
  const run = JSON.parse(await readFile(path.join(requireOption('trial'), 'evidence', 'run.json'), 'utf8'));
  await assertSealedEvidence(path.resolve(requireOption('trial')), run);
  result = validateScore(score, rubric, run);
  if (result.rubric_result === 'pass') result.independent_verification = await requireIndependentVerification(path.resolve(options.trial), run);
} else {
  throw new Error('Usage: node scripts/evals/cli.mjs <freeze|prepare|run|verify|score-inputs|check-score> [options]. See evals/engineering-toolkit/README.md.');
}
console.log(JSON.stringify(result, null, 2));
