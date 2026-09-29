#!/usr/bin/env node
import { buildInstallPlan, applyInstallPlan, publicPlan, recoverInstallation } from './toolkit/index.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';
let json = false;
try {
  const args = options(process.argv.slice(2), { '--target': 'one', '--host': 'one', '--workflow': 'many', '--agent': 'many', '--dry-run': 'boolean', '--json': 'boolean', '--recover': 'boolean', '--help': 'boolean' });
  json = Boolean(args['--json']);
  if (args['--help']) console.log('Usage: node scripts/install-toolkit.mjs --target <project> --host codex|claude|both [--workflow <id> ...] [--agent <id> ...] [--dry-run] [--json]\nRecovery: node scripts/install-toolkit.mjs --target <project> --recover [--json]');
  else {
    if (!args['--target']) throw new Error('--target is required');
    if (args['--recover']) {
      if (args['--host'] || args['--workflow'] || args['--agent'] || args['--dry-run']) throw new Error('--recover accepts only --target and --json');
      const result = recoverInstallation(args['--target']); console.log(json ? JSON.stringify(result, null, 2) : `Recovery: ${result.action ?? result.reason}`);
    } else {
      if (!args['--host']) throw new Error('--host is required');
      const plan = buildInstallPlan({ sourceRoot: repositoryRoot, target: args['--target'], host: args['--host'], agents: args['--agent'], workflows: args['--workflow'] });
      const report = publicPlan(plan);
      if (plan.conflicts.length) process.exitCode = 1;
      else if (!args['--dry-run']) report.result = applyInstallPlan(plan);
      if (json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`${args['--dry-run'] ? 'Dry run' : 'Installation'}: ${plan.target}`);
        for (const operation of report.operations) if (operation.action !== 'unchanged') console.log(`${operation.action}: ${operation.path}`);
        for (const conflict of report.conflicts) console.log(`conflict: ${conflict.path}: ${conflict.reason}`);
        for (const warning of report.warnings) console.log(`warning: ${warning}`);
        console.log(`Native host execution was not run. Existing host settings remain unchanged.`);
      }
    }
  }
} catch (error) { console.error(json ? JSON.stringify({ schema_version: 1, error: error.message }) : error.message); process.exitCode = 1; }
