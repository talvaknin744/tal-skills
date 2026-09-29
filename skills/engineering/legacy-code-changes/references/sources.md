# Sources and scope

The source inspected for this skill is Michael Feathers, *Working Effectively With Legacy Code*, the **54-page draft dated February 26, 2003** supplied through the [requested PDF](https://github.com/iamindian/References_Books/blob/master/Working%20Effectively%20With%20Legacy%20Code.pdf). The date appears on PDF page 1. This is an incomplete draft, **not the complete published book**. Page references below are one-based PDF pages; its printed page numbers match them.

The workflow and project fixtures are original operational synthesis, not reproduced prose, examples, or a chapter summary. The five steps are not a named algorithm from the draft. Consult this map when checking an attribution or deciding whether a technique is supported by the inspected source.

| Skill decision | Exact draft section and PDF pages | Supported basis |
| --- | --- | --- |
| Bound testing to the change and improve feedback incrementally | “What is Legacy Code?”, pp.7–8; “Getting a System under Test”, p.9 | Tests expose unintended changes; a system can be brought under test incrementally |
| Observe current behavior while distinguishing an intended correction | “Characterization Tests”, pp.10–12 | Existing results supply baseline expectations; a bug fix deliberately changes the relevant expectation while other tests protect surrounding behavior |
| Find an accessible invariant before deeper edits | “Getting Tests in Place” → “Smoke Tests”, p.13 | A system boundary can provide a useful check before internal access is available |
| Choose a feasible harness and consider build costs | “Tools of the Trade” → “In vitro Harness” and “In vivo Harness”, pp.14–15 | Harness placement and build dependencies affect practical feedback |
| Separate unwanted dependencies or sense hidden effects | “Sensing and Separating”, pp.19–20; “Internal and External Dependencies”, p.21 | Substitution serves distinct observation and isolation needs |
| Keep the behavior under test real | “Inheritance as a Tool”, pp.22–24 | A testing subclass must not omit behavior needed by its assertion |
| Substitute an existing parameter | “Breaking External Dependencies”, pp.25–26 | An interface and alternate collaborator can enable sensing or separation |
| Identify hidden construction and global access | “Breaking Internal Dependencies”, p.27 | Globals, singletons, free functions, and internally created objects can obstruct testing |
| Control globals and retain test isolation | “Introduce Static Setter”, pp.29–33, especially p.32 | Replaced global state is shared by tests; setup and teardown must account for it |
| Isolate free functions or build dependencies | “Link-time Polymorphism”, p.34; “Encapsulate References”, pp.35–39 | Linking or delegation can introduce a substitution boundary |
| Keep enabling edits small before tests exist | “Encapsulate References”, p.37 | Leave logic in place while introducing a way to substitute calls or data |
| Preserve ordinary callers while exposing construction | “Parameterize Constructor”, pp.41–42 | Accept a collaborator and retain an ordinary forwarding constructor when appropriate |
| Check constructor dispatch before relying on an override | “Introduce Deferred Factory Method”, pp.43–44 | Factory overrides have language limits, explicitly including C++ constructor dispatch |
| Consider sensing and object lifetime when selecting a boundary | “Introduce Deferred Getter”, pp.45–47; “Supercede Instance Variable”, pp.48–49; “Object Creation in Method”, p.50; “Parameterize Method”, pp.51–52 | Substitution strategies differ in access, lifetime, and whether original construction still occurs |

Several headings are unfinished: “Sensing Change” on p.20, portions of p.52, and the brief second “Introduce Deferred Factory Method” on p.53. “Sprout pattern” appears only in the “To add:” list on p.3. The draft does not develop Sprout Method/Class, a formal Legacy Code Change Algorithm, or the later seam terminology; this skill does not attribute those concepts to it.

Scope preservation, honest reporting of executed checks, explicit desired-behavior regressions, guaranteed restoration, parallel-test precautions, and modern ownership/initialization checks are this skill's practical safeguards. They are not claims that this draft supplies a complete current testing standard. Verify language and library behavior against the project's actual toolchain when it affects the chosen edit.

The accompanying MIT license covers this skill's original material. The book remains its author's copyrighted work and is neither bundled nor relicensed here.
