# Technical deprecation observations — 29 September 2026

**Three unique cases were executed and independently scored in six attempts.**
Selecting the latest attempt for each case gives **3 pass,
0 partial, 0 fail**. These are skill
trial rubric results, not native workflow or named-role tests.

| Population | Pass | Partial | Fail |
| --- | --- | --- | --- |
| Initial three | 2 | 1 | 0 |
| All six attempts | 5 | 1 | 0 |
| Latest per unique case | 3 | 0 | 0 |

| Attempt | Case | Independent result | Candidate body read | Verification | Latest |
| --- | --- | --- | --- | --- | --- |
| [01-positive](01-positive/) | periodic-export-client | Pass | Observed | Review; no executable verifier required | No |
| [02-positive](02-positive/) | config-channel-migration | Partial | Observed | Review; no executable verifier required | No |
| [03-nontrigger](03-nontrigger/) | private-format-helper | Pass | Not observed | Protected verifier + independent rerun (2/2) | No |
| [04-positive-r2](04-positive-r2/) | periodic-export-client | Pass | Observed | Review; no executable verifier required | Yes |
| [05-positive-r2](05-positive-r2/) | config-channel-migration | Pass | Observed | Review; no executable verifier required | Yes |
| [06-nontrigger-r2](06-nontrigger-r2/) | private-format-helper | Pass | Not observed | Protected verifier + independent rerun (2/2) | Yes |

The original configuration review [02](02-positive/score.json) remains partial for
three bounded omissions: preventing new legacy adoption, concrete stop/escalation
during a failed or unconfirmed pilot, and post-release evidence of actual removal.
It rejected the unsafe October package, but those planning gaps remain in that
original response. A reference-level correction preceded three fresh reruns;
all original scores and both candidate freezes are retained. Repeated cases
without matched controls do not establish a causal improvement estimate.

[summary.json](summary.json) records discovery, instruction-body reads, results,
verifier status, identities, selection and score gaps for every attempt.
[summary-r1.json](summary-r1.json) preserves the initial three-attempt summary.
Hash-only integrity reads are distinct from instruction-body activation; absence
of an observed body read does not prove absence of unrecorded loading. Positive
cases are read-only synthetic contract reviews; local calculations do not show a
real migration. The nontrigger checks only the supplied local Python cleanup.

Every attempt retains **`case_compliant: false`**. Reads were not confined to the
trial, inherited guidance/tools remained available, network restrictions were not
fully enforced, and effective write enforcement was not independently verified.
The private rubric was withheld from candidate files, not protected by an OS read
boundary. Scope and external/delegation observations are reported separately in
the summary. No causal skill-uplift, general reliability, or enforced-isolation
claim follows from a rubric pass. Subagents were disabled for these skill trials.

[The first freeze](freeze.json) and [the revised freeze](freeze-r2.json) bind exact
candidate packages, cases, runner and dependencies. [Author calibration](author-calibration.json)
is separate pre-trial fixture evidence, not a model score. The independent scorer
is `/root/blog_research_plan`; a fixture author assembled this archive without
modifying or grading any scores.

Each run retains original/final project files, answer, observable trace, prompt,
discovery metadata, diff, frozen rubric, independent score and validation. Its
manifest records original and published artifact hashes plus transformations.
The top-level manifest binds this README, both summaries, freezes and calibration.
Raw seals and score bindings were checked before copying. Publication omissions
are enumerated in each manifest; altered public artifacts are not claimed to
reproduce their original raw hashes. No original trial or score was overwritten.
