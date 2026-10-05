"""Publish observable evaluation artifacts with original and published hashes.

Use fresh destination names. This exports evidence, never runs or grades a model.
Full native dependency trees are retained separately from the editable project.
"""
import hashlib
import json
import posixpath
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
OUTPUT = REPO / "evals/engineering-toolkit/runs/2026-10-02"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def observable(value):
    if isinstance(value, list):
        return [observable(item) for item in value]
    if not isinstance(value, dict):
        return value
    method = str(value.get("method", ""))
    reason = None
    if "reasoning" in str(value.get("type", "")) or re.search(r"[/_]reasoning[/_]", method):
        reason = "reasoning payload"
    elif method.startswith("account/") or method.startswith("remoteControl/"):
        reason = "unrelated account or remote-control metadata"
    if reason:
        return {key: value[key] for key in ["type", "method", "id"] if key in value} | {
            "payload_omitted": True, "omission_reason": reason
        }
    return {key: observable(item) for key, item in value.items()
            if not re.match(r"encrypted_?|raw_?reasoning$", key, re.I)}


def derived_native_bindings(score, trial, sources, binding_paths):
    """Bind the explicit host-qualified score inventory without changing its grade."""
    def safe_path(value, absolute):
        if not isinstance(value, str) or not value or "\\" in value or "\x00" in value:
            raise ValueError("Unsafe native score path")
        parts = value.split("/")[1:] if absolute else value.split("/")
        if value.startswith("/") != absolute or any(part in {"", ".", ".."} for part in parts):
            raise ValueError(f"Unsafe native score path: {value}")
        return Path(value)

    root = safe_path(score.get("trial_root"), True)
    if root.resolve() != trial.resolve():
        raise ValueError("Native score inventory root mismatch")
    declared = dict((relative, source) for source, relative in sources)
    bindings = {}

    def bind(source_path, expected_hash):
        safe_path(source_path, True)
        if not isinstance(expected_hash, str) or not re.fullmatch(r"[a-f0-9]{64}", expected_hash):
            raise ValueError(f"Invalid native score hash: {source_path}")
        relative = binding_paths.get(source_path)
        if relative is None or relative not in declared:
            raise ValueError(f"Native score binding is not a declared copy source: {source_path}")
        if relative in bindings and bindings[relative] != expected_hash:
            raise ValueError(f"Conflicting native score binding: {relative}")
        if digest(declared[relative].read_bytes()) != expected_hash:
            raise ValueError(f"Native score source hash mismatch: {relative}")
        bindings[relative] = expected_hash
        return relative

    def rows(key):
        value = score.get(key)
        if not isinstance(value, list) or not value or any(not isinstance(row, dict) for row in value):
            raise ValueError(f"Missing or invalid native score inventory: {key}")
        return value

    for row in rows("source_artifacts"):
        bind(row.get("path"), row.get("sha256"))
    for row in rows("original_inputs"):
        original = bind(row.get("path"), row.get("sha256"))
        copied = bind(row.get("trial_path"), row.get("sha256"))
        if not original.startswith("original-project/"):
            raise ValueError("Original native input must bind an original-project copy source")
        relative = original.removeprefix("original-project/")
        if (copied != "trial/" + relative
                or Path(row["trial_path"]).resolve() != (trial / "trial" / relative).resolve()):
            raise ValueError("Original native input trial_path must identify its corresponding trial copy source")
    inventory_paths = set()
    for row in rows("complete_final_inventory"):
        relative = safe_path(row.get("path"), False).as_posix()
        if relative in inventory_paths:
            raise ValueError(f"Duplicate native score inventory path: {relative}")
        inventory_paths.add(relative)
        bind(str(root / "trial" / relative), row.get("sha256"))
    expected_paths = {source.relative_to(trial / "trial").as_posix()
                      for source, _ in sources if source.is_relative_to(trial / "trial")}
    if inventory_paths != expected_paths:
        raise ValueError("Native score complete final inventory differs from declared trial copy sources")
    return dict(sorted(bindings.items()))


def archive(trial, name, scoring, fixture=None):
    trial, scoring = Path(trial), Path(scoring)
    destination = OUTPUT / name
    run = json.loads((trial / "evidence/run.json").read_text())
    native = fixture is not None
    entries = []
    sources = []
    copy_destinations = set()
    binding_paths = {}
    derived_bindings = None

    def copy(source, relative):
        source = Path(source)
        if source.is_symlink() or not source.is_file():
            raise ValueError(f"Regular source file required: {source}")
        if relative in copy_destinations:
            raise ValueError(f"Duplicate archive copy destination: {relative}")
        copy_destinations.add(relative)
        sources.append((source, relative))

    def publish(source, relative):
        original = source.read_bytes()
        text = original.decode()
        if relative.endswith(".jsonl"):
            text = "\n".join(json.dumps(observable(json.loads(line)), separators=(",", ":"))
                             for line in text.splitlines()) + "\n"
        elif relative.endswith(".json"):
            value = json.loads(text)
            if relative != "score.json":
                value = observable(value)
            if relative == "score.json" and native:
                if derived_bindings is not None:
                    value["bindings"] = derived_bindings
                else:
                    declared = set(binding_paths.values())
                    value["bindings"] = {
                        (path if path in declared else binding_paths[path]): sha
                        for path, sha in value["bindings"].items()
                    }
            text = json.dumps(value, indent=2) + "\n"
        elif relative.endswith(".md"):
            def link(match):
                raw = match.group(1)
                target = raw.removeprefix("<").removesuffix(">")
                target = re.sub(r":\d+$", "", target)
                mapped = binding_paths.get(target)
                if mapped is None:
                    return match.group(0)
                return "](" + posixpath.relpath(mapped, posixpath.dirname(relative) or ".") + ")"
            text = re.sub(r"\]\((<?[^)]+>?)\)", link, text)
        aliases = {str(trial): "/TRIAL", str(trial.resolve()): "/TRIAL",
                   str(scoring): "/SCORING", str(scoring.resolve()): "/SCORING"}
        for alias in sorted(aliases, key=len, reverse=True):
            text = text.replace(alias, aliases[alias])
        text = text.replace(str(REPO), "/SOURCE").replace(str(Path.home()), "/Users/example")
        published = text.encode()
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(published)
        entries.append({"path": relative, "original_sha256": digest(original),
                        "published_sha256": digest(published), "transformed": original != published})

    def tree(source, prefix, predicate=lambda source: True):
        if source.is_symlink() or not source.is_dir():
            raise ValueError(f"Required source directory absent or symlinked: {source}")
        for source_file in sorted(source.rglob("*")):
            if source_file.is_symlink():
                raise ValueError(f"Symlink refused: {source_file}")
            if source_file.is_file() and predicate(source_file):
                copy(source_file, prefix + "/" + str(source_file.relative_to(source)))

    tree(trial / "evidence", "evidence")
    if native:
        fixture = Path(fixture)
        copy(fixture / "case-index.json", "fixture-index.json")
        if (fixture / "control.json").exists():
            copy(fixture / "control.json", "control.json")
        if (fixture.parent / "scenario-manifest.json").exists():
            copy(fixture.parent / "scenario-manifest.json", "scenario-manifest.json")
        tree(fixture / "tal-worker-rollout/rawfiles", "original-project")
        copy(fixture / "tal-worker-rollout/prompt.md", "original-project/prompt.md")
        def dependency(source):
            return source.relative_to(trial / "trial").parts[0] in {".agents", ".codex", ".tal-skills"}
        tree(trial / "trial", "trial", lambda source: not dependency(source))
        tree(trial / "trial", "candidate-dependencies", dependency)
    else:
        tree(trial / "before/project", "original-project")
        tree(trial / "workspace/project", "final-project")
        tree(trial / "before/.agents/skills" / run["skill"], "candidate")
    for filename in ["observer-supplement.json", "rubric.json", "review.md", "score.json"]:
        if (scoring / filename).exists():
            copy(scoring / filename, filename)
    for source, relative in sources:
        binding_paths[str(source)] = relative
        binding_paths[str(source.resolve())] = relative
        # score-inputs contains byte-for-byte projections of these artifacts.
        # Rebase scorer links only after checking they name the same input.
        projected = scoring / relative
        if projected.is_file() and projected.resolve() != source.resolve():
            if projected.read_bytes() != source.read_bytes():
                raise ValueError(f"Scorer projection differs from source: {relative}")
            binding_paths[str(projected)] = relative
            binding_paths[str(projected.resolve())] = relative
    score_identity = json.loads((scoring / "score.json").read_text())
    if native and "bindings" not in score_identity:
        derived_bindings = derived_native_bindings(score_identity, trial, sources, binding_paths)
    destination.mkdir(parents=True, exist_ok=False)
    for source, relative in sources:
        publish(source, relative)
    manifest = {"schema_version": 1,
                "run_id": score_identity.get("run_id", score_identity.get("trial_id", trial.name)),
                "complete_source_trees": ["original-project", "trial", "candidate-dependencies"] if native
                                         else ["candidate", "original-project", "final-project"],
                "transformation_notes": [
                    "Original hashes retain source bindings; published paths and JSON formatting are normalized.",
                    "Reasoning payloads and unrelated account/remote-control metadata are omitted, never scored.",
                    "Native score binding paths are mapped to declared archived artifacts; original score hash is retained.",
                    "Markdown artifact links are rebased to archive-relative files; locator line suffixes are removed.",
                    "Candidate dependency files are separate from the editable project; no missing tree is implied."
                ], "files": entries}
    if derived_bindings is not None:
        manifest["transformation_notes"].append(
            "Published native score bindings were derived from its explicit source_artifacts, "
            "original_inputs and complete_final_inventory; every hash was checked against a "
            "declared copy source. Original score fields, criteria and disposition are preserved."
        )
    if native:
        manifest["workflow"] = run["workflow"]
    else:
        manifest["source_run_evidence_sha256"] = run["run_evidence_sha256"]
    (destination / "archive-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"archive": str(destination.relative_to(REPO)), "files": len(entries)}))


if __name__ == "__main__":
    archive(*sys.argv[1:])
