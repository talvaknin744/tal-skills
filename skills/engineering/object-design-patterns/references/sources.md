# Sources and attribution

This skill is an independently written workflow informed by *Head First Design
Patterns*, by Eric Freeman and Elisabeth Freeman, with Kathy Sierra and Bert
Bates, O'Reilly Media, first edition, October 2004. The supplied PDF's title page
is PDF page 7; its copyright and printing history are on PDF page 8. The latter
was checked visually because its extracted text has a font-encoding problem.
Its ISBN-13 is 978-0-596-00712-6.

[User-provided source PDF](https://github.com/iamindian/References_Books/blob/master/Head%20First%20Design%20Patterns.pdf)

Locators below are **one-based PDF pages in that 681-page file**, not printed
book pages. Other editions and scans may paginate differently. These are
selected passages used for the skill, not a claim to reproduce the whole book.

## Core selection and behavior

- Chapter 1, “Welcome to Design Patterns”: separating variable behavior and
  programming against a contract, PDF pages 47–50; “HAS-A can be better than
  IS-A” and Strategy, PDF pages 61–62. These support composition around actual
  variation and a contract independent of concrete implementations.
- Chapter 2, “Keeping your Objects in the Know”: Observer definition and “The
  power of Loose Coupling,” PDF pages 89–91. These describe ownership and
  independently registered dependents.
- Chapter 6, “Encapsulating Invocation”: Command definition, PDF page 244;
  queuing and logging requests, PDF pages 266–267. These motivate separating a
  request from its invoker.
- Chapter 8, “Encapsulating Algorithms”: Template Method definition, PDF page
  327; comparison with Strategy, PDF pages 346–347. These distinguish a fixed
  algorithm with subclass hooks from composed interchangeable algorithms.
- Chapter 10, “The State of Things”: repeated state decisions and the proposed
  separation, PDF pages 434–436; State definition, Strategy comparison, and
  transition ownership discussion, PDF pages 448–450.
- Chapter 13, “Patterns in the Real World”: “Thinking in Patterns,” refactoring,
  and restraint, PDF pages 632–636. These ground simple alternatives, credible
  variation, preserving behavior, and removing unneeded patterns.

## Structure and interfaces

- Chapter 3, “Decorating Objects”: selective extension, PDF pages 124–125;
  Decorator definition, PDF page 129; tradeoffs and concrete-type dependence,
  PDF page 143.
- Chapter 7, “Being Adaptive”: Adapter definition, PDF page 281; comparison with
  Decorator, PDF pages 290–291; Facade discussion and definition, PDF pages 298
  and 302; “The Principle of Least Knowledge,” PDF pages 303–304.
- Chapter 9, “Well-Managed Collections”: Iterator definition and discussion,
  PDF pages 374–376; Composite definition, PDF pages 394–396; unsupported
  operations and implementation tradeoffs, PDF pages 405 and 414–415.
- Chapter 11, “Controlling Object Access”: Proxy definition, PDF pages 498–499;
  virtual proxy, PDF page 500; summary and distinctions, PDF page 529.

## Construction and lifetime

- Chapter 4, “Baking with OO Goodness”: changing concrete construction
  dependencies, PDF pages 148 and 151–153; Factory Method, PDF pages 169 and
  172; Abstract Factory, PDF page 194. These distinguish isolated construction,
  a subclass creation hook, and related product families.
- Chapter 5, “One of a Kind Objects”: Singleton definition, PDF page 215;
  initialization races and Java-specific alternatives, PDF pages 216–220;
  scope and design cautions, PDF pages 222–223.

## Original engineering applications

The workflow order, completion criteria, contract checklist, verification probes,
and evaluation fixtures are original. In particular, account ownership,
concurrent instance isolation, callback failure policies, unit conversion,
resource cleanup, and process-versus-distributed uniqueness are engineering
questions added for practical use; the book does not establish their guarantees.
The references identify probes explicitly so they are not mistaken for quoted
book exercises.

The book's Java examples explain design intent. This skill does not prescribe
its historical APIs, JVM performance claims, class counts, or code as current
implementation recipes. Verify any language- or runtime-specific guarantee in
the actual environment.

The source book remains copyrighted by its rights holders. The skill's MIT
license covers these original skill files, not the book. No PDF, book diagrams,
or extended source excerpts are bundled.
