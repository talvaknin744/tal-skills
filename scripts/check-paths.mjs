#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowed = new Set(['example', 'node', 'runner']);
export function personalPathHits(text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const matches = [...line.matchAll(/(?<![a-z0-9/.:_-])\/(?:Users|home)\/([a-z][a-z0-9_.-]*)/gi)]
      .filter(match => !allowed.has(match[1]));
    return matches.length ? [{ line: index + 1, paths: matches.map(match => match[0]) }] : [];
  });
}
export function checkPaths(root) {
  const names = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).split('\0').filter(Boolean);
  const failures = [];
  for (const name of names) {
    const filename = path.join(root, name);
    if (!fs.existsSync(filename) || !fs.lstatSync(filename).isFile()) continue;
    const bytes = fs.readFileSync(filename);
    if (bytes.includes(0)) continue;
    for (const hit of personalPathHits(bytes.toString('utf8'))) failures.push(`${name}:${hit.line}: personal home path: ${hit.paths.join(', ')}`);
  }
  return failures;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url));
  const failures = checkPaths(root);
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
  else console.log('Personal home paths absent from source files');
}
