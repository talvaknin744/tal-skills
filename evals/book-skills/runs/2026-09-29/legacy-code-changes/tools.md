Actual work performed:

- Read `prompt.txt`, `skill/SKILL.md`, and inventoried `project` and `skill` with `rg --files project skill`.
- Read `project/request.md`, `project/quote.py`, `project/gateway.py`, and `skill/references/dependency-isolation.md` using `cat`.
- Ran an inline `python3 -B` program from this trial root. It compiled both Python modules with built-in `compile`, imported `quote`, and ran three temporary standard-library `unittest` methods with `patch.object(quote, 'CarrierAudit', return_value=...)` before construction.
- The tests checked both membership values at subtotals 0, 3999, 4000, 4001, 4999, 5000, and 5001; exact dictionaries and audit lines; omitted-member behavior; single collaborator construction and reuse; and identical propagation of a sentinel audit exception. All three test methods passed. Observed outputs were printed.
- Wrote only trial deliverables `answer.md` and `tools.md` after completing the review.

Limits: no existing suite/build command or additional callers are present in the supplied project snapshot. No modified implementation was executed, and the future regression suite is a proposal. Real CarrierAudit was never constructed; no deployment credentials, carrier endpoints, web tools, external repository files, or subagents were used. No bytecode files were written (`python3 -B`; in-memory compilation).
