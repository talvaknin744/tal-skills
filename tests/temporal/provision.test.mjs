import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const source = readFileSync(new URL('../../integrations/temporal/skills/temporal-cloud-setup/scripts/provision.sh', import.meta.url), 'utf8');
const entrypoint = 'main "$@"\n';
assert.ok(source.endsWith(entrypoint), 'Review the harness if the script entrypoint changes');
const directory = mkdtempSync(path.join(tmpdir(), 'tal-provision-tests-'));
after(() => rmSync(directory, { recursive: true, force: true }));

const library = path.join(directory, 'provision-library.sh');
writeFileSync(library, source.slice(0, -entrypoint.length));
const harness = path.join(directory, 'harness.sh');
// Exercise the real functions while replacing external commands. These stubs
// create only temporary files; no SDK, provider, package, or network setup runs.
writeFileSync(harness, String.raw`#!/usr/bin/env bash
source "$TEST_LIBRARY"
npm() { printf 'npm:%s\n' "$*" >> "$TEST_TRACE"; mkdir -p node_modules; return "$TEST_INSTALL_RC"; }
git() { [ "$1" = clone ] || return 92; printf 'git:clone\n' >> "$TEST_TRACE"; local last=""; for last in "$@"; do :; done; mkdir -p "$last"; }
temporal() { printf 'temporal:%s\n' "$*" >> "$TEST_TRACE"; case "$*" in 'cloud whoami'|'cloud namespace create '*) return 0;; *) return 93;; esac; }
namespace_name_for() { printf 'stub-namespace'; }
await_active_namespace() { printf 'stub-namespace.account|stub.invalid:7233'; }
case "$TEST_MODE" in
  install) cmd_install_deps --sdk ts --manager npm --dir "$TEST_PROJECT";;
  scaffold) cmd_scaffold --sdk ts --manager npm --dir "$TEST_PROJECT";;
  parallel) cmd_provision_and_scaffold --sdk ts --manager npm --dir "$TEST_PROJECT" --region stub-region;;
  *) exit 94;;
esac
`);

function run(mode, dependencyExit, project, trace) {
  const result = spawnSync('bash', ['--noprofile', '--norc', harness], {
    encoding: 'utf8', timeout: 10_000,
    env: {
      ...process.env, TEST_LIBRARY: library, TEST_TRACE: trace,
      TEST_INSTALL_RC: String(dependencyExit), TEST_MODE: mode, TEST_PROJECT: project,
    },
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null, result.stderr);
  return result;
}

for (const mode of ['install', 'scaffold', 'parallel']) {
  for (const dependencyExit of [17, 0]) {
    test(`${mode} propagates dependency ${dependencyExit ? 'failure' : 'success'}`, () => {
      const project = path.join(directory, `${mode}-${dependencyExit}`);
      const trace = `${project}.trace`;
      if (mode === 'install') mkdirSync(path.join(project, 'node_modules'), { recursive: true });
      const result = run(mode, dependencyExit, project, trace);
      assert.match(readFileSync(trace, 'utf8'), /npm:install/);
      assert.ok(existsSync(project), 'Preserve the cloned project for repair');
      if (dependencyExit) {
        assert.notEqual(result.status, 0);
        assert.match(result.stdout, /status=error\nerror_code=dependency-install-failed/);
        assert.doesNotMatch(result.stdout, /status=ok/);
        if (mode === 'parallel') {
          assert.match(result.stdout, /namespace creation was already submitted for 'stub-namespace'/);
          assert.match(result.stdout, /may have succeeded/);
        }
      } else {
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /status=ok/);
        if (mode === 'parallel') assert.match(result.stdout, /namespace_handle=stub-namespace.account/);
      }
    });
  }
}

test('retry repairs a partial dependency directory instead of skipping installation', () => {
  const project = path.join(directory, 'retry');
  const trace = `${project}.trace`;
  mkdirSync(project);
  const failed = run('install', 17, project, trace);
  assert.notEqual(failed.status, 0);
  assert.ok(existsSync(path.join(project, 'node_modules')));
  const recovered = run('install', 0, project, trace);
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.match(recovered.stdout, /status=ok/);
  assert.equal(readFileSync(trace, 'utf8').match(/npm:install/g)?.length, 2);
});
