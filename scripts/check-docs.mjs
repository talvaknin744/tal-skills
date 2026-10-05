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
const files = ['README.md', 'CONTRIBUTING.md', 'AGENTS.md'].map(name => path.join(root, name));
for (const directory of ['docs', 'examples', 'agents', 'workflows', 'integrations']) files.push(...markdownFiles(path.join(root, directory)));
const failures = [];
let links = 0;
const automaticInvocation = 'Invocation: automatic';
const architectureInvocation = 'Invocation: user-invoked. Claude Code project skill: /architecture. Claude Code plugin skill: /tal-skills:architecture. Codex: $architecture. Automatic invocation is disabled.';
for (const filename of files.sort()) {
  const contents = fs.readFileSync(filename, 'utf8');
  const relativeFilename = path.relative(root, filename);
  const match = relativeFilename.match(/^docs\/(engineering|performance|languages|temporal)\/([^/]+)\.md$/);
  if (match && match[2] !== 'README') {
    const [, bucket, name] = match;
    const canonicalPath = path.join(root, 'skills', bucket, name, 'SKILL.md');
    const invocationMatch = contents.match(/^Invocation: (.+)$/gm) ?? [];
    const lines = contents.split(/\r?\n/);
    const sectionStart = lines.indexOf('## When to reach for it');
    let sectionEnd = sectionStart + 1;
    while (sectionStart >= 0 && sectionEnd < lines.length && !lines[sectionEnd].startsWith('## ')) sectionEnd++;
    const section = sectionStart < 0 ? '' : lines.slice(sectionStart + 1, sectionEnd).join('\n');
    if (!fs.existsSync(canonicalPath)) {
      failures.push(`${relativeFilename}: no canonical skill package for invocation policy`);
    } else {
      const frontmatter = fs.readFileSync(canonicalPath, 'utf8').split('---', 2)[1] ?? '';
      const disabled = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter);
      const expected = disabled ? architectureInvocation : automaticInvocation;
      if (invocationMatch.length !== 1 || invocationMatch[0] !== expected || !section.includes(expected)) {
        failures.push(`${relativeFilename}: expected exactly "${expected}" under When to reach for it`);
      }
    }
  }
  for (const raw of markdownTargets(contents)) {
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
