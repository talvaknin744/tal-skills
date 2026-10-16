# Data publication gate extension evaluation map, version 2

The original [corpus](cases.json), raw fixtures, prompts, rubrics and historical results remain unchanged. The additive [data gate corpus](cases-v2-data-gates.json) supplies four synthetic review projects and one nontrigger. A responder receives only its selected inline prompt, raw project, normally discoverable frozen package and declared capabilities. Keep this map, scoring metadata and other cases outside its workspace.

| Capability or boundary | Selected established regression | Additive case |
| --- | --- | --- |
| Final transformed serving data can fail a consumer journey | `mocked-checkout-gap` | `data-final-serving-artifact` |
| Bad data controls exercise the actual publication decision | `mocked-checkout-gap` | `data-publish-gate-alert-only` |
| Baseline health, intended versions and assignment determine comparison validity | `unknown-api-consumers` | `data-comparison-invalid` |
| A local replay can retain the complete supplied risk | `mocked-checkout-gap`, `unknown-api-consumers` | `data-local-replay-positive-control` |
| Data terminology in a local label request stays local | `pure-unit-test-nontrigger` | `data-local-label-format-nontrigger` |

Select both established positives and the complete original nontrigger set alongside the additive cases. Report the two groups separately. Preserve all attempts and exact candidate identities, actual activation observations, capabilities, deviations and independent criterion evidence. Three fresh normal discovery attempts per positive and one per nontrigger follow the declared activation procedure. Corpus checks establish input and path integrity, with no behavioral pass or production guarantee.

Author attribution identifies Netflix's [The Data Canary: How Netflix Validates Catalog Metadata](https://netflixtechblog.com/the-data-canary-how-netflix-validates-catalog-metadata-18b699d58e36) as motivation. Fictional APIs, SHA256 bindings, decision enums, journeys and numerical thresholds are supplied fixture contracts. They are not Netflix specifications or statistical guarantees. The local positive control evaluates only its supplied modeled risk; no universal live traffic requirement follows from the source system's own production lifecycle.

The sealed source staging packet retains both failed fixture prefix preparations. The [relocation record](history/data-gates-fixture-relocation-v1.json) binds the exact metadata correction. Only five `fixture_dir` strings changed in the staging corpus. Every other metadata byte and all 24 raw fixture files remain exact. The old fixture and corpus bytes are protected by the [corpus manifest](../company-blog-refresh/netflix-mechanisms-corpus-manifest-v1.json). No implementation verifier or automatic expected outcome is added to these review cases.

Use `company-blog-refresh-netflix-data-gates` through the existing refresh staging helper. A fresh external source view aliases the versioned corpus to `cases.json` with exact bytes and full fixture prefixes. The original repository corpus remains intact. Actual host isolation must be reported: a read only case declaration does not itself enforce a filesystem, network or inherited guidance jail. Rendered source parity, media, live service behavior, unavailable hosts and lifetime archive completeness remain separate gaps.
