# Sources and applicability

These are independently written decision procedures informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*, O'Reilly, first edition (2015) and second edition (2021). The books' prose, diagrams, and examples are not included or relicensed. The probes and completion criteria are this skill's operational synthesis, not a checklist attributed to Newman.

## Source copies inspected

- [First edition, supplied PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf): 280 PDF pages.
- [Second edition, supplied PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf): 754 PDF pages, reflowed from an ebook.

Locators below are one-based **PDF pages in those copies**, not interchangeable print page numbers. Verified 2026-09-29. Use chapter and section titles with other formats.

| Concept informing the workflow | First edition | Second edition |
|---|---|---|
| Cohesion and modular boundaries | Ch. 3, “What Makes a Good Service?”, “Modules and Services”, PDF 50–53 | Ch. 1, “The Modular Monolith”, PDF 34–35; Ch. 2, “Mapping Aggregates and Bounded Contexts to Microservices”, PDF 84–85 |
| Capability and model ownership | Ch. 3, “The Bounded Context”, “Business Capabilities”, PDF 51–54 | Ch. 2, “Aggregate”, “Shared models”, PDF 79–84 |
| Coupling and technical seams | Ch. 3, “Communication in Terms of Business Concepts”, “The Technical Boundary”, PDF 56–57 | Ch. 2, “Types of Coupling”, PDF 62–77 |
| Premature decomposition | Ch. 3, “Premature Decomposition”, PDF 53–54 | Ch. 3, “The Dangers of Premature Decomposition”, PDF 104 |
| Ownership over time | Ch. 10, “Bounded Contexts and Team Structures”, “The Orphaned Service?”, PDF 218–219 | Ch. 15, “The Orphaned Service”, PDF 634–635 |

The second edition develops aggregate ownership and coupling categories more explicitly. Treat bounded contexts as modeling guidance in both editions; avoid turning either into a required service count. Verify changing platform behavior against the project's installed versions and current primary documentation when it affects a decision.
