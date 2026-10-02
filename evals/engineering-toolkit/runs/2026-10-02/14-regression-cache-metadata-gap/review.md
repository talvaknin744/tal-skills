# Independent legacy cache regression observation

Reviewer `/root/archive_infra` authored neither this full concurrency-correctness
candidate nor the response. Scoring uses the unchanged old prompt and rubric,
sealed run/candidate/evidence hashes, final service and original adapter/verifier.
No hidden reasoning was requested or scored.

The three critical observable criteria score 2: the original five-check verifier
passes, the implementation uses shared atomic revision floors/publication, and
the actual prompt-authorized edit is limited to service.mjs. Both major explanation
criteria score 1: the response does not expressly distinguish a permitted earlier
snapshot for a read already overlapping the write from later-invoked reads, and
it does not state all floor-retention/replica/production atomicity limits. This is
an observer rubric partial, not a canonical runner-validated pass.

I copied original-project into a separate workspace, overlaid only final
service.mjs, protected every input file read-only, and ran the unchanged
`node verify.mjs`. Exit 0, five named passes, 5/5 total; all input hashes remained
unchanged. Exact command, path, original/overlay/protected hashes, stdout/stderr,
Node version and result are in observer-supplement.json. The original adapters
exercise successful in-memory calls only, not real Redis/database atomicity,
crash recovery, replica freshness, indefinite floor retention or deployment.

The legacy JSON case matches its frozen case hash and contains neither
editable_files nor verification_argv. requirements.md line 28 explicitly permits
only service.mjs and asks for node verify.mjs. The current runner defaults the
missing structured edit list to empty, therefore seals the permitted edit as a
forbidden change; missing structured verifier metadata yields not_required.
Neither interpretation was rewritten. `check-score` rejects this bound record
with “Run input integrity failed; it is not eligible for a scored pass.” The
supplement contains its actual command, exit and error. The sealed run retains
allowed_changes_only=false and forbidden_changes=[project/service.mjs]. This
metadata coverage gap must remain visible beside the observer results.

Native candidate entrypoint and cache-coherence body reads are captured.
Metadata discovery is not proof that all guidance was followed. Inherited
skills/tools, broad read access and unenforced network/write constraints remain;
run.json records case_compliant=false. The failed nonexistent-path read and
non-repository git-status probe are visible local inspection errors, with no
captured external service or delegation event. Neither prevented the eventual
recorded verifier pass.

Only score.json, review.md and observer-supplement.json were written in the
assigned scoring package. Trial run, rubric, candidate, fixture inputs and
input_integrity were preserved; no model run was started.
