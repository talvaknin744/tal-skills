# Sources and applicability

Checked 29 September 2026. This package contains original procedural guidance,
not book excerpts or vendor code. It has no required sibling skill or agent.

## Technical retirement

- **Source/read scope:** *Software Engineering at Google*, first edition (2020),
  edited by Titus Winters, Tom Manshreck, and Hyrum Wright; complete official HTML
  [Chapter 15, Deprecation](https://abseil.io/resources/swe-book/html/ch15.html),
  written by Hyrum Wright and edited by Tom Manshreck. Complete chapter read in the
  existing research and reread for this package; the entire book was not reread.
- **Trigger/failure:** supported technical behavior is removed while consumers
  remain, or a warning-only migration never finishes.
- **Mechanism/conditions:** identify use, assign migration responsibility, move
  consumers, prevent fresh dependencies, and measure intermediate progress.
- **Limits/counterexample:** the chapter concerns technical systems with consumer
  visibility; it is not a public-product closure policy. Old software can remain
  adequate. Google-specific staffing, tools, and deliberate outages are not defaults.
- **Verification:** this package adds consumer-contract checks and staged acceptance
  evidence as an application of the reading. No production retirement or agent
  effectiveness is established by the source.

## Policy and warning behavior

- **Sources/read scope:** current [PEP 387](https://peps.python.org/pep-0387/),
  public API, basic compatibility, soft-deprecation, and incompatible-change
  sections; Python **3.14** [warnings documentation](https://docs.python.org/3.14/library/warnings.html),
  warning categories/default filters, testing/upgrading, and `deprecated` decorator
  sections. The documentation displayed version 3.14.7 at inspection.
- **Trigger/failure:** a soft deprecation is treated as a removal commitment, or
  metadata is mistaken for a failing build.
- **Mechanism/conditions:** use the applicable policy and inspect the configured
  runtime/checker enforcement. Python's process and durations govern Python itself.
- **Limits/counterexample:** a suppressed runtime warning does not show unused code;
  a static diagnostic need not fail the project's CI. Other runtimes require their
  own current primary contract.
- **Verification:** deliberately exercise old use under the actual tool configuration
  and observe diagnostic visibility and exit status. These are proposed checks;
  this package adds no executable probe or runtime acceptance claim.

[Matt Pocock's Writing for Agents](https://www.aihero.dev/skills-writing-for-agents)
informs precise invocation, conditional references, and completion criteria.
