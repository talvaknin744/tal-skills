# Sources and scope

Reviewed 2026-09-29. Guidance is original synthesis, not a copied book or example. Discover the target project's versions before applying API details.

- **Architecture Patterns with Python**, Harry Percival and Bob Gregory, first edition (2020): complete author-hosted [Chapter 6](https://www.cosmicpython.com/book/chapter_06_uow) and [Chapter 7](https://www.cosmicpython.com/book/chapter_07_aggregate) were read. The entire book is available but was not read. Its concurrency example depends on the stated PostgreSQL isolation, not merely incrementing a version field. Its framework-era APIs need current documentation.
- **Effective Python**, Brett Slatkin, third edition: [publisher](https://www.informit.com/store/effective-python-125-specific-ways-to-write-better-9780138172183) print publication November 20, 2024; copyright 2025. Complete publisher HTML Items 30, 32, 36, 37, and 38 were read. They support the mutable-argument, default, failure-result, call-interface, and decorator guidance. The full book and its concurrency/robustness chapters were not read. The 80-page sample contains frontmatter, Chapter 5, and index.
- Current async and transaction behavior was checked separately in the official [Python](https://docs.python.org/3/library/asyncio-task.html) and [Psycopg](https://www.psycopg.org/psycopg3/docs/advanced/async.html) documentation. The online Psycopg page identified a development build; repository runtime examples pin and execute released drivers instead.

The skill applies these sources to Python implementation. It does not claim that language conventions establish distributed consistency, crash durability, or external exactly-once effects.
