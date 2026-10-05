---
schema_version: 1
name: tal-backend-delivery
description: Deliver a bounded backend change with a language owner, relevant correctness specialists, and independent review of the verified candidate.
agents:
  - tal-boundaries
  - tal-consistency
  - tal-durability
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-python
  - tal-typescript
skills:
  - architecture
disable-model-invocation: true
---

# Backend delivery

Use for an authorized backend feature or repair in Python, TypeScript, or Go.
For design or review requests, complete that mode without inventing code changes.
The main session coordinates; first read the
[handoff guide](../_shared/handoff.md).

## 1. Define the delivery slice

Inspect the entrypoint, relevant domain and persistence interfaces, runtime and
dependency configuration, tests, and current diff. Record the requested behavior,
trusted caller context, inputs, observable effects, failure outcomes, and allowed
write paths. Carry the user's existing constraints and authorization forward.
Resolve a missing business rule only when it changes the implementation; continue
independent inspection while it is unresolved.

When the request requires choosing or reviewing a system design or migration
strategy, the coordinator loads `architecture` to resolve that decision. Routine
features and repairs proceed within the existing design without loading its
body. For design or review only, return the decision or findings and relevant
validation needs; enter the implementation sequence only when authorized.

**Ready:** the owner can identify a successful operation, a rejected operation,
and each material effect whose outcome must remain observable.

## 2. Assign the smallest useful team

Choose one implementation owner: the main session or the matching `tal-python`,
`tal-typescript`, or `tal-go` role. Keep coupled code, schema, and test changes
with that owner unless a separate artifact has an explicit nonoverlapping owner.
Dispatch only applicable independent questions:

| Condition in this change | Specialist question |
| --- | --- |
| Service responsibility or authoritative data ownership changes | `tal-boundaries`: does the proposed seam preserve the affected invariants and intended independence? |
| Duplicate attempts or uncertain effects can change the result | `tal-idempotency`: what identifies one operation and establishes its recoverable outcome? |
| Concurrent actors can violate an invariant or freshness rule | `tal-consistency`: which history is forbidden and where is it excluded? |
| Work must continue after cancellation, shutdown, or worker loss | `tal-durability`: what accepted input, progress, and effect evidence survives? |
| Existing tests cannot distinguish the dangerous outcome | `tal-failure-testing`: which bounded schedule or fault exposes it? |

Pass each specialist the relevant contract, evidence locations, candidate/base,
allowed paths, and return condition. Investigators and reviewers return findings
to the owner. A one-file correction uses one owner and a focused independent
review; it does not activate the rest of the table.

**Ready:** every edited path has one owner and each dispatch answers a distinct
question needed for this delivery.

## 3. Implement and verify the contract

Have the owner implement the smallest complete behavior using its declared
language skill and the resolved specialist findings. Preserve project interfaces
unless the change requires their evolution. Select checks from the contract:
normal and rejected input plus the relevant duplicate, conflicting payload,
concurrent, cancellation, or uncertain-result path. Exercise the actual adapter
when the claim depends on its guarantees, or retain that claim as unverified.

Keep the diff and command outcomes together. A started test or successful static
check does not establish an unexecuted runtime result.

**Ready:** the owner supplies a stable candidate identity, complete changed-path
list, actual check results, and explicit remaining limits.

## 4. Review, correct, and accept

Assign a separate reviewer to the stable candidate: a fresh matching language
specialist for a local change, or the relevant correctness specialist for its
dominant risk. Give the reviewer the task contract, diff, and evidence. Return
actionable findings to the implementation owner; follow the shared review loop
for corrections, a new candidate identity, affected checks, and focused re-review.

Accept when the scoped behavior is implemented, material findings are resolved,
and required checks apply to the final candidate. A missing runtime, business
decision, or independent reviewer leaves that acceptance condition explicitly
unmet; report useful completed work and the next concrete step. Stop dependent
external actions when their authorization or outcome is unresolved.

Return the resulting behavior, changed files, final candidate, observed checks,
review outcome, and supported guarantee with its remaining limits.

## Native invocation

Codex: `$tal-backend-delivery Add duplicate-safe reservation handling to the
existing Python service; preserve its current API and verify the changed path.`

Claude: `/tal-backend-delivery Add duplicate-safe reservation handling to the
existing Python service; preserve its current API and verify the changed path.`
