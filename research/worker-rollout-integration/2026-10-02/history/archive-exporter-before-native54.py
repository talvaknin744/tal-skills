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


def archive(trial, name, scoring, fixture=None):
    trial, scoring = Path(trial), Path(scoring)
    destination = OUTPUT / name
    run = json.loads((trial / "evidence/run.json").read_text())
    native = fixture is not None
    entries = []
    sources = []
    binding_paths = {}

    def copy(source, relative):
        source = Path(source)
        if source.is_symlink() or not source.is_file():
            raise ValueError(f"Regular source file required: {source}")
        sources.append((source, relative))

    def publish(source, relative):
        original = source.read_bytes()
        text = original.decode()
        if relative.endswith(".jsonl"):
            text = "\n".join(json.dumps(observable(json.loads(line)), separators=(",", ":"))
                             for line in text.splitlines()) + "\n"
        elif relative.endswith(".json"):
            value = observable(json.loads(text))
            if relative == "score.json" and native:
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
    destination.mkdir(parents=True, exist_ok=False)
    for source, relative in sources:
        publish(source, relative)
    score_identity = json.loads((scoring / "score.json").read_text())
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
    if native:
        manifest["workflow"] = run["workflow"]
    else:
        manifest["source_run_evidence_sha256"] = run["run_evidence_sha256"]
    (destination / "archive-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"archive": str(destination.relative_to(REPO)), "files": len(entries)}))


if __name__ == "__main__":
    archive(*sys.argv[1:])
