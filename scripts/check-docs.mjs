import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownTargets } from './lib/markdown-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['node_modules', '.venv', '__pycache__', '.git']);
function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink() || ignored.has(entry.name)) return [];
    return entry.isDirectory() ? markdownFiles(filename) : entry.name.endsWith('.md') ? [filename] : [];
  });
}
const files = ['README.md', 'CONTRIBUTING.md'].map(name => path.join(root, name));
for (const directory of ['docs', 'examples', 'agents', 'workflows']) files.push(...markdownFiles(path.join(root, directory)));
const failures = [];
let links = 0;
for (const filename of files.sort()) {
  for (const raw of markdownTargets(fs.readFileSync(filename, 'utf8'))) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) continue;
    const target = decodeURIComponent(raw.split('#')[0].split('?')[0]);
    if (!target) continue;
    const resolved = path.resolve(path.dirname(filename), target);
    const relative = path.relative(root, resolved);
    if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
      failures.push(`${path.relative(root, filename)}: link escapes repository: ${raw}`);
    } else if (!fs.existsSync(resolved)) {
      failures.push(`${path.relative(root, filename)}: missing local target: ${raw}`);
    }
    links++;
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Documentation references valid: ${links} local links across ${files.length} Markdown files`);
