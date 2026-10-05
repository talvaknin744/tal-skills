# Complete-text access audit: distributed patterns and software design

Checked 2026-09-29 after the request to search beyond book descriptions. This audit searched author and publisher sites, book platforms, and university course links. It distinguishes complete books from samples and records what was actually read. No complete primary-source or institution-hosted copy of these three books was verified. Search results also advertised third-party copies; their edition, completeness, and provenance were not established, so they are not evidence for new skill instructions.

## Access and edition

| Book | Verified public reading material | Complete-book route and remaining limit |
|---|---|---|
| Unmesh Joshi, *Patterns of Distributed Systems*, first edition, published November 2023, copyright 2024 | The [author's catalog](https://martinfowler.com/articles/patterns-of-distributed-systems/) explicitly contains short summaries. Its 30 pattern names do not make it the complete book. The [publisher's sample](https://www.informit.com/content/images/9780138221980/samplepages/9780138221980_Sample.pdf) has 74 PDF pages: front matter, Chapter 1, Chapter 2 through printed page 33, and the index. | [Publisher PDF/EPUB](https://www.informit.com/store/patterns-of-distributed-systems-9780138222024) or [O'Reilly online edition](https://www.oreilly.com/library/view/patterns-of-distributed/9780138222246/), using an existing subscription or institutional access. Public O'Reilly chapter pages are previews. The 464-page book includes fuller narrative, implementation explanations, examples, and diagrams that were not read here. |
| Brian Goetz et al., *Java Concurrency in Practice*, first edition, 2006 | The [author-maintained site](https://jcip.net/) provides examples, errata, and a [22-page sample](https://jcip.net/jcip-sample.pdf): complete Chapter 6, printed pages 113–134. It does not provide complete Chapters 7 or 12. | [Publisher PDF/EPUB](https://www.informit.com/store/java-concurrency-in-practice-9780321349606) or [O'Reilly online edition](https://www.oreilly.com/library/view/java-concurrency-in/0321349601/). Both identify the same 2006 book. Full cancellation, shutdown, and concurrent-testing chapters remain unread. |
| John Ousterhout, *A Philosophy of Software Design*, second edition, July 2021 | The [author's page](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) links a [20-page extract](https://web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf). It contains updated Chapter 6, the Clean Code comparisons, and Chapter 21. Its title/copyright pages identify second edition v2.0. | The author links paperback/electronic purchase options. The public extract is specifically for readers updating from the first edition, not the whole second edition. A [public-library catalog](https://sjpl.bibliocommons.com/v2/record/S156C6781582) also identifies a 2021 second-edition print copy; no borrowing or account action was performed. |

The institutional search produced course references rather than a verified complete institutional copy. [Rice's 2012 course](https://www.cs.rice.edu/~javaplt/402/12-spring/index.shtml) links to an external `deelin.com` PDF; retrieval timed out. A [Kyiv Polytechnic syllabus](https://ipze.kpi.ua/wp-content/uploads/2024/01/%D0%9F%D0%92-5-%D1%81%D0%B5%D0%BC-%D0%90%D1%81%D0%B8%D0%BD%D1%85%D1%80%D0%BE%D0%BD%D0%BD%D0%B5-%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F-%D0%B7%D0%B0%D0%BE%D1%87%D0%BD%D0%B0-%D1%84%D0%BE%D1%80%D0%BC%D0%B0-v_01.pdf) links to `leon-wtf.github.io/doc/java-concurrency-in-practice.pdf`; that returned HTTP 404. A university link would establish a reading recommendation, not publisher authentication of an off-site copy.

## Reading scope and useful findings

### Patterns of Distributed Systems

Read the current public summaries of [Generation Clock](https://martinfowler.com/articles/patterns-of-distributed-systems/generation-clock.html), [Lease](https://martinfowler.com/articles/patterns-of-distributed-systems/lease.html), [Versioned Value](https://martinfowler.com/articles/patterns-of-distributed-systems/versioned-value.html), [Replicated Log](https://martinfowler.com/articles/patterns-of-distributed-systems/replicated-log.html), [High-Water Mark](https://martinfowler.com/articles/patterns-of-distributed-systems/high-watermark.html), [Singular Update Queue](https://martinfowler.com/articles/patterns-of-distributed-systems/singular-update-queue.html), and [Request Waiting List](https://martinfowler.com/articles/patterns-of-distributed-systems/request-waiting-list.html). The sample's page coverage was inspected; its complete prose was not read.

The summaries distinguish ownership generations from time-limited leases, agreed requests from their execution order, appended entries from the committed prefix, and pending requests from completed requests. Generation Clock specifically addresses a paused old leader resuming after replacement: recipients must reject its obsolete generation. Versioned Value supports historical reads; version storage alone does not establish an application's recency requirement.

**Application inference:** a drain protocol needs an admission cutoff and explicit accounting for accepted work until its completion condition holds. This is a proposed use of the patterns, not a drain protocol read in the book. Keep the book as further reading; cite individual summaries only for the limited claims they support.

### Java Concurrency in Practice

Read all of the author's Chapter 6 sample, including task boundaries, execution policies, executor lifecycle, result retrieval, completion services, and time budgets. The important distinction is between requesting shutdown and reaching termination. Already submitted tasks include queued work; waiting for a result to time out is separate from asking the computation to cancel. These are process-local concepts, not evidence of durable pod-to-pod recovery. [Chapter 6](https://jcip.net/jcip-sample.pdf)

The [JDK 25 `ExecutorService` contract](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ExecutorService.html) confirms that `shutdown()` does not wait, `awaitTermination()` can time out, and `shutdownNow()` makes only a best-effort attempt to stop running tasks. Check the project's actual JDK before implementing. The unread Chapters 7 and 12 remain further reading; the sample cannot justify a claim of full-book concurrency coverage.

### A Philosophy of Software Design

The web PDF parser rejected the 13.9 MB author extract. Direct retrieval succeeded; it has 20 pages and no extractable text, so the pages were rendered and OCR-read. Coverage: title/copyright; all of Chapter 6 (printed pages 39–49); sections 9.8–9.9 (76); section 12.6 with preceding context (99–100); all of Chapter 21 (171–174). Code OCR is imperfect and was not reused. [Author extract](https://web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf)

The relevant design advice is to separate reusable mechanisms from caller-specific policy while keeping present needs easy to express; avoid speculative generality. Chapter 21 emphasizes making important invariants visible. **Application inference:** a shared worker-lifecycle component should expose admission, accepted-work accounting, and completion semantics clearly, while scheduler adapters handle platform-specific termination behavior. This is design vocabulary for an existing architecture skill, not a new recovery guarantee or grounds for a separate book-summary skill.

## Reproducibility and decision

Downloaded reading files stayed outside the repository. SHA-256:

- JCIP author sample: `306bdc78d0cf1dc9839e11958448aa29993e92ac74556b1233399934cfca5b1d`.
- Ousterhout author extract: `ccb9cc3de8c75957e0db390ba79033ad2253155e765a9b8396a709e14d604179`.

Keep these books in the shortlist with the explicit coverage above. Do not relabel excerpts as complete reading or add book-derived implementation rules without the surrounding chapter context and current platform contracts. The supplied DDIA draft and official SRE reading records remain the stronger direct evidence for the user's two reported failures.
