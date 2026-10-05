# Learning-plan cleanup evaluation

Candidate tree: `eae4f3d6dbe81b0fa8d17243d01fc9929b681b2b61856b3eb10acff8d4417db8`.
This is the frozen uncommitted revised candidate, based on `67eba56`.
The original `missed-week` prompt, rubric and fixture are unchanged.
The new cases cover linear algebra syllabus boundaries and calendar-format nonactivation.

Three fresh Luna (`gpt-6-luna`, high reasoning) subagent sessions received
only their prompt, raw fixture and candidate (metadata only for the nontrigger).
An independent Luna reviewer scored the saved answers separately: regression
13/14, changed boundary 11/12, nontrigger 3/4. No critical criterion scored zero;
all three retain a partial scope/preservation score because full tool traces
and external-action evidence were not exported. This is limited adapted-host
behavioral evidence, not full native-host acceptance or a baseline improvement.

The first scoring attempt found the nontrigger answer file missing. That attempt
is preserved. The parent captured the participant's final message verbatim,
with a capture note, before independent rescoring. No answer was reconstructed.
Post-run project hashes match all original fixtures (`workspace-checks.json`).

Web/delegation restrictions were instructions, not sandbox controls. Native
skill discovery, full traces, token usage and long-term learning outcomes were
not tested. The existing engineering evaluation CLI has no learning-plan suite;
the adapted subagent runner was used explicitly. Raw answers, the frozen
candidate and capture notes are retained in the local cleanup archive workspace.
