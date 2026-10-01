# Sources and attribution

This skill is an independently written engineering workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*. Its instructions, completion criteria, and verification procedure are original. The books remain copyrighted by their respective rights holders; this skill's MIT license applies to the skill files, not the books. No book text or PDF is bundled.

Locators are **one-based PDF pages in the exact linked files**, not printed page numbers. The first-edition file has 280 PDF pages; the second-edition file is a reflowed 754-PDF-page edition. Other copies may have different pagination.

## First edition (2015)

[User-provided first-edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf)

- Chapter 4, “Integration,” “The Shared Database,” PDF pages 61–62: exposing storage couples consumers and distributes change rules outside the owner.
- Chapter 5, “Splitting the Monolith,” “Getting to Grips with the Problem,” PDF pages 102–103: inspect application access and database constraints together.
- “Example: Breaking Foreign Key Relationships,” PDF pages 104–105; “Example: Shared Data” and “Example: Shared Tables,” PDF pages 106–108: ownership, lost constraints, and concepts hidden in shared storage.
- “Transactional Boundaries,” including “Try Again Later,” “Abort the Entire Operation,” “Distributed Transactions,” and “So What to Do?,” PDF pages 109–113: local transactions, partial completion, and reconsidering a boundary around strongly consistent state.
- “The Reporting Database,” “Data Retrieval via Service Calls,” “Data Pumps,” and “Event Data Pump,” PDF pages 113–119: read integration, source-owned extraction, and event-fed reporting.

## Second edition (2021)

[User-provided second-edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf)

- Chapter 2, “How to Model Microservices,” “Common Coupling,” PDF pages 70–75: shared mutable state and the location of business rules.
- Chapter 3, “Splitting the Monolith,” “Data Decomposition Concerns,” “Performance,” and “Data Integrity,” PDF pages 112–116; “Reporting Database,” PDF pages 117–120: foreign keys, remote joins, and reporting interfaces.
- Chapter 6, “Workflow,” “Still ACID, but Lacking Atomicity?,” PDF pages 225–226; distributed transaction sections, PDF pages 227–231: local atomicity versus coordinated change across services.
- “Sagas,” “Saga Failure Modes,” and “Saga rollbacks,” PDF pages 231–238; reordering and mixed recovery, PDF pages 238–240: process state, forward/backward recovery, and compensation as a semantic action.
- “Implementing Sagas,” orchestration/choreography, and choosing a mix, PDF pages 240–247: process visibility and responsibility across teams.
- Chapter 13, “Scaling,” sidebar “CQRS AND EVENT SOURCING,” PDF pages 538–539: distinct read/write models versus reconstructing state from event history, with implementation complexity and information hiding.

## Synthesis boundaries

The first edition supplies ownership and data-splitting foundations; the second develops saga modeling and makes the limits of compensation and whole-process atomicity explicit. The CQRS/event-sourcing distinction follows the second edition's event-history formulation. Neither edition is treated as a mandate to replace local transactions, adopt sagas everywhere, or introduce a new read architecture for every query.

The invariant ledger, concurrency scenarios, durable-handoff checks, bootstrap/repair requirements, and step completion criteria are independently authored engineering applications. They are not presented as book quotations or a reproduced checklist. Database- and broker-specific guarantees must be checked against the actual system when the skill is used.

## Independent result publication

Checked **1 October 2026**.

- **Source/read scope:** Spotify Engineering, [Inside the Archive: The Tech Behind
  Your 2025 Wrapped Highlights](https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped),
  published 12 March 2026. Complete extracted main prose through lessons and
  credits; embedded architecture image not independently decoded.
- **Trigger/problem:** independent results for one entity arrive concurrently;
  replacing a shared serialized collection can lose another worker's update.
- **Mechanism/conditions:** store independent facts at distinct identities and
  write result content before completion metadata when the reader's consistency
  contract preserves valid visibility.
- **Limits/counterexample:** the database is unnamed. Disjoint identities do not
  enforce shared inventory or other cross-result invariants; write order alone
  cannot guarantee visibility across replicated stores.
- **Verification:** the concurrent publication, same-identity collision,
  interruption, reader routing and retention scenarios in
  [result publication](result-publication.md) are independently authored checks.
  Reading the account does not demonstrate those scenarios in this repository.

Current [Bigtable routing documentation](https://docs.cloud.google.com/bigtable/docs/routing),
single/multi-cluster routing, row affinity and single-row transaction sections,
was read as an adoption crosscheck; the page displayed an update of 24 September
2026. Mutations within one row and operation are atomic; cross-row transactions
are unavailable. Replicated multi-cluster routing is eventually consistent, and
row affinity does not guarantee read-your-writes during failover. This identifies
a concrete boundary to verify, without inferring that Spotify used Bigtable.
