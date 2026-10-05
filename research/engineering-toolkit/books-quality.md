# Books for testing, review, and behavior-preserving cleanup

Research date: 2026-09-29. This is original synthesis for `tal-skills`, with reading scope separated from availability. [Structured evidence](books-quality.json) records editions, sources, per-practice conditions and counterexamples, and source hashes. Source books, chapter files, and examples are not redistributed.

## Reading scope and priority

| Book | Availability found | Actually read | Repository use |
| --- | --- | --- | --- |
| *Software Engineering at Google*, Winters, Manshreck, Wright, 2020 | [Official complete HTML](https://abseil.io/resources/swe-book), CC BY-NC-ND 4.0 | Complete chapters 9, 10, 12, 14, 15, including examples | First priority for review, test evidence, documentation maintenance, and deletion boundaries |
| *Effective Software Testing*, Maurício Aniche, 2022 | [Publisher catalog](https://www.manning.com/books/effective-software-testing), short chapter previews, author articles; complete text not recovered | Public introductions/headings for chapters 1, 2, 5, 10; four complete author articles listed in the JSON | Requirement-derived test scenarios and coverage interpretation; retain a full-book access gap |
| *Refactoring*, Martin Fowler with Kent Beck, 2nd edition, 2018 | [Official opening chapter](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/bk_Refactoring2-free-chapter_en.pdf); [full web edition requires book registration](https://martinfowler.com/articles/access-refactoring-web-edition.html) | Complete chapter 1, printed pp. 1–44; code-layout spot check on p. 38 | Small verified transformations, bounded cleanup, meaningful changeability |

The Google book was retrieved through official HTML and its official GitHub mirror. The mirror branch observed during research was `e9e24835cb889fe25251cb9ec6d51b79233e358d`; individual hashes are recorded. Downloading a chapter is not counted as reading the entire book. Practice cards apply the source ideas to this repository; their counterexamples and verification steps are original recommendations.

For Aniche, searches included publisher, author, Google Books, catalog and institutional results. An indexed institutional PDF could not be recovered: normal retrieval had a certificate error, and the subsequent public-file check returned 404. The publisher's accessible pages contained introductions and headings, not complete chapters. Full-text access remains unresolved; the findings below cite the author's complete articles directly.

## Practices worth adopting

**Review the promised change with an independent perspective.** Google's review chapter separates correctness, comprehension, and stewardship, while recommending small changes and a limited reviewer set. Apply that to the workflow by giving each reviewer a distinct concern and routing corrections to one implementation owner. Fresh-agent review is our proposed adaptation; the chapter does not establish that an agent is equivalent to a human peer. [Chapter 9](https://abseil.io/resources/swe-book/html/ch09.html)

**Make documentation usable by its actual reader.** Keep an authoritative location, ownership, and updates tied to code changes. A cleanup pass should preserve rationale and required prerequisites, then try the instructions from the intended reader's starting point. Useful introductions and complete references serve different jobs; superficial repetition is insufficient evidence for deletion. [Chapter 10](https://abseil.io/resources/swe-book/html/ch10.html)

**Keep assertions independent of internal structure.** Public behavior is a stronger boundary for maintenance tests than private method names. A test may repeat a small explicit input to remain understandable. The cleanup specialist should distinguish incidental call-order checks from interactions that are themselves contractual, such as emitting one external charge. [Chapter 12](https://abseil.io/resources/swe-book/html/ch12.html)

**Select tests by the risk they can expose.** Environment fidelity, isolation, and cost are separate choices. A proposed integration check must say what is real, what is substituted, how state is prepared, what is observed, and who maintains it. Event-based synchronization and diagnostic artifacts improve a failing test's usefulness. [Chapter 14](https://abseil.io/resources/swe-book/html/ch14.html)

**Treat removal as a migration when consumers are affected.** Find dependencies and move users before retiring a supported path. Sparse usage, old style, and an apparently obsolete name do not establish safe deletion. This is a boundary on the cleanup agent's authority, rather than a reason to start a repository-wide deprecation program. [Chapter 15](https://abseil.io/resources/swe-book/html/ch15.html)

**Derive failures from requirements before inspecting coverage.** Aniche's articles recommend reasoning about behavioral partitions and then using uncovered implementation paths to discover omissions. Familiar null/empty cases supplement that reasoning. The author also qualifies how much formal ceremony simple methods need. Adopt a proportionate process, with a falsifiable oracle instead of a coverage target. [Specification-based testing](https://www.effective-software-testing.com/it-is-not-about-following-a-recipe), [coverage](https://www.effective-software-testing.com/why-do-developers-hate-code-coverage), [proportionate effort](https://www.effective-software-testing.com/do-I-systematically-write-tests-all-the-time)

**Judge cleanup by preserved behavior and reduced difficulty.** Fowler's opening example ties structural changes to upcoming work and repeatedly checks results. It also increases line count while clarifying responsibilities. This supports a cleanup agent that explains an evidenced improvement; it does not support optimizing a deletion count or converting every conditional to a class hierarchy. [Chapter 1](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/bk_Refactoring2-free-chapter_en.pdf)

## Fit with existing skills

The following boundaries come from inspecting the current repository, rather than from the books:

| Existing skill | Existing responsibility | New specialist should add |
| --- | --- | --- |
| `legacy-code-changes` | Characterize reachable behavior and open a minimal testing seam | Invoke this when absent feedback obstructs cleanup; keep its baseline-before-change discipline |
| `pragmatic-programming` | Localize a concrete future change and investigate uncertainty | Supply observed redundancy or confusion; avoid another broad design persona |
| `microservice-testing` | Consumer/provider compatibility and credible test boundaries | Supply adverse histories and discriminating oracles within the selected boundary |
| `learning-experiments` | Test a change to a person's study process | Keep human learning experiments separate from software fault experiments |

`failure-oriented-testing` therefore earns its own scope through **injected failure, controlled execution order, independent oracle, and recovery evidence**. `code-and-docs-cleanup` earns its scope through **evidenced maintenance friction, small preservation checks, and verified reader instructions**. Neither should claim a mandate to redesign all code.

## Proposed evaluation scenarios

These are original applications of the reading to this repository, not scenarios copied from the books:

1. **Commit followed by lost response.** Supply a service whose happy-path tests pass but whose client retries a completed mutation. The testing agent must distinguish pre-effect failure from an unknown outcome, identify the intended invariant, and propose or run a schedule that exposes duplicate effects. A sleep or a line-coverage increase alone does not meet the case.
2. **A misleadingly green mock.** Give a wrapper whose mocked database accepts behavior the real database rejects. The agent must state the fidelity gap and choose an actual dependency check; it must not present a fake-based pass as a transaction guarantee.
3. **Cleanup with intentional duplication.** Include independent business policies that currently look alike and test cases whose explicit inputs make the boundary legible. The cleanup agent must preserve their independence while removing an actually unused local helper with caller evidence.
4. **Shorter but unusable documentation.** A proposed edit deletes a necessary setup prerequisite and a compatibility explanation. The reviewer must retain those facts, consolidate the redundant instruction, and verify the resulting path from a fresh project.
5. **Nontrigger.** A settled, covered identifier rename should follow the ordinary repository process. It should not dispatch the entire specialist roster, add a fault-injection framework, or require a new architectural abstraction.

For these evaluations, record the exact prompt, inputs, candidate instructions, executed checks, and findings. Independent scoring should inspect whether the proposed check can distinguish the faulty behavior. Structural corpus checks and model answers are separate evidence.

## Advice deliberately kept conditional

The Google book's test ratios, review-size heuristics, internal ownership systems, and production chaos examples reflect Google's setting. They are not installer defaults. The public API is a useful test boundary, but an external side effect can make a collaborator interaction observable and essential. Aniche discusses that distinction explicitly. [Mocking and coupling](https://www.effective-software-testing.com/mocking-and-coupling)

A behavior-preserving refactor can still alter latency, allocation, cancellation timing, serialization, or operational signals that consumers depend on. Our workflow must identify those relevant observables before claiming preservation. No source here warrants dropping such checks merely because a change is called cleanup. Runtime-specific guarantees require the current official documentation for that runtime.
