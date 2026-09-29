#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog, adapterFiles } from './toolkit/index.mjs';
import { readTree, contained, inspect, parentDirectories } from './toolkit/paths.mjs';
import { options, repositoryRoot } from './toolkit/cli.mjs';
try {
  const args = options(process.argv.slice(2), { '--check': 'boolean', '--source': 'one', '--help': 'boolean' });
  if (args['--help']) console.log('Usage: node scripts/generate-adapters.mjs [--check] [--source <catalog-root>]');
  else {
    const root = fs.realpathSync(args['--source'] ?? repositoryRoot), expected = adapterFiles(loadCatalog(root));
    const actual = inspect(root, 'adapters') ? readTree(root, 'adapters') : new Map();
    const changes = [];
    for (const name of new Set([...expected.keys(), ...actual.keys()])) if (!expected.has(name) || !actual.has(name) || !expected.get(name).bytes.equals(actual.get(name).bytes)) changes.push(name);
    if (args['--check']) {
      if (changes.length) throw new Error(`Generated adapters differ:\n${changes.sort().join('\n')}`);
      console.log(`Generated adapters current: ${expected.size} files`);
    } else {
      for (const dir of parentDirectories(expected.keys())) if (!inspect(root, dir)) fs.mkdirSync(contained(root, dir));
      for (const [name, file] of expected) fs.writeFileSync(contained(root, name), file.bytes);
      for (const name of actual.keys()) if (!expected.has(name)) fs.unlinkSync(contained(root, name));
      console.log(`Generated adapters: ${expected.size} files`);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
