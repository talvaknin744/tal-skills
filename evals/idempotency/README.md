# Idempotency evaluation cases

These are original, deliberately small project fixtures for assessing the
idempotency skill. Some contain defects. They are review and edit inputs, not
reusable application implementations. The automated test validates only this
corpus's structure and isolation; it does not run or certify agent behavior.

Use the repository's [evaluation procedure](../README.md). Supply only the
selected prompt, that case's fixture directory, and the candidate skill. Keep
`cases.json`, this guide, and scoring criteria outside the agent's workspace.
Every case runs in its own fresh copy of the fixture. `commands` declares
whether local commands are available; it does not grant permission to mutate
files in a read-only case. None of these cases requires external services.

The cases cover identity and authorization, concurrent ownership, uncertain
external outcomes, outbox recovery, retention and canonicalization, natural
business invariants, a bounded implementation, and a nontrigger read request.
Score the observed answer and tool trace. An unexecuted recommendation or test
plan is not evidence that concurrent execution or crash recovery worked.

For `bounded-webhook-edit`, preserve the agent's diff and any actual command
output in the run record. Evaluate whether the change uses the supplied
provider contract and stays within scope; do not award correctness for merely
mentioning a test. For the other activated cases, an unchanged workspace is a
required observable property.

Run `node --test tests/idempotency/evals.test.mjs` for corpus integrity checks.
Record actual behavioral runs separately, with candidate revision and model;
there are no prefilled behavioral pass results in this corpus.
