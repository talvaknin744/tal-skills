# Sources and attribution

This skill is an independently written engineering workflow informed by Sam Newman's *Building Microservices: Designing Fine-Grained Systems*. Its prose, ordered steps, completion criteria, examples, and verification procedure are original. The books remain copyrighted by their respective rights holders; this skill's MIT license applies to the skill files, not the books. No book text or PDF is bundled.

Locators below are **one-based PDF pages in the exact linked files**, not printed page numbers. The first-edition file has 280 PDF pages; the second-edition file is a reflowed 754-PDF-page edition. Pagination in other copies will differ.

## First edition (2015)

[User-provided first-edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf)

Chapter 4, “Integration”:

- “Looking for the Ideal Integration Technology,” PDF pages 59–60: independent change, consumer usability, and hiding implementation details.
- “Synchronous Versus Asynchronous” and “Orchestration Versus Choreography,” PDF pages 62–66: interaction semantics and process visibility.
- “Complexities of Asynchronous Architectures,” PDF pages 77–78: failure handling and operational complexity.
- “DRY and the Perils of Code Reuse in a Microservice World,” “Client Libraries,” and “Access by Reference,” PDF pages 79–82: shared-code coupling and the freshness tradeoff of copied data.
- “Versioning,” PDF pages 82–87, particularly “Catch Breaking Changes Early” and “Coexist Different Endpoints”: consumer compatibility and phased interface changes.
- “User Interfaces,” PDF pages 87–93, particularly “Backends for Frontends” on PDF pages 91–92: composition and presentation-specific ownership.

## Second edition (2021)

[User-provided second-edition PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf)

- Chapter 4, “Microservice Communication Styles”: “Styles of Microservice Communication” and “Mix and Match,” PDF pages 126–128; blocking and nonblocking patterns, PDF pages 128–136; request-response and event-driven patterns, PDF pages 140–155. “What's in an Event?” on PDF pages 149–153 develops payload, callback, visibility, and contract tradeoffs.
- Chapter 5, “Implementing Microservice Communication”: “Looking for the Ideal Technology,” PDF pages 158–160; “Structural Versus Semantic Contract Breakages,” PDF pages 183–184; compatibility guidance and “Managing Breaking Changes,” PDF pages 185–197; shared libraries and “Client libraries,” PDF pages 198–201.
- Chapter 14, “User Interfaces”: “Pattern: Micro Frontends,” beginning PDF page 572; widget dependencies and interaction, PDF pages 578–584; aggregating gateway discussion, PDF pages 585–590; “Pattern: Backend for Frontend (BFF),” PDF pages 590–598.

## Synthesis boundaries

Both editions support explicit service boundaries, consumer-aware contracts, and the costs of coupling. The second edition gives more explicit treatment to semantic compatibility, event payload tradeoffs, and UI/team ownership. The workflow preserves contextual choices rather than prescribing one protocol or an event-only architecture.

The concrete rollout/rollback matrix, per-step completion criteria, treatment of inaccessible consumers, scoped test selection, and durable-handoff inspection are independently authored applications of these ideas. Product limits, framework preferences, and historical tooling recommendations from the books are intentionally not installation recipes or claims about current products.
