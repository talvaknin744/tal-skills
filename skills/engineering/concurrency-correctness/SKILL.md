---
name: concurrency-correctness
description: Fix or review overlapping reads and writes, lost updates, write skew, stale cache fills, or obsolete owners. Use for violated concurrency contracts; failure-oriented-testing covers adversarial schedule design.
license: MIT
---

# Concurrency correctness

A forbidden history is a concrete ordering of events that violates the stated contract.

Use the forbidden history to make the bad execution concrete, then enforce the smallest correction at the boundary that controls it. A review produces findings, a design produces a contract and validation plan, and implementation changes the scoped code and tests. Keep the existing platform unless its guarantees cannot satisfy the requirement.

## 1. State the observable contract

Name the operation and what must remain true after successful completion. Separate the mutation invariant from the reader's freshness requirement: reserving the last item must prevent over-reservation; displaying inventory may permit lag. Two services reading at different times may legitimately see different values.

Example: two reservations race for one item; state that at most one may succeed.

Specify whether the reader needs an acknowledged write, a consistent snapshot, a bounded age, or the latest value under the datastore's documented semantics. Identify permitted intermediate states and behavior when freshness cannot be established. Ask only when an unresolved business rule changes correctness; continue gathering evidence meanwhile.

**Done:** every scoped claim has an observable success or forbidden outcome. A freshness claim identifies the invocation/acknowledgement boundary, permitted overlapping reads, and source/adapter assumptions.

## 2. Reconstruct the history

Trace participating handlers, database statements, transaction boundaries, cache fills and invalidations, replica routing, and relevant message or ownership transitions. Identify the authority for each mutation and copies serving reads. Inspect the actual datastore, client version, isolation level, and deployment topology instead of inferring guarantees from an API name.

Example: A reads revision 7, B commits 8, then A publishes; mark the commit and acknowledgement edges separately.

Write a short actor-by-actor execution: A reads revision 7; B commits revision 8; A later publishes its result. Mark invocation, response, commit, and acknowledgement separately. Correlate operation IDs, entity revisions, and ownership generations. Cross-host wall-clock timestamps alone cannot prove the ordering; distinguish observed edges from a plausible schedule.

**Done:** the history reaches the violated contract, names the authority involved, and identifies any missing evidence needed to confirm it.

## 3. Choose the enforcement boundary

Locate the atomic decision or ordering rule that excludes the bad history. A fresh primary read does not make a later write atomic. A process-local mutex coordinates only its own participants. Name the linearization point for an indivisible operation, or the durable transition and convergence condition for an asynchronous one.

Example: a fresh read followed by an unconditional write still permits a lost update; locate the atomic decision.

Load the branch that matches the history:

- For read-check-write, conflicting edits, or cross-row invariants, read [transactions.md](references/transactions.md).
- For independently accepted updates later combined by a merge, read [merge-invariants.md](references/merge-invariants.md).
- For delayed cache fills, invalidation, expiry, or eviction, read [cache-coherence.md](references/cache-coherence.md).
- For replica lag or a dependent service missing an acknowledged write, read [replica-reads.md](references/replica-reads.md).
- For reordered messages, timeouts, or a previous owner returning, read [delayed-work.md](references/delayed-work.md).

Compare the smallest adequate repair with the current design. State which writers and readers participate, the consistency domain it covers, and its response to conflict or unavailable authority. A guarantee spanning a database and cache needs a protocol across that boundary; atomicity inside one component is insufficient.

**Done:** each claimed guarantee has an enforcing component and operation, plus explicit limits under lag, interruption, or competing participants.

## 4. Force the dangerous interleaving

Use barriers, deferred responses, controlled transaction sessions, or fake clocks to pause at the relevant boundary and release actors in the failing order. For implementation, demonstrate the forbidden outcome before the correction when practical, then run the same schedule against the repair and relevant existing checks. Include the interruption path the repair introduces, such as retry exhaustion or unavailable freshness metadata.

Example: hold A at the cache fill, commit B, then release A and check the forbidden stale publication.

Use real datastore integration checks when correctness depends on isolation, locking, or conditional-write semantics. A fake demonstrates application behavior under modeled guarantees; a stress-test pass does not prove every schedule safe. Keep externally visible effects in local substitutes or an already authorized sandbox.

**Done:** each claimed invariant has a corresponding check and actual result, or is explicitly unverified with a concrete next check.

## 5. Report the supported guarantee

Present the invariant, failing history, enforcement point, changed files or evidence-backed finding, and checks performed. For operational diagnosis, identify useful version/conflict/lag signals and the contract they measure; cache hit rate alone is not a consistency metric. Include material capacity costs when a fix adds authoritative reads or serialization. Attribution and version-sensitive boundaries are in [sources.md](references/sources.md).

Example: report the enforced history, permitted overlap, and any topology or datastore guarantee left unverified.

**Done:** the final report states prevented and permitted executions with evidence. For freshness work, include an ordering/contract row naming the relevant successful acknowledgement, read invocation boundary, guaranteed results and permitted overlap, including whether an overlapping read may return its captured snapshot; distinguish the required contract from any stronger chosen implementation policy. For cache work, return four compact boundary rows: source/replica and adapter; notification/recovery; ordering-metadata lifecycle/durability; actual thread/process/host topology. Each row states actual supplied or exercised evidence, result, unsupported boundary and applicable next check. Fill every row with the result or specific unknown, including excluded scope; distinguish multiple service objects sharing one process from independently running processes. Propose unexecuted next checks within the task's scope.

When validation requires adversarial schedules or fault injection, Hand off to the `failure-oriented-testing` skill.

For independently accepted decisions that merge, return separate validation
controls for one uncontended successful request, competing distinct requests,
duplicate replay, and authority loss/recovery. State each expected caller result
and business state, and whether its check ran or remains proposed.
