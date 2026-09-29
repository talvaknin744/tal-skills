#!/usr/bin/env bash
set -euo pipefail

example_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
python_bin="${PYTHON:-python3}"
report_path="$("$python_bin" -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).resolve())' "${1:-/tmp/tal-mcp-observed.json}")"
runtime_dir="$(mktemp -d "${TMPDIR:-/tmp}/tal-mcp-verify.XXXXXX")"
cleanup() {
  local status=$?
  if [[ -d "$runtime_dir/.go-mod" ]]; then
    GOMODCACHE="$runtime_dir/.go-mod" go clean -modcache || status=1
  fi
  "$python_bin" -c 'import pathlib,shutil,sys; p=pathlib.Path(sys.argv[1]); assert p.name.startswith("tal-mcp-verify."); shutil.rmtree(p)' "$runtime_dir" || status=1
  exit "$status"
}
trap cleanup EXIT

cp "$example_dir"/{server.ts,package.json,package-lock.json,tsconfig.json,verify.sh,README.md} "$runtime_dir/"
cp -R "$example_dir/python" "$example_dir/go" "$runtime_dir/"
cd "$runtime_dir"
export GOCACHE="$runtime_dir/.go-build"
export GOMODCACHE="$runtime_dir/.go-mod"
export PYTHONPYCACHEPREFIX="$runtime_dir/.pycache"

npm ci --ignore-scripts --cache "$runtime_dir/.npm" --no-audit --no-fund
"$python_bin" -m venv .venv
.venv/bin/python -m pip install --disable-pip-version-check --quiet \
  --cache-dir "$runtime_dir/.pip" --require-hashes --only-binary=:all: \
  -r python/requirements.lock
.venv/bin/python -m pip check
.venv/bin/python python/verify.py --report "$report_path"
