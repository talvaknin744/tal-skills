import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function options(argv, allowed) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!allowed[flag]) throw new Error(`Unknown option: ${flag}`);
    const rule = allowed[flag];
    if (rule === 'boolean') { if (result[flag]) throw new Error(`Repeated option: ${flag}`); result[flag] = true; }
    else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      if (rule === 'many') (result[flag] ??= []).push(value);
      else { if (result[flag] !== undefined) throw new Error(`Repeated option: ${flag}`); result[flag] = value; }
    }
  }
  return result;
}
