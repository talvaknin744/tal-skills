#!/usr/bin/env node
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { loadCatalog, buildInstallPlan, applyInstallPlan, publicPlan, recoverInstallation } from './toolkit/index.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';

const usage = `Usage:
  tal-skills list [--json]
  tal-skills [install] [--target DIR] [--host codex|claude|both]
             [--skill NAME ...] [--workflow NAME ...] [--agent NAME ...]
             [--all] [--dry-run] [--json]
  tal-skills --recover [--target DIR] [--json]

With no selection, a terminal menu chooses packages and host. Explicit selections
default to Codex; the target defaults to the current directory. Workflows include
their agents and skills; agents include their skills. Reinstalling replaces the
previous managed selection. Local edits and skill name collisions block changes.
--dry-run only plans changes. --json requires explicit selections for installation.
Existing host settings stay unchanged; native agent execution is a separate step.
`;

const kinds = ['workflows', 'skills', 'agents'];
const singular = { skills: 'skill', workflows: 'workflow', agents: 'agent' };
const sortedEntries = map => [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const description = item => item.metadata.description.replace(/\s+/g, ' ').trim();

export function catalogReport(catalog) {
  return { schema_version: 1, ...Object.fromEntries(kinds.map(kind => [kind, sortedEntries(catalog[kind]).map(item => ({
    name: item.name, description: description(item),
    ...(kind === 'agents' ? { skills: item.skills } : {}),
    ...(kind === 'workflows' ? { agents: item.agents, skills: item.skills } : {})
  }))])) };
}

export function parseMenuSelection(answer, count, { required = false } = {}) {
  const input = answer.trim();
  if (!input) {
    if (required) throw new Error('Choose at least one number.');
    return [];
  }
  if (input.toLowerCase() === 'all') return Array.from({ length: count }, (_, i) => i);
  const selected = new Set();
  for (const token of input.split(/[\s,]+/)) {
    const match = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error('Use numbers, comma-separated numbers, ranges, or all.');
    const from = Number(match[1]), to = Number(match[2] ?? match[1]);
    if (from < 1 || to < from || to > count) throw new Error(`Choose numbers from 1 to ${count}.`);
    for (let number = from; number <= to; number++) selected.add(number - 1);
  }
  return [...selected].sort((a, b) => a - b);
}

async function promptSelection(catalog, { ask, write, host }) {
  if (!host) {
    write('Hosts: 1) Codex  2) Claude Code  3) Both\n');
    for (;;) {
      const answer = (await ask('Host [1]: ')).trim() || '1';
      if (['1', '2', '3'].includes(answer)) { host = ['codex', 'claude', 'both'][Number(answer) - 1]; break; }
      write('Choose 1, 2, or 3.\n');
    }
  }
  const available = kinds.filter(kind => catalog[kind].size);
  write('\nChoose package types (workflows include their dependencies):\n');
  available.forEach((kind, i) => write(`  ${i + 1}) ${kind} (${catalog[kind].size})\n`));
  let chosen;
  for (;;) {
    const answer = await ask('Types (numbers or all): ');
    try { chosen = parseMenuSelection(answer, available.length, { required: true }); break; }
    catch (error) { write(`${error.message}\n`); }
  }
  const selection = { skills: [], agents: [], workflows: [] };
  for (const index of chosen) {
    const kind = available[index], entries = sortedEntries(catalog[kind]);
    write(`\n${kind}:\n`);
    entries.forEach((item, i) => {
      const detail = description(item);
      write(`  ${i + 1}) ${item.name} — ${detail.length > 96 ? `${detail.slice(0, 93)}...` : detail}\n`);
    });
    for (;;) {
      const answer = await ask('Choose numbers, ranges, all, or Enter to skip: ');
      try {
        selection[kind] = parseMenuSelection(answer, entries.length).map(i => entries[i].name);
        break;
      } catch (error) { write(`${error.message}\n`); }
    }
  }
  if (!kinds.some(kind => selection[kind].length)) throw new Error('No packages selected; nothing changed.');
  return { host, ...selection };
}

function printPlan(report, write, showOperations) {
  write(`Target: ${report.target}\nHosts: ${report.hosts.join(', ')}\n`);
  for (const kind of kinds) if (report.selection[kind]?.length) write(`Selected ${kind}: ${report.selection[kind].join(', ')}\n`);
  write(`Includes ${report.resolved.agents.length} agents and ${report.resolved.skills.length} skills.\n`);
  const counts = new Map();
  for (const operation of report.operations) counts.set(operation.action, (counts.get(operation.action) ?? 0) + 1);
  write(`Files: ${[...counts].map(([action, count]) => `${count} ${action}`).join(', ')}\n`);
  if (showOperations) for (const operation of report.operations) if (operation.action !== 'unchanged') write(`  ${operation.action} ${operation.path}\n`);
  for (const item of report.conflicts) write(`Conflict: ${item.path}: ${item.reason}\n`);
  for (const warning of report.warnings) write(`Warning: ${warning}\n`);
}

export async function runLauncher(argv, {
  sourceRoot = repositoryRoot, cwd = process.cwd(), input = process.stdin,
  output = process.stdout, errorOutput = process.stderr,
  isTTY = Boolean(input.isTTY && output.isTTY), ask: injectedAsk, discoveryRoots
} = {}) {
  const write = text => output.write(text), json = argv.includes('--json');
  let reader, readerClosed = false;
  const ask = injectedAsk ?? (async question => {
    if (!reader) {
      reader = createInterface({ input, output });
      reader.on('SIGINT', () => reader.close());
      reader.on('close', () => { readerClosed = true; });
    }
    if (readerClosed) throw new Error('Selection cancelled; nothing changed.');
    const abort = new AbortController(), onClose = () => abort.abort();
    reader.once('close', onClose);
    try { return await reader.question(question, { signal: abort.signal }); }
    catch (error) {
      if (error.name === 'AbortError') throw new Error('Selection cancelled; nothing changed.');
      throw error;
    } finally { reader.off('close', onClose); }
  });
  try {
    const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'install';
    if (!['install', 'list', 'help'].includes(command)) throw new Error(`Unknown command: ${command}`);
    const args = options(command === argv[0] ? argv.slice(1) : argv, {
      '--target': 'one', '--host': 'one', '--skill': 'many', '--workflow': 'many', '--agent': 'many',
      '--all': 'boolean', '--dry-run': 'boolean', '--json': 'boolean', '--recover': 'boolean', '--help': 'boolean'
    });
    if (command === 'help' || args['--help']) { write(usage); return 0; }
    if (command === 'list') {
      if (Object.keys(args).some(flag => flag !== '--json')) throw new Error('list accepts only --json or --help');
      const report = catalogReport(loadCatalog(sourceRoot));
      if (json) write(`${JSON.stringify(report, null, 2)}\n`);
      else for (const kind of kinds) {
        write(`${kind} (${report[kind].length}):\n`);
        for (const item of report[kind]) write(`  ${item.name} — ${item.description}\n`);
      }
      return 0;
    }
    const target = path.resolve(cwd, args['--target'] ?? '.');
    if (args['--recover']) {
      if (['--host', '--skill', '--workflow', '--agent', '--all', '--dry-run'].some(flag => args[flag] !== undefined)) throw new Error('--recover cannot be combined with host, selections, or --dry-run');
      const result = recoverInstallation(target);
      write(json ? `${JSON.stringify(result, null, 2)}\n` : `Recovery: ${result.action}\n`);
      return 0;
    }
    let selection = { host: args['--host'], ...Object.fromEntries(kinds.filter(kind => args[`--${singular[kind]}`] !== undefined).map(kind => [kind, args[`--${singular[kind]}`]])) };
    const explicit = kinds.some(kind => selection[kind] !== undefined);
    if (args['--all'] && explicit) throw new Error('--all cannot be combined with --skill, --workflow, or --agent');
    let interactive = false;
    if (args['--all']) {
      const catalog = loadCatalog(sourceRoot);
      selection = { host: selection.host, ...Object.fromEntries(kinds.map(kind => [kind, [...catalog[kind].keys()]])) };
    } else if (!explicit) {
      if (json || !isTTY) throw new Error('Specify --skill, --workflow, --agent, or --all; interactive selection requires a terminal.');
      selection = await promptSelection(loadCatalog(sourceRoot), { ask, write, host: selection.host });
      interactive = true;
    }
    const plan = buildInstallPlan({ sourceRoot, target, ...selection, host: selection.host ?? 'codex', discoveryRoots });
    const report = publicPlan(plan);
    if (!json) printPlan(report, write, Boolean(args['--dry-run']));
    if (report.conflicts.length) {
      if (json) write(`${JSON.stringify(report, null, 2)}\n`);
      return 1;
    }
    if (args['--dry-run']) {
      if (json) write(`${JSON.stringify(report, null, 2)}\n`);
      else write('Dry run: no files changed.\n');
      return 0;
    }
    if (interactive && !['y', 'yes'].includes((await ask('Apply this selection? [y/N]: ')).trim().toLowerCase())) {
      write('Cancelled; no files changed.\n'); return 0;
    }
    report.result = applyInstallPlan(plan);
    if (json) write(`${JSON.stringify(report, null, 2)}\n`);
    else {
      write(report.result.applied ? `Installed ${report.result.changed_files} changed files.\n` : 'Already installed; no files changed.\n');
      write('Existing host settings stay unchanged. Native execution was not run.\n');
    }
    return 0;
  } catch (error) {
    if (json) write(`${JSON.stringify({ schema_version: 1, error: error.message }, null, 2)}\n`);
    else errorOutput.write(`${error.message}\n`);
    return 1;
  } finally { reader?.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) process.exitCode = await runLauncher(process.argv.slice(2));
