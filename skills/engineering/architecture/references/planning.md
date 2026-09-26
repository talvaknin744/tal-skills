# Architecture planning

## Frame the decision

1. Establish the decision, desired outcomes, non-goals, and constraints that can
   change the design. Include workload, security, reliability, cost, team, and
   delivery constraints where they matter. Mark missing facts as unknowns.
2. Inspect the relevant existing design and its important execution or data
   paths. For a new system, outline the smallest path that delivers the desired
   outcome. Identify the boundaries and failure cases the decision affects.

Framing is complete when the decision and success conditions are explicit,
the affected boundaries are identified, and material unknowns are visible.

## Compare and decide

3. Compare credible alternatives against the same constraints. Include keeping
   the existing design when that is viable. Explain consequences for complexity,
   failure handling, operating cost, and future change where they differ.
   When constraints eliminate alternatives, explain why rather than inventing
   options to fill a comparison.
4. Recommend the smallest viable design supported by the evidence. Describe
   components, responsibilities, interfaces, data ownership, and key paths at
   the level needed to understand the decision. Include relevant failure,
   security, and observability behavior.
5. Explain the important tradeoffs and which assumptions could reverse the
   recommendation. If a missing fact prevents a defensible choice, make the
   recommendation conditional or leave that decision open with a way to resolve
   it. Prefer reversible choices when alternatives otherwise meet the need.

The decision is complete when the recommendation follows from the constraints,
the alternatives have reasons for rejection, and unresolved choices are named.

## Establish a path to adoption

6. For changes to an existing system, describe the relevant compatibility,
   migration, rollout, and rollback steps. Include dependencies and sequencing
   where they determine whether the change can succeed.
7. Specify how to validate the uncertain parts. Distinguish support from code or
   documentation from behavior established by execution. For each material
   unproven claim, describe the smallest useful proof: inputs or setup, expected
   observations, pass/fail conditions, and the responsible role when known.
   Proposed proof is future work; report an executed result only with evidence.
8. Verify changeable technology claims using primary sources for the proposed
   host and version. When conformance affects the decision, establish the
   applicable standard, version, and mandatory requirement before declaring a
   gap; separate advisory guidance from requirements.

Planning is complete when the user can understand the recommended design and
its key paths, why it fits better than the alternatives, how to adopt it where
needed, and which evidence is still required. Answer every requested decision;
keep deferred decisions and their resolving evidence explicit.
