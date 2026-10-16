# Source 06 repository checks

The exact current candidate passed `npm run validate` at 23:16 UTC on October 14, 2026: 608 tests passed, with zero failures and zero skips. The command includes the repository structural checks and generated adapter verification. `git diff --check` also passed. The [bound check record](repository-checks.json) retains command times, log digests, package identities and preservation scope.

The candidate is `company-blog-refresh-final-source-06`, canonical digest `4fe67a4809f439958f30ba02fc281064643f4e289ef184ad80f95cdd94545eff` and generated Codex digest `4d112a3062ec819acfc9e241b317c031ba892c020aa472356c6df71869075c94`. All 248 files in each bundle matched the retained [source identity](../../../../../evals/company-blog-refresh/runs/2026-10-15/identities/source-final-06.json). The candidate remains uncommitted and unreleased.

| Verification | Actual result |
| --- | --- |
| Repository validation | 608 passed, zero failures, zero skips |
| Historical files excluding the mutable current pointer | 1,926 exact digests preserved |
| Previously frozen independent review files | 42 exact digests preserved |
| Local links in new and modified Markdown at check time | 330 checked across 161 files, zero missing targets |
| Newly added files above one million bytes | Zero |
| Current four changed package identities | Exact digest matches |
| Installed Meta collector and helper | Exact reviewed digest matches |

These checks establish packaging and deterministic behavior in this host. They do not execute an agent or establish full crawling, reading, rendered media or production behavior. Later additive reports are outside the check time snapshot and require their own metadata and link checks.

The [current messaging review](../../../../../evals/company-blog-refresh/runs/2026-10-15/independent-review-source06-v1.md) independently scores ten selected native attempts, all passing. The unchanged agent evaluation, trace and pooler packages retain nineteen selected passing observations in the [earlier review](../../../../../evals/company-blog-refresh/runs/2026-10-14/independent-review.md). Package equality permits that association without transferring messaging scores from earlier partial candidates. All historical partials and actual web deviations remain retained.

Every native attempt still reports `case_compliant: false`, because filesystem, inherited guidance, MCP and shell network isolation were not fully enforced. Current Claude behavior was not run. The optional skill creator Python validator was blocked by missing PyYAML, while the repository Node validators passed. No marketplace installation, causal improvement or production guarantee is claimed.
