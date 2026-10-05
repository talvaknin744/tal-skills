# Book-derived engineering skills

Eleven independently usable skills built from the seven supplied PDFs. They turn selected ideas into original engineering workflows rather than reproduce the books. Choose the task, then invoke its skill; the collection is not a mandatory sequence.

## Choose a skill

| Task | Skill | Source basis |
|---|---|---|
| Decide what belongs in one service | [microservice-boundaries](../skills/engineering/microservice-boundaries/SKILL.md) | Both *Building Microservices* editions |
| Design or evolve service communication | [microservice-integration](../skills/engineering/microservice-integration/SKILL.md) | Both *Building Microservices* editions |
| Coordinate service-owned state and reads | [microservice-data](../skills/engineering/microservice-data/SKILL.md) | Both *Building Microservices* editions |
| Extract a capability incrementally | [microservice-extraction](../skills/engineering/microservice-extraction/SKILL.md) | Both *Building Microservices* editions |
| Establish confidence in independent releases | [microservice-testing](../skills/engineering/microservice-testing/SKILL.md) | Both *Building Microservices* editions |
| Make cross-service behavior operable | [microservice-operations](../skills/engineering/microservice-operations/SKILL.md) | Both *Building Microservices* editions |
| Choose and compose distributed topologies | [distributed-system-patterns](../skills/engineering/distributed-system-patterns/SKILL.md) | *Designing Distributed Systems* |
| Change untested code with controlled dependencies | [legacy-code-changes](../skills/engineering/legacy-code-changes/SKILL.md) | Supplied *Working Effectively With Legacy Code* draft |
| Improve changeability and test uncertain decisions | [pragmatic-programming](../skills/misc/pragmatic-programming/SKILL.md) | Original *The Pragmatic Programmer* |
| Structure enterprise domain logic and persistence | [enterprise-application-patterns](../skills/misc/enterprise-application-patterns/SKILL.md) | *Patterns of Enterprise Application Architecture* |
| Apply an object pattern to an actual variation point | [object-design-patterns](../skills/misc/object-design-patterns/SKILL.md) | First-edition *Head First Design Patterns* |

The existing `architecture` skill remains useful for broad planning and reviews. `idempotency` handles a single operation's retry identity, duplicate suppression, and uncertain effects. The new skills work independently of those packages and focus on their own decision boundaries.

## Sources actually inspected

The source maps inside each skill contain verified chapter/section locators and one-based PDF pages. Those page numbers describe the supplied copies, not interchangeable printed editions. Source access and identity were checked on 2026-09-29.

| Supplied source | Identity and scope |
|---|---|
| [Building Microservices, first PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20-%20Designing%20Fine-Grained%20Systems.pdf) | Sam Newman, O'Reilly, first edition, February 2015; 280 PDF pages |
| [Building Microservices, second PDF](https://github.com/iamindian/References_Books/blob/master/Building%20Microservices%20Designing%20Fine-Grained%20Systems%202nd%20By%20Sam%20Newman.pdf) | Sam Newman, O'Reilly, second edition, August 2021; reflowed copy with 754 PDF pages |
| [Designing Distributed Systems](https://info.microsoft.com/rs/157-GQE-382/images/EN-CNTNT-eBook-DesigningDistributedSystems.pdf) | Brendan Burns, O'Reilly; first-edition release December 2017, copyright 2018; 164 PDF pages |
| [Working Effectively With Legacy Code](https://github.com/iamindian/References_Books/blob/master/Working%20Effectively%20With%20Legacy%20Code.pdf) | Michael Feathers, 54-page draft dated 2003-02-26. This is not the full published book. Only developed material in this draft supports the source attributions |
| [The Pragmatic Programmer](https://github.com/iamindian/References_Books/blob/master/The%20Pragmatic%20Programmer.pdf) | Andrew Hunt and David Thomas, original *From Journeyman to Master* version, copyright 2000, 25th printing February 2010; 352 PDF pages. Not the 20th Anniversary edition |
| [Patterns of Enterprise Application Architecture](https://github.com/iamindian/References_Books/blob/master/Patterns%20of%20Enterprise%20Application%20Architecture%20-%20Martin%20Fowler.pdf) | Martin Fowler with contributors, Pearson/Addison-Wesley, copyright 2003, seventeenth printing July 2011; 559 PDF pages |
| [Head First Design Patterns](https://github.com/iamindian/References_Books/blob/master/Head%20First%20Design%20Patterns.pdf) | Eric Freeman and Elisabeth Freeman, with Kathy Sierra and Bert Bates, O'Reilly, first edition October 2004; 681 PDF pages |

The workflow steps, decision probes, output expectations, and evaluation fixtures are independently authored. Source notes distinguish those choices from ideas supported by the books. Historical technology examples are not treated as current API or deployment instructions.

The two Newman editions are combined where their guidance agrees and distinguished where it changes a decision. In particular, extraction chooses code-first or data-first from the migration's dominant risk; it does not universalize the first edition's data-first recommendation.

## Packaging and validation

Each skill contains a `SKILL.md`, conditional `references/`, `agents/openai.yaml`, and an MIT license for the original instructions. All runtime references stay inside the skill directory so it can be installed separately. The PDFs, extracted text, book illustrations, and book example implementations are not distributed with the repository or relicensed.

Each skill also has three authored behavioral scenarios under `evals/<skill-name>/`: two relevant tasks and one nontrigger. Fixture inputs remain separate from evaluator rubrics. Run `npm run validate` for deterministic repository checks; the shared corpus check is `node --test tests/book-skills/evals.test.mjs`. Those checks validate packaging and inputs, not model behavior. The [recorded smoke trials](../evals/book-skills/README.md) identify the executed cases, observed results, refinement, and methodological limits.

The instruction design applies [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents): distinct activation conditions, short ordered workflows, explicit completion criteria, and conditional references. This collection is independent and is not endorsed by the books' authors or publishers.
