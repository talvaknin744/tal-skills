# Additional book access and reading scope

This batch uses official author/editor samples and public text. An accessible
sample, chapter or catalogue is never recorded as a complete book reading.
[book-access.json](book-access.json) records editions, exact scope and access limits.
No book PDF or chapter body is distributed here.

| Book | Actual reading | Boundary |
| --- | --- | --- |
| [Distributed Systems, fourth edition](https://www.distributed-systems.net/index.php/books/ds4/) — van Steen and Tanenbaum | Official catalogue and access form | Version 4.03 is listed; the full personalized ebook requires email and CAPTCHA. No registration was submitted; no book chapters read. |
| [Understanding Distributed Systems, second edition](https://understandingdistributed.systems/sample.pdf) — Vitillo | Complete introduction, printed pages 1–9, plus edition statement | Author sample only; later chapters and full book not read. Its simplifying single-process/single-thread model is not a concurrency guarantee. |
| [Patterns of Distributed Systems](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/Patterns_Distributed_Systems_Sample.pdf) — Joshi | Complete chapter 1, printed pages 3–11 | Official sample; copyright 2024, ISBN 9780138221980. No full book reading or current command validation claim. |
| [Distributed systems for fun and profit](https://book.mixu.net/distsys/) — Takada | Complete chapter 5, [Replication: weak consistency model protocols](https://book.mixu.net/distsys/eventual.html) | Public HTML chapter of a 2013 text; four other chapters were not read in this batch. Historical product defaults are not current configuration advice. |

## A numerical check before adoption

Joshi's chapter 1, printed page 7, treats 1,000 disks each with daily failure
probability 0.001 as guaranteeing at least one daily failure. In a hypothetical
independent Bernoulli model, the expected count is 1; the probability of any
failure is `1 - (1 - 0.001)^1000`, approximately 0.6323. The
[executed arithmetic](coordination-oracle-result.json) keeps those quantities
separate. Independence is an explicit additional assumption, and this is not a
forecast for any actual fleet.

The lesson for skill writing is to recompute a source's worked example and retain
its assumptions before turning it into an instruction. Introductory narratives
can motivate a design investigation; they do not replace current runtime
contracts or evidence from the intended workload.
