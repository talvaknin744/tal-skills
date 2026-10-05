# Clock contracts for distributed design

Research date: 2026-10-01. Baseline: published checkpoint `fe3668013d7ae9d59f292c1f4d6101aeb4f44fda`. The companion [JSON record](time-and-clocks.json) contains source identities, exact reading scope, access gaps, six-dimensional findings and executed model results. Only these two research files are proposed; no skill or runtime behavior changed.

Choose a clock by the question it must answer. A duration budget, calendar deadline, event timestamp, ownership lease and causal dependency need different contracts. The two papers add useful architecture mechanisms; current runtime documentation bounds what ordinary clock and cancellation APIs actually provide.

## Primary reading and scope

| Source | Edition and actual scope | Reading limits |
| --- | --- | --- |
| Leslie Lamport, [Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) | CACM 21(7), July 1978, printed pp. 558–565; all substantive article text across PDF pages 1–8: introduction, partial ordering, logical clocks, total ordering, anomalous behavior, physical clocks, conclusion and appendix proof. | Text extraction; figure pixels not inspected and mathematical glyph extraction is imperfect. The proof was read, not independently verified. The neighboring Lisp article on the last page is excluded. |
| James C. Corbett et al., [Spanner: Google’s Globally-Distributed Database](https://research.google.com/archive/spanner-osdi2012.pdf) | OSDI 2012 PDF, 14 pages; substantive text of abstract, §§1–8 and Appendix A, including TrueTime, transactions, safe time, schema changes, evaluation and lease proof. Page 8 was reread after truncated output. | Figure/table captions and extracted labels read; pixels not inspected. Evaluation not reproduced; late bibliography entries not exhaustively read. Google's publication landing page describes a 2013 journal edition, which is not the PDF edition used here. |

The USENIX PDF reader timed out twice. Google's official archive succeeded through one explicitly recorded redirect. Two Lamport screenshot requests failed with a content-type error. These gaps limit visual inspection, not the recorded text reading. Temporary extracted page text was used for reading; no paper or article body is retained in this repository.

This adds new paper reading to the recorded adoptions searched; it does not claim that clock distinctions are new to the repository. [Earlier DDIA research](../../ddia-faults-consistency.md) already explains wall-clock jumps, monotonic drain budgets and stale-owner fencing. Archive metadata containing a Spanner-related title does not count as a body reading.

## Select the contract

| Question | Appropriate clock or authority | Observable contract |
| --- | --- | --- |
| When did the business event occur? | Event timestamp with named producer/authority and precision | Preserve the claimed occurrence time and provenance. Receiving it later does not change when it occurred. |
| When did this handler observe or process it? | Processing timestamp with named clock domain | Measure admission and service delay separately from occurrence and causality. |
| How much local waiting budget remains? | Monotonic elapsed clock | Debit time already spent; wall adjustments must not renew or prematurely exhaust the budget. Specify suspend behavior. |
| Is a persisted calendar deadline or lease expired? | Shared epoch and declared authority, uncertainty and restart policy | Each comparison has a defensible authority. A local elapsed counter cannot become a durable cross-host epoch. |
| Must operation B follow operation A? | Propagated dependency or logical timestamp plus an actual communication history | Preserve causal edges. A smaller logical number alone does not establish an edge or elapsed seconds. |
| Is an absolute instant definitely past? | A clock service with a justified containing interval | Overlap means uncertainty; define whether to wait, reject or use another authority. Ordinary wall-clock APIs do not supply this guarantee. |

These are author synthesis. Event-time finality and watermarks remain under [stream-processing-design](../../../../skills/engineering/stream-processing-design/references/time-and-finality.md); this follow-up does not add a second windowing workflow.

## Six-dimensional paper findings

### Lamport: carry dependencies when causality matters

- **Trigger:** Commands or observations cross independently executing participants.
- **Problem:** Local timestamp order does not establish distributed causality.
- **Mechanism:** Advance logical counters along process order and message edges; a deterministic tie-break extends them into total order.
- **Limits:** Concurrent events may receive an arbitrary order. The example coordination protocol needs live participants and complete message delivery; it does not supply fault-tolerant consensus.
- **Counterexample:** Two unrelated counters can satisfy `1 < 2` without any causal edge.
- **Verification:** Record the communication graph and check every edge; exercise concurrent events without inferring wall time from counters.

This paraphrases the [1978 paper](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). A positive application is carrying an explicit dependency token into a later cross-service request, rather than guessing its prerequisite from a timestamp. Choosing a total order still needs a separate delivery and progress contract.

### Spanner: bounded uncertainty enables coordinated snapshots

- **Trigger:** Transactions and read snapshots need globally meaningful ordering.
- **Problem:** A timestamp alone proves neither visibility order nor replica readiness.
- **Mechanism:** TrueTime supplies a containing interval; timestamp selection and commit wait combine with replication, locking and transaction coordination. Safe time bounds usable replica snapshots.
- **Limits:** The interval guarantee and storage protocols are essential. Historical implementation and latency measurements are not current deployment bounds.
- **Counterexample:** `time.Now()` or `time.time()` is not a TrueTime service.
- **Verification:** Check interval predicates, replica progress and pending transactions independently; inject larger uncertainty without accepting an unsafe boundary.

This paraphrases the [OSDI 2012 paper](https://research.google.com/archive/spanner-osdi2012.pdf). Consistent audit/reporting snapshots are a positive use case. Its quorum lease proof is specific to durable votes, conservative interval boundaries and intersecting quorums; an application TTL does not inherit it.

Current [Cloud Spanner documentation](https://docs.cloud.google.com/spanner/docs/true-time-external-consistency), last updated 2026-09-30, confirms external consistency for default/serializable isolation and MVCC snapshot reads. Repeatable-read semantics have a separate contract. Neither this current page nor the historical paper establishes the behavior of an uninspected database or a customer-operated clock service.

## Current runtime contracts

The official [Go time documentation](https://pkg.go.dev/time) displayed **go1.27.1** (published 2026-09-01). `time.Now()` carries wall and process-local monotonic readings; `Add` preserves them. `After`, `Before`, `Equal`, `Compare` and `Sub` use monotonic readings only when both operands retain them; otherwise they use wall time. Go `==` compares the stored representation, including `Location` and the monotonic reading. Serialization and `AddDate`, `Round`, `Truncate`, `In`, `Local` and `UTC` strip monotonic information; `Round(0)` is an explicit stripping example. Suspend may stop the monotonic clock on some systems. Therefore an in-memory deadline and its serialized reconstruction can behave differently under a wall-clock jump.

[Go context](https://pkg.go.dev/context), the same displayed edition, preserves an earlier parent deadline; `WithTimeout` constructs a deadline from `time.Now().Add(timeout)`. Cancellation signals work to stop but does not wait for completion. The API does not define cross-host wire propagation or synchronized clocks. Downloads and release history corroborated the displayed version; a contradictory “not latest” badge was not used to claim a different edition.

Official [Python time documentation](https://docs.python.org/3/library/time.html) displayed **Python 3.14.8**. `monotonic()` has an undefined origin and a clock shared across processes under the documented platforms; it is not inherently process-only. This does not establish a durable reboot epoch or shared clock across hosts. Ordinary sleep and system suspend are different: Linux `CLOCK_BOOTTIME` explicitly includes suspend. `get_clock_info().adjustable` excludes gradual NTP rate adjustment, so that flag is not a complete synchronization assessment.

In the same displayed Python edition, [event-loop scheduling](https://docs.python.org/3/library/asyncio-eventloop.html) uses the loop's monotonic clock: `call_at()` and `loop.time()` share a reference. [Asyncio timeouts](https://docs.python.org/3/library/asyncio-task.html) use that domain too; `timeout_at()` cannot directly consume an epoch from `time.time()`. Cancellation and cleanup still have distinct boundaries: `wait_for()` waits for cancellation and may exceed its nominal allowance, while `wait()` does not cancel pending tasks on timeout. These docs were read by the delegated read-only runtime researcher, not tested against local runtime installations.

## Executed finite schedules

The following author-created Python arithmetic and predicate models passed all assertions at **2026-10-01 19:30:53 UTC**. They executed no real runtime clock/deadline API, modified no OS clock and simulated no real Spanner transaction, lease store or fencing resource. They demonstrate consequences of the stated assumptions, not measured clock guarantees.

Start at wall `1000`, monotonic `100`, budget `10`; deadlines are respectively `1010` and `110`. Remaining budget is `deadline - now`.

| Schedule | Wall now / remaining | Monotonic now / remaining | Oracle |
| --- | --- | --- | --- |
| Four elapsed seconds, no jump | `1004 / 6` | `104 / 6` | Neither expired. |
| Four elapsed seconds, wall jumps backward 30 | `974 / 36` | `104 / 6` | Naïve wall deadline gained 30 seconds. |
| Ten elapsed seconds, same backward jump | `980 / 30` | `110 / 0` | Wall check says live; elapsed budget is exhausted. |
| Four elapsed seconds, wall jumps forward 30 | `1034 / -24` | `104 / 6` | Wall check expires six elapsed seconds early. |

A lease model uses authority expiry `1010` and authority now `1011`; an old owner's wall clock reads `981`, so its local comparison still says valid. With old generation `7` and resource highest accepted generation `8`, the protected write rejects `7`. This models the existing [delayed-work boundary](../../../../skills/engineering/concurrency-correctness/references/delayed-work.md): fencing protects this write only after generation `8` has reached that resource. It does not automatically revoke an owner at clock expiry or reject duplicates within a generation.

For an uncertainty interval `[earliest, latest]` and instant `1010`, `[1008,1009]` is definitely before, `[1009,1011]` is undecided, and `[1011,1013]` is definitely after. The modeled predicates are strictly `latest < instant` and `earliest > instant`; equality needs an explicit policy. A commit-wait model with stamp `1004` cannot finish at `[1003,1007]` but can at `[1005,1009]`. Interval containment is assumed. These are predicate checks, not transaction or lease implementations.

The causal model records `A_send=1`, unrelated `B_event=2`, then `B_receive=max(2,1)+1=3`. Only the recorded send-to-receive communication supplies the causal edge; `1 < 2` does not. No elapsed duration is inferred.

## Placement and remaining verification

Prefer conditional reference enrichment under existing owners:

| Existing owner | Proposed addition | Trigger stays bounded |
| --- | --- | --- |
| [concurrency-correctness](../../../../skills/engineering/concurrency-correctness/SKILL.md), delayed-work and replica-reads | Name the clock authority, dependency meaning and uncertainty boundary; distinguish the historical TrueTime proof from generic leases. | Delayed messages, stale ownership, replica visibility or order-sensitive writes. |
| [graceful-draining durable handoff](../../../../skills/engineering/graceful-draining/references/durable-handoff.md) | Preserve the current local-monotonic versus persisted-authority distinction; add suspend/restart and clock-domain verification. | Shutdown budget and durable handoff. |
| [microservice-operations failure handling](../../../../skills/engineering/microservice-operations/references/failure-handling.md) and retry coordination | Show how serialization/clock-domain conversion can change a deadline, without resetting the logical operation budget. | End-to-end deadlines, retry allocation and cancellation cleanup. |
| [distributed-system-patterns](../../../../skills/engineering/distributed-system-patterns/SKILL.md) | Link the causal-token and consistent-snapshot architecture examples only when an ordering/clock decision is required. | Selecting an actual distributed mechanism and its assumptions. |

No new skill is recommended from this bounded reading. A possible distinct future trigger is **design or audit a cross-host clock authority and its uncertainty/causality contract across restarts**. It would need concrete underserved work and discriminating cases; ordinary timeouts, draining, lease fencing and event-time windows already have owners.

Before adopting runtime guidance, run target-version checks for Go monotonic preservation/stripping and Python event-loop deadline domains; test cancellation completion and chosen suspend behavior separately. A distributed design additionally needs an authority/uncertainty argument, restart and pause schedules, the actual protected mutation boundary, and replica/snapshot visibility checks. None of those integration checks ran here. Local fake clocks cannot prove a production clock bound, and a read paper proof cannot substitute for inspecting an implementation's assumptions.
