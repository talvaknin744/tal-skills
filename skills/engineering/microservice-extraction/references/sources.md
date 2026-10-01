# Sources and applicability

This skill is an independently authored migration workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*, O'Reilly, first edition (2015) and second edition (2021). Its ownership ledger, comparison gates, and failure-window checks are operational synthesis, not a verbatim procedure from either book. No book text, illustrations, or example code is bundled or relicensed.

## Copies and locators

- [First edition, supplied PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf): 280 PDF pages.
- [Second edition, supplied PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf): 754 PDF pages, a reflowed ebook copy.

All numeric locators below are one-based **PDF pages**, verified 2026-09-29. Use section titles rather than assuming these numbers match a printed edition.

| Basis | First edition | Second edition |
|---|---|---|
| Incremental scope and benefit | Ch. 5, “It's All About Seams”, “The Reasons to Split the Monolith”, PDF 99–102 | Ch. 3, “Have a Goal”, “Incremental Migration”, “What to Split First?”, PDF 101–106 |
| Sequence code and data | Ch. 5, “Staging the Break”, PDF 109 | Ch. 3, “Decomposition by Layer”, “Code First”, “Data First”, PDF 107–110 |
| Route old and new behavior | Ch. 4, “The Strangler Pattern”, PDF 97–98 | Ch. 3, “Strangler Fig Pattern”, “Parallel Run”, “Feature Toggle”, PDF 111–112 |
| Lost data guarantees | Ch. 5, “Transactional Boundaries”, PDF 109–113 | Ch. 3, “Data Decomposition Concerns”, PDF 112–117 |
| Reporting remains a contract | Ch. 5, “Reporting”, PDF 113–120 | Ch. 3, “Reporting Database”, PDF 117–120 |

## Edition difference that changes decisions

The first edition recommends separating schemas while keeping application code together before separating the services. The second explicitly considers code-first and data-first extraction and weighs their different benefits and risks. This skill therefore requires a reasoned sequence and a viable plan for both layers, rather than imposing data-first for every migration.

Migration tooling, replication guarantees, and supported schema operations depend on the actual platform. Consult current primary documentation when those details determine whether a proposed handoff is safe; historical product examples in the books are not an implementation contract.

## Executable boundary rehearsal

Sentry, Mark Story, [Removing risk from our multi-region design with simulations](https://blog.sentry.io/removing-risk-from-our-multiregion-design-with-simulations/),
2024-05-16. Complete substantive prose and examples read 2026-10-01, including
runtime boundary metadata, incremental enforcement, tests in both modes, CI cost,
confusing stack traces, and missed branches found in staging. Diagrams were not
independently measured; the reported company outcome was not reproduced.

The reference adapts the idea into a project-specific rehearsal with separate
physical validation. It does not require Django monkeypatching or treat a passing
simulation as proof of a network or database split. Current [Django 5.2 database
documentation](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/#cross-database-relations)
confirms that foreign keys and many-to-many relationships cannot span databases;
replacing one still requires an explicit application contract. This framework
crosscheck applies only to the selected Django version, not every datastore.
