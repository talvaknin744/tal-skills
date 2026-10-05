import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
const marketplacePath = path.join(root, '.claude-plugin', 'marketplace.json');
const checkOnly = process.argv.includes('--check');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const expectedName = packageJson.name;
const expectedVersion = packageJson.version;

function syncVersion(filePath, label, matchesPackage, readVersion, writeVersion) {
  if (!fs.existsSync(filePath)) {
    console.error(`${label} is missing`);
    process.exitCode = 1;
    return;
  }
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!matchesPackage(value)) {
    console.error(`${label} does not identify package ${expectedName}`);
    process.exitCode = 1;
    return;
  }
  const currentVersion = readVersion(value);
  if (currentVersion === expectedVersion) {
    console.log(`${label} version matches package.json: ${expectedVersion}`);
  } else if (checkOnly) {
    console.error(`${label} version ${currentVersion ?? '(missing)'} does not match package.json ${expectedVersion}`);
    process.exitCode = 1;
  } else {
    writeVersion(value, expectedVersion);
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
    console.log(`Updated ${label} version to ${expectedVersion}`);
  }
}

syncVersion(
  pluginPath,
  '.claude-plugin/plugin.json',
  (plugin) => plugin.name === expectedName,
  (plugin) => plugin.version,
  (plugin, version) => { plugin.version = version; },
);

function syncMarketplaceVersions() {
  if (!fs.existsSync(marketplacePath)) {
    console.error('.claude-plugin/marketplace.json is missing');
    process.exitCode = 1;
    return;
  }
  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  const ownedPlugins = Array.isArray(marketplace.plugins)
    ? marketplace.plugins.filter((plugin) => plugin.name === expectedName && plugin.source === './')
    : [];
  if (marketplace.name !== expectedName || ownedPlugins.length === 0) {
    console.error(`.claude-plugin/marketplace.json does not identify package ${expectedName}`);
    process.exitCode = 1;
    return;
  }

  const versions = [
    { label: '.claude-plugin/marketplace.json metadata.version', get: () => marketplace.metadata?.version, set: (version) => {
      marketplace.metadata ??= {};
      marketplace.metadata.version = version;
    } },
    ...ownedPlugins.map((plugin, index) => ({
      label: `.claude-plugin/marketplace.json plugins[${index}].version`,
      get: () => plugin.version,
      set: (version) => { plugin.version = version; },
    })),
  ];
  const stale = versions.filter((field) => field.get() !== expectedVersion);
  if (stale.length === 0) {
    console.log(`Marketplace versions match package.json: ${expectedVersion}`);
    return;
  }
  if (checkOnly) {
    for (const field of stale) {
      console.error(`${field.label} ${field.get() ?? '(missing)'} does not match package.json ${expectedVersion}`);
    }
    process.exitCode = 1;
    return;
  }
  for (const field of stale) field.set(expectedVersion);
  fs.writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
  console.log(`Updated ${stale.length} marketplace version field(s) to ${expectedVersion}`);
}

syncMarketplaceVersions();
