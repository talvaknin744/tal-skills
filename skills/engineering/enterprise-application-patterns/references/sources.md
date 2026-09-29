# Sources and attribution

This skill is an independently authored decision workflow informed by Martin Fowler's *Patterns of Enterprise Application Architecture*. The sequence, completion criteria, scenario selection, and evaluation fixtures are original synthesis. The skill's MIT license covers these skill files; it does not license the book. No book text or PDF is bundled.

## Verified source

[User-provided PDF](https://github.com/iamindian/References_Books/blob/master/Patterns%20of%20Enterprise%20Application%20Architecture%20-%20Martin%20Fowler.pdf)

The supplied file contains **559 PDF pages**. Its title page credits Martin Fowler, with contributions from David Rice, Matthew Foemmel, Edward Hieatt, Robert Mee, and Randy Stafford. Its publication page identifies Addison-Wesley/Pearson, copyright **2003**, ISBN **0-321-12742-0**, and **seventeenth printing, July 2011**. These facts are on PDF pages 4–5. The publication page does not explicitly number the edition; a printing date is not a new edition.

All locators below are **one-based PDF pages in that exact file**, not printed page numbers. Body pages in this copy are offset by 25 from their printed numbers.

## Concepts used

- Chapter 2, “Organizing Domain Logic,” PDF pages 50–54: Transaction Script, Domain Model, and Table Module organize behavior differently; the latter works with record sets rather than one object per record. “Making a Choice,” PDF pages 54–55: compare domain complexity, team experience, tooling, and evolution cost; different approaches can coexist in an application.
- Chapter 2, “Service Layer,” PDF pages 55–57: an application-facing boundary can coordinate transactions and security; the discussion explicitly presents differing preferences for how much behavior belongs there.
- Chapter 3, “Mapping to Relational Databases,” “Architectural Patterns,” PDF pages 58–63: gateways encapsulate access, Active Record fits a relatively close object/table correspondence, and Data Mapper separates domain objects from storage at greater implementation cost. “The Behavioral Problem,” PDF pages 63–64: change tracking, identity preservation, and lazy loading address distinct persistence problems.
- Chapter 11, “Unit of Work,” PDF pages 209–214: track changes and coordinate persistence, including write ordering and concurrency responsibilities. “Identity Map,” PDF pages 220–223: preserve object identity within a scope; the discussion of placement on PDF page 222 separates per-session mutable maps from the read-only shared-map exception.
- Chapter 5, “Business and System Transactions,” PDF pages 99–101: multiple short system transactions may implement a business interaction; database atomicity does not by itself provide isolation across that interaction.
- Chapter 16, “Optimistic Offline Lock,” by David Rice, especially “How It Works,” PDF pages 442–445: validate original versions within the committing system transaction, use conditional writes, handle conflicts, and account for relevant read dependencies. An earlier version check does not replace commit-time validation.
- Chapter 16, “Pessimistic Offline Lock,” by David Rice, PDF pages 451–456: application-managed locks can span a business transaction, requiring ownership, acquisition, release, and abandoned-session handling.
- Chapter 6, “Session State,” PDF pages 108–109: distinguish the state of an unfinished interaction from shared committed records and reconstructible caches.

## Synthesis boundaries

The workflow uses these patterns as competing responses to observed application pressures, not as a pattern catalog or a requirement to adopt object modeling, an ORM, or a service layer. Framework-specific mechanics must be checked in the actual application. Modern framework names and the branch references' explicit flush-versus-commit checks, conditional-write scenarios, lock-expiry caution, migration seams, and validation outcomes are engineering applications written for this skill, not a reproduced book checklist. The book's era-specific platform preferences are not treated as current product recommendations.
