import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
const checkOnly = process.argv.includes('--check');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (!fs.existsSync(pluginPath)) {
  console.error('.claude-plugin/plugin.json is missing');
  process.exit(1);
}

const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
if (plugin.version === packageJson.version) {
  console.log(`Plugin version matches package.json: ${packageJson.version}`);
} else if (checkOnly) {
  console.error(`Plugin version ${plugin.version ?? '(missing)'} does not match package.json ${packageJson.version}`);
  process.exitCode = 1;
} else {
  plugin.version = packageJson.version;
  fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);
  console.log(`Updated plugin version to ${packageJson.version}`);
}
