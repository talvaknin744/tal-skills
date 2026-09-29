#!/usr/bin/env node
import fs from 'node:fs';
import { loadCatalog, generateBundle, adapterFiles } from './toolkit/index.mjs';
import { readTree, inspect } from './toolkit/paths.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';
try {
  const args = options(process.argv.slice(2), { '--source': 'one', '--help': 'boolean' });
  if (args['--help']) console.log('Usage: node scripts/check-toolkit.mjs [--source <catalog-root>]');
  else {
    const root = fs.realpathSync(args['--source'] ?? repositoryRoot), catalog = loadCatalog(root);
    generateBundle(catalog, { host: 'both' });
    // Individual installation closures must work independently of the full catalog.
    for (const name of catalog.agents.keys()) generateBundle(catalog, { host: 'both', agents: [name] });
    for (const name of catalog.workflows.keys()) generateBundle(catalog, { host: 'both', workflows: [name] });
    const expected = adapterFiles(catalog), actual = inspect(root, 'adapters') ? readTree(root, 'adapters') : new Map();
    for (const name of new Set([...actual.keys(), ...expected.keys()])) if (!actual.has(name) || !expected.has(name) || !actual.get(name).bytes.equals(expected.get(name).bytes)) throw new Error(`Generated adapter drift: ${name}`);
    if ([...actual.keys()].some(name => name.endsWith('/SKILL.md'))) throw new Error('Committed adapters must use SKILL.md.template');
    console.log(`Toolkit valid: ${catalog.agents.size} roles, ${catalog.workflows.size} workflows, ${expected.size} native artifacts`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
