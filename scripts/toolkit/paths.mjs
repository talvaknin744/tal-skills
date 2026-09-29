import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const posix = value => value.split(path.sep).join('/');
export const sorted = values => [...values].sort();
export function checkId(value, label = 'name', native = false) {
  if (typeof value !== 'string' || value.length > 64 || !ID.test(value) || (native && !value.startsWith('tal-'))) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
  return value;
}
export function safeRelative(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || /[\x00-\x1f\x7f:]/.test(value)) throw new Error(`Unsafe relative path: ${value}`);
  for (const part of value.split('/')) {
    if (!part || part === '.' || part === '..' || /[. ]$/.test(part) || /[<>"|?*]/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) throw new Error(`Unsafe path segment: ${value}`);
  }
  return value;
}
export function contained(root, relative, implementation = path) {
  const candidate = implementation.resolve(root, ...safeRelative(relative).split('/'));
  const rest = implementation.relative(root, candidate);
  if (implementation.isAbsolute(rest) || rest === '..' || rest.startsWith(`..${implementation.sep}`)) throw new Error(`Path escapes target: ${relative}`);
  return candidate;
}
export function lstat(filename) {
  try { return fs.lstatSync(filename); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; }
}
export function inspect(root, relative) {
  safeRelative(relative);
  let current = root;
  const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    if (lstat(current)?.isDirectory()) {
      const alias = fs.readdirSync(current).find(name => name !== parts[i] && name.normalize('NFC').toLowerCase() === parts[i].normalize('NFC').toLowerCase());
      if (alias) throw new Error(`Case/Unicode destination collision: ${relative}`);
    }
    current = path.join(current, parts[i]);
    const stat = lstat(current);
    if (!stat) return undefined;
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${relative}`);
    if (i < parts.length - 1 && !stat.isDirectory()) throw new Error(`Parent is not a directory: ${relative}`);
    if (i === parts.length - 1) return stat;
  }
}
export function readRegular(root, relative) {
  const stat = inspect(root, relative);
  if (!stat?.isFile()) throw new Error(`Expected regular file: ${relative}`);
  // Windows does not expose portable Unix executable bits through chmod/stat.
  return { bytes: fs.readFileSync(contained(root, relative)), mode: process.platform === 'win32' ? 0o644 : stat.mode & 0o777 };
}
export function readTree(root, relative = '') {
  const directory = relative ? contained(root, relative) : root;
  const stat = relative ? inspect(root, relative) : lstat(directory);
  if (!stat?.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected ordinary directory: ${directory}`);
  const result = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    safeRelative(name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${name}`);
    if (entry.isDirectory()) for (const [key, value] of readTree(root, name)) result.set(key, value);
    else if (entry.isFile()) result.set(name, readRegular(root, name));
    else throw new Error(`Expected regular file: ${name}`);
  }
  assertDistinctPaths(result.keys());
  return result;
}
export function assertDistinctPaths(paths) {
  const seen = new Map();
  for (const name of paths) {
    safeRelative(name);
    const parts = name.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      const folded = prefix.normalize('NFC').toLowerCase();
      if (seen.has(folded) && seen.get(folded) !== prefix) throw new Error(`Case/Unicode path collision: ${seen.get(folded)} and ${prefix}`);
      seen.set(folded, prefix);
    }
  }
}
export function parentDirectories(paths) {
  const dirs = new Set();
  for (const name of paths) {
    let parent = path.posix.dirname(name);
    while (parent !== '.') { dirs.add(parent); parent = path.posix.dirname(parent); }
  }
  return sorted(dirs).sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b, 'en'));
}
