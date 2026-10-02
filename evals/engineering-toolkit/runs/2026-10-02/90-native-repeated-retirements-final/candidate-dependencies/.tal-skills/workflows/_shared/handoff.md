# Workflow coordination and handoff

Apply this guide in the main session. Read the
[specialist execution contract](../../agents/CONTRACT.md) before assigning work.
The chosen workflow supplies the task sequence; the contract supplies shared
ownership and evidence rules. Available roles are conditional participants.

## Start with a small assignment

Inspect the request, repository instructions, current working tree, relevant
runtime/configuration, and available checks. State the requested mode and an
observable outcome. For a simple local change, use one owner and only relevant
review; expand the team when a separate question can improve the result while
useful local work continues.

Record each assignment in the existing task record or a concise handoff:

```text
Outcome and mode:
Candidate/base and current work:
Required context and evidence locations:
Allowed write paths and implementation owner:
Acceptance conditions and relevant checks:
Open decisions, in-flight actions, and stop conditions:
Return artifact and next recipient:
```

The main session may be the implementation owner. Native specialist dispatch
uses the named role with this assignment. Keep configured models and host
authorization inherited. If native dispatch is unavailable, continue authorized
work with available capabilities and label the fallback and unmet independence
requirement; installed files or a generic child reading role text do not prove
native execution.

## Review the candidate that will be accepted

1. Have the owner finish the bounded change and relevant checks. Record a commit
   or digest including uncommitted relevant files, and freeze those paths.
2. Give a separate reviewer the contract, candidate identity, diff, and evidence,
   with a focused question. Reviewers return findings with locators and
   consequences; they leave the owner's files unchanged.
3. Return accepted findings to the same owner. Resolve material disagreements
   against the contract or an additional observation, retaining unresolved ones.
4. After corrections, record the new candidate and rerun affected checks. Obtain
   focused review of material corrections. Accept only the candidate to which
   the retained evidence applies.

Where independent execution is unavailable, report the review gap; a self-check
remains useful but does not become independent review. A no-change review ends
with findings and evidence, without inventing an implementation stage.

## Resume from actual state

After interruption or a missing specialist response, inspect its status, diff,
artifacts, pending command, and tool outcomes. Reuse completed work whose evidence
still matches the candidate, and resume only the unresolved portion. Preserve
the original acceptance conditions and ownership map. Reconcile a possibly
committed external action through its existing operation identity before retry;
a new agent/task identifier is not a new business operation.

## Stop with an accountable result

Finish when the requested outcome and relevant acceptance checks are satisfied,
or return a partial result naming the concrete blocker and completed evidence.
Pause only the dependent action for missing authorization, incompatible
ownership, an unresolved business rule, unsafe external state, or a failed stop
condition. Continue useful independent work. Keep proposed checks, static
inspection, modeled faults, real-runtime tests, and native-host execution distinct.
Report remaining limits without expanding a bounded task into an unrelated
redesign or a new coordination service.
