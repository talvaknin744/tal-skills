import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const packageDir = new URL('../../skills/temporal/temporal-cloud-setup/', import.meta.url);
const directory = mkdtempSync(path.join(tmpdir(), 'tal temporal cli tests '));
after(() => rmSync(directory, { recursive: true, force: true }));
const installed = path.join(directory, 'standalone package');
cpSync(packageDir, installed, { recursive: true });
const source = readFileSync(path.join(installed, 'scripts/provision.sh'), 'utf8');
assert.ok(source.endsWith('main "$@"\n'));
const library = path.join(directory, 'library.sh');
writeFileSync(library, source.slice(0, -'main "$@"\n'.length));
const harness = path.join(directory, 'harness.sh');
writeFileSync(harness, String.raw`source "$TEST_LIBRARY"
uname() { printf '%s\n' "$TEST_OS"; }
require_cmd() { case "$1" in brew) [ "$TEST_BREW" = true ];; *) command -v "$1" >/dev/null 2>&1;; esac; }
brew() {
  printf '%s\n' "$*" >> "$TEST_TRACE"
  [ "$TEST_INSTALL_RC" = 0 ] || return "$TEST_INSTALL_RC"
  TEST_STATE="$TEST_AFTER"
}
temporal() {
  case "$*" in
    --version) printf 'temporal version 1.9.1\n'; return;;
    'cloud --version') printf '%s\n' "$TEST_VERSION"; return;;
    '--profile cloud-setup config list')
      # Core v1.9.1 lists all names, even when the selected profile is absent.
      printf 'Name\n'; printf '%s\n' "$TEST_PROFILES" | tr ',' '\n'; return;;
    '--profile cloud-setup config get --prop address')
      printf 'config:get:cloud-setup:address\n' >> "$TEST_TRACE"
      if [ "$TEST_CONFIG_MODE" = malformed ]; then
        printf 'Error: invalid config\n' >&2; return 1
      fi
      if [ "$TEST_CONFIG_MODE" = unexpected-output ]; then
        # Defensive contract: even a changed CLI/error must not expose output.
        printf '%s\n' "$TEMPORAL_API_KEY"
        printf '%s\n' "$TEMPORAL_API_KEY" >&2
        return "$TEST_CONFIG_RC"
      fi
      case ",$TEST_PROFILES," in
        *,cloud-setup,*) printf 'Property  Value\naddress   stub.invalid:7233\n'; return;;
        *) printf 'Error: profile "cloud-setup" not found\n' >&2; return 1;;
      esac;;
  esac
  [ "$TEST_STATE" != missing ] || return 91
  [ "$*" = 'cloud --help' ] && { printf 'Usage:\n  temporal cloud [command]\n'; return; }
  case "$*" in *' --help') :;; *) printf 'unexpected provider command: %s\n' "$*" >&2; exit 92;; esac
  local args="$*"
  if [ "$TEST_STATE" = parent-help ]; then
    printf 'Usage:\n  temporal cloud [command]\n'
  else
    printf 'Usage:\n  temporal %s [flags]\n' "$(printf '%s' "$args" | sed 's/ --help$//')"
  fi
  printf '%s\n' 'Flags:' ' --name string' ' --region string' ' --api-key-auth-enabled' ' --retention-days int' ' --auto-confirm' ' --output string' ' --display-name string' ' --description string' ' --expiry-duration duration' ' --limit int' ' --profile string' ' --prop string' ' --workflow-id string' ' --run-id string' ' --reason string' ' --task-queue string'
  [ "$TEST_STATE" = compatible ] && printf ' --async\n'
  return 0
}
case "$TEST_MODE" in
  install) cmd_install_cli;;
  preview) cmd_preview install-cli;;
  preflight) main preflight;;
  preflight-preview) cmd_preview preflight;;
  verify) main verify-config;;
  name-probe) compgen -e | grep '^TEMPORAL_' || true;;
  *) exit 93;;
esac
`);
let serial = 0;
function run(mode, options = {}) {
  const trace = path.join(directory, `trace-${serial++}`);
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', harness], {
    encoding: 'utf8', timeout: 15_000,
    env: {
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin', TEST_LIBRARY: library, TEST_TRACE: trace,
      TEST_MODE: mode, TEST_STATE: options.state ?? 'compatible',
      TEST_PROFILES: options.profiles ?? 'default,cloud-setup', TEST_CONFIG_MODE: options.configMode ?? 'valid',
      TEST_CONFIG_RC: String(options.configRc ?? 0),
      TEST_OS: options.os ?? 'Darwin', TEST_BREW: String(options.brew ?? true),
      TEST_AFTER: options.after ?? 'compatible', TEST_INSTALL_RC: String(options.rc ?? 0),
      TEST_VERSION: options.version ?? 'temporal-cloud version v0.1.1',
      TEMPORAL_CONFIG_FILE: path.join(directory, 'config with spaces', 'temporal.toml'),
      TEMPORAL_API_KEY: 'SYNTHETIC_TEMPORAL_SECRET_DO_NOT_PRINT', TCLOUD_DISCLOSE: '1',
    },
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null, result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /SYNTHETIC_TEMPORAL_SECRET_DO_NOT_PRINT/);
  return { ...result, trace: existsSync(trace) ? readFileSync(trace, 'utf8') : '' };
}

for (const options of [{}, { version: 'development (unknown)' }, { brew: false }, { os: 'Linux' }]) {
  test(`compatible CLI requires no package mutation: ${JSON.stringify(options)}`, () => {
    const result = run('install', options);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /update=skipped\nreason=compatible/);
    assert.match(result.stdout, /version=temporal version 1\.9\.1\ncloud_version=/);
    assert.equal(result.trace, '');
    const preview = run('preview', options);
    assert.match(preview.stdout, /action=skip\nreason=compatible/);
    assert.equal(preview.trace, '');
  });
}
for (const [state, action] of [['missing', 'install'], ['incompatible', 'upgrade'], ['parent-help', 'upgrade']]) {
  test(`${state} CLI previews and performs only the required ${action}`, () => {
    const preview = run('preview', { state });
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, new RegExp(`action=${action}\\n`));
    assert.match(preview.stdout, new RegExp(`cmd_1=brew ${action} temporalio/brew/temporal-cloud`));
    assert.equal(preview.trace, '');
    const result = run('install', { state });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.trace, `${action} temporalio/brew/temporal-cloud\n`);
    assert.match(result.stdout, /status=ok/);
  });
}
for (const options of [{ rc: 17 }, { after: 'incompatible' }, { after: 'missing' }, { brew: false }, { os: 'Linux' }]) {
  test(`incompatible CLI cannot proceed: ${JSON.stringify(options)}`, () => {
    const result = run('install', { state: 'incompatible', ...options });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /=== RESULT ===\nstatus=error\nerror_code=/);
    assert.doesNotMatch(result.stdout, /status=ok/);
    assert.match(result.stdout, /=== END ===\n$/);
    if (options.brew === false || options.os === 'Linux') {
      const preview = run('preview', { state: 'incompatible', ...options });
      assert.match(preview.stdout, /action=manual/);
      assert.doesNotMatch(preview.stdout, /cmd_1=brew /);
      assert.equal(result.trace, '');
    }
  });
}
test('preflight, preview, auto-disclosure and name probe never print environment values', () => {
  for (const mode of ['preflight', 'preflight-preview', 'name-probe']) {
    const result = run(mode);
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /env \| grep/);
    assert.equal(result.trace, '');
  }
  assert.match(run('preflight').stdout, /stray_env=TEMPORAL_API_KEY/);
  assert.match(run('preflight').stdout, /cli_compatible=true\ncli_action=skip/);
});
test('config verification checks the exact selected profile using a non-secret property', () => {
  for (const profiles of ['cloud-setup', 'default,cloud-setup,production']) {
    const result = run('verify', { profiles });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '=== RESULT ===\nstatus=ok\nprofile=cloud-setup\n=== END ===\n');
    assert.equal(result.trace, 'config:get:cloud-setup:address\n');
    assert.doesNotMatch(result.stdout + result.stderr, /stub\.invalid|Property  Value/);
  }
});
for (const profiles of ['default', 'production', 'cloud-setup-copy', '']) {
  test(`config verification rejects a missing exact profile: ${profiles || '(empty)'}`, () => {
    const result = run('verify', { profiles });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /status=error\nerror_code=profile-missing/);
    assert.doesNotMatch(result.stdout, /status=ok/);
    assert.equal(result.trace, 'config:get:cloud-setup:address\n');
  });
}
test('config verification rejects unreadable or malformed config', () => {
  const result = run('verify', { configMode: 'malformed' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /error_code=profile-missing/);
  assert.doesNotMatch(result.stdout + result.stderr, /Error: invalid config/);
});
test('config verification discards unexpected credential output on success and failure', () => {
  for (const configRc of [0, 1]) {
    const result = run('verify', { configMode: 'unexpected-output', configRc });
    assert.equal(result.status, configRc);
    assert.match(result.stdout, configRc ? /error_code=profile-missing/ : /profile=cloud-setup/);
  }
});
test('changed previews retain one result and one gate block', () => {
  for (const mode of ['preview', 'preflight-preview']) {
    const result = run(mode);
    for (const marker of ['=== RESULT ===', '=== END ===', '=== GATE ===', '=== END GATE ===']) {
      assert.equal(result.stdout.split(marker).length - 1, 1, marker);
    }
  }
});

test('extracted setup references resolve within a standalone copy, including anchors', () => {
  const files = ['SKILL.md', 'references/gate-templates.md', 'references/output-format.md', 'references/phases.md'];
  const slug = heading => heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  for (const relative of files) {
    const file = path.join(installed, relative);
    const markdown = readFileSync(file, 'utf8');
    assert.doesNotMatch(markdown, /§Gate templates|no real versions|no meaningful version|always pull the latest/);
    for (const [, target] of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(target)) continue;
      const [linkPath, anchor] = target.split('#');
      const destination = path.resolve(path.dirname(file), linkPath || path.basename(file));
      assert.ok(destination.startsWith(installed + path.sep), `${relative}: ${target} leaves the package`);
      assert.ok(existsSync(destination), `${relative}: ${target} missing`);
      if (anchor) {
        const headings = [...readFileSync(destination, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => slug(match[1]));
        assert.ok(headings.includes(anchor), `${relative}: ${target} missing anchor (${headings.join(', ')})`);
      }
    }
  }
});
