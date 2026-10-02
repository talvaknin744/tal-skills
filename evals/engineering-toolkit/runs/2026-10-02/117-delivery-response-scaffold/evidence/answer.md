## Broker contract

**Supplied evidence:** `MessageGroupId` is a fairness group, but the client currently chooses it. A1 and A2 therefore appear as `g1` and `g2` even though both belong to authenticated customer Alpha. Set the group from the server’s recorded `authenticated_customer` for each job, and use that same trusted identity for admission accounting. A group ID does not authorize a data read.

Fair detection considers approximate in-flight share and recent processing-time share; its thresholds and measurement windows are unspecified. Standard groups provide neither FIFO order nor a per-tenant consumption-rate limit. Fair delivery changes future receive opportunities. It does not reserve a worker or dependency permit, stop an operation, or guarantee a completion deadline. Delivery may duplicate during visibility, so attempts must be reconciled by job identity. These conclusions use only the supplied contract in [queue.md](../final-project/queue.md).

## Allocation

**Supplied B1 outcome:** At time 1, B1 has a worker but all six dependency permits remain held by A1 and A2 until time 8. B1 waits seven seconds for a permit, finishes at time 9, and misses its time-3 deadline by **six seconds**. Low broker dwell does not change that result.

The draft’s simultaneous permit guarantees require **6 + 2 = 8 permits from a physical pool of 6**. Its two received Alpha jobs cost three permits each, so counting jobs equally hides the exhausted pool. A four-*executing*-worker cap also misses jobs holding slots while blocked, retry-waiting, or settling. Extending visibility or releasing a permit only in local bookkeeping cannot free any of the six operations before time 8.

**Proposed review budget for this trace:** Put one shared gate ahead of worker ownership and dependency dispatch. Charge each Alpha job **one worker slot and an atomic bundle of three dependency permits**; charge B1 **one slot and one permit**. Across the entire four-slot, six-permit dependency-sharing scope, allow one active Alpha job, reserve two slots and two permits for the pooled quiet class, and leave the fourth slot and sixth permit for eligible one-permit work or idle. Do not lend the quiet reserve to an eight-second Alpha operation. This gives feasible simultaneous reserved shares of **1 + 2 ≤ 4 slots** and **3 + 2 ≤ 6 permits**. Quiet customers would arbitrate for their pooled share by trusted customer identity; this is not a two-permit guarantee to every possible customer. No production SLO-safe limit or general quiet-class classifier has been established, so these are provisional trace bounds.

Under that proposed schedule, A1 starts at time 0, A2 waits for later admission, and B1—*if delivered at time 1 as supplied*—can use its reserved slot and permit and finish at time 2. A2 can start after actual release and capacity-gated redelivery; its exact start and finish are not guaranteed by the supplied broker contract.

## Residency and waiting

**Proposed provisional receipt bounds:** Across the same shared scope, allow at most four outstanding receipts, including executing, blocked, retry-waiting, settling, and broker-deferred receipts; at most two may belong to Alpha. Reserve two receipt positions for quiet work. Each receiver holds at most one unhanded receipt, with zero bulk prefetch and no unbounded local pending queue. Use a review bound of 1 MiB retained payload per receipt and 4 MiB in aggregate, with local handoff or deferral decided within one second. These are engineering bounds to validate against accepted payload sizes and the actual receiver topology, not measured service settings.

A2 must not take a worker merely to wait for its three permits. If already received, keep its accepted message recoverable through a bounded broker deferral; count its receipt until visibility expiry or reconciliation. The existing accepted broker backlog, payload range, oldest age, and intake rate are unknown. Before adopting a finite intake cap, verify those quantities and reject *new, unaccepted* work before enqueue when the cap is full. Do not discard an already accepted job to satisfy a local bound.

## Expiry and recovery

**Proposed transition:** Expired useful deadlines stop new dispatch, but an accepted job remains unacknowledged and recoverable until its business-approved outcome is known. For review, bound a local deferral to one second, a visibility lease to at most eight seconds from receipt, immediate retry to zero, and dispatch attempts to at most two per job per minute; after that, pause for capacity-gated recovery rather than repeatedly redelivering into saturation. These timings require verification against actual visibility controls and workload duration. A visibility extension postpones redelivery only.

The broker message and job identity are the proposed recovery authority. Verify retention, payload and progress durability, effect reconciliation, visibility behavior, and the terminal disposition before claiming eventual completion for every accepted job. A recovery owner should resume paused or redelivered work only after matching its authenticated identity, checking for an active original attempt, checking remaining useful lifetime, and atomically acquiring the required real resources. In this finite trace, A2 can make eventual progress after A1 releases its three permits, conditional on redelivery and settlement.

## Actual release

The operation owner retains each permit from acquisition until the operation **actually terminates**; the job retains its slot through blocking, retry-wait, and settlement. A timeout, cancellation signal, or visibility change is not release proof. Completion and cleanup must be observed before returning permits or admitting a duplicate attempt. An original and redelivered copy of the same job must be reconciled so they cannot each launch three operations.

**Supplied peak:** six actual permits on `[0,8)`, then B1’s one permit on `[8,9)`; the peak is six. At time 1, “locally releasing” Alpha’s permits would create false accounting while all six remain physically held. The corrected gate keeps actual original-plus-redelivery use within six, with the two-permit quiet reserve intact only if duplicate attempts and other dependency consumers obey the same shared gate. Those fleet and bypass conditions remain unverified.

## Interruption cost

**Rejected for this fixture:** There is no authorized way to stop the eight-second Alpha operations. Signaling them at time 1 has no demonstrated reclaim time and cannot help B1. The corrected trace defers A2 before dispatch, so it need not throw away A2’s work.

**Counterfactual only:** If interruption were later provided, recoverable progress, effects already committed, cleanup time, and replay cost would need measurement. At time 1 each running Alpha job has already consumed three permit-seconds; whether any of that work can be reused is unknown. A replay without a usable checkpoint could repeat its operations. No cancellation acknowledgement can be counted as freed capacity.

## Fair useful outcomes

For the supplied observation window **`[0,9)`**, dependency occupancy, measured as held permits × overlap with the window, is A1 **24 permit-seconds**, A2 **24**, and B1 **1**: **49 permit-seconds total**. B1 holds a worker on `[1,9)`, or eight slot-seconds; A1 and A2 each hold a slot for at least `[0,8)`, giving at least **24 total slot-seconds**. Their later settlement times and useful Alpha finish times are unspecified.

The quiet group receives B1 at time 1, yet B1 cannot start its dependency work until time 8 and finishes late at time 9. In the proposed trace schedule, A1 uses three permits on `[0,8)`, B1 uses one on `[1,2)`, and A2 is deferred. B1’s proposed time-2 finish depends on the stipulated time-1 delivery and one-second service, and says nothing about a general delivery or deadline guarantee. Observe per-customer receive time, useful start and finish, deadline result, held worker and permit intervals, and eventual Alpha completion together.

## Verification matrix

| Schedule and transition | Expected ownership, resource, and useful-work oracle | Status |
| --- | --- | --- |
| Prefetch before dispatch | No bulk prefetch; all outstanding receipts count toward four, with two quiet positions available. | Proposed; receiver behavior unverified. |
| A2 deferred at time 0 | A2 owns no worker or dependency permit; its accepted receipt remains tracked until broker disposition. | Proposed; redelivery timing unverified. |
| B1 blocked in the draft | B1 holds one slot on `[1,9)` and no permit until time 8; finishes at 9. | Supplied trace. |
| Retry-waiting job | Retained slot and receipt remain charged; no new operation starts without its full permit cost. | Proposed; unexecuted. |
| Settling job | Slot and permits remain charged until actual operation termination and cleanup. | Proposed; settlement duration unknown. |
| Protected arrival just after borrowing | An eight-second Alpha job cannot borrow the quiet reserve; B1 finds one slot and permit if delivered as stipulated. | Proposed; unexecuted. |
| Changed or parallel job cost | Gate charges actual simultaneous leaf permits, rechecks cost before dispatch, and never exceeds six actual permits. | Proposed; other job costs unknown. |
| Alpha splits `g1` and `g2` | Both jobs map to one trusted Alpha identity for grouping and accounting. | Client fragmentation supplied; correction proposed. |
| Cancellation signal before stop | Original operation retains its permit; no duplicate launch or false release. | No stop guarantee supplied; reconciliation unexecuted. |
| Visibility extension, expiry, and redelivery | Extension changes delivery timing only; original and duplicate share job-level recovery accounting, with at most six actual permits. | Duplicate possibility supplied; lease and duplicate handling unverified. |
| Capacity recovery | Once release is proved, resume eligible accepted work gradually through the shared gate; record useful completion and backlog age. | Proposed; retention, redelivery, and recovery timing unverified. |

**Coverage audit:** The supplied trace establishes the B1 miss and impossible draft guarantee. Production limits, payload and backlog bounds, broker lease behavior, duplicate/effect reconciliation, other dependency consumers, and Alpha recovery remain unresolved checks. No files were changed, and no live service call was made.
