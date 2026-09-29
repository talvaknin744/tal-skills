# Independent review: technical deprecation

Reviewed 2026-09-29 against the eight frozen files identified below. **No actionable correctness, scope, source-attribution, or packaging defect found.** This supports freezing the authored skill for separate behavioral evaluation; it does not establish activation reliability or a successful retirement.

The reviewer authored neither the skill nor its research records. Review applied the local Writing for Agents and Skill Creator guidance, read all six package files and both research records, inspected the adjacent cleanup and microservice-integration guidance, and checked the linked primary sources. Only this report was written. No model calls, external notices, live changes, runtime warning probes, or retirement experiments were performed.

## Instruction and scope assessment

| Concern | Finding |
| --- | --- |
| Activation and nontrigger | The description ties use to retiring a supported library, API, configuration option, or internal tool whose consumers must migrate. It explicitly excludes private unused-helper cleanup, worker draining and public-product shutdown policy. A closed local deletion has no supported-contract transition and belongs on the existing bounded cleanup path. This is a wording assessment, not an observed nontrigger pass. |
| Consumer coverage | The conditional evidence reference covers static and dynamic selection, supported versions, offline or infrequent clients, scheduled jobs, fallback paths and retained inputs. Evidence includes its revision/time and observation domain. Quiet telemetry cannot silently become complete absence; unavailable consumers remain unknown. |
| Replacement and responsibility | Required inputs, outputs, errors, effects and persisted formats are checked per materially different consumer behavior. Preserved behavior, authorized change and unresolved gaps remain distinct. Existing assignments must support the migration owner; missing assignments stay pending rather than becoming invented personnel or approval. Acknowledgement alone cannot replace compatibility evidence. |
| Preventing new adoption | The guard must identify whether it blocks new projects, new call sites, or all use. A prohibited-new-use control and permitted-existing-use control expose a warning-only rule and an overbroad rule. Supported clients remain usable during the agreed transition; exceptions have owners and exit conditions. |
| Retirement and recovery | A warning, replacement launch, date or code revert alone cannot establish readiness. The stages reconcile consumer evidence, state-format compatibility, policy and recovery; a new caller or unmet replacement requirement stops the dependent retirement step. Hidden, disabled, ready-to-remove and physically removed states are distinguished. Checks are rehearsed in an isolated target with a deliberate legacy-use control. |
| Authority and policy | The skill follows actual support policy, accepts explicitly authorized withdrawal as a separate decision, and invents no universal grace period. Notices are drafted unless sending is already authorized. Live changes remain within task authorization. Google-specific staffing and outage techniques are not defaults. |
| Usability and overlap | The entrypoint is 532 whitespace-delimited words including frontmatter. Consumer evidence, migration gates and source attribution have explicit reading conditions. The six-file package has no required sibling skill, new agent persona, or generic service-integration workflow. Consumer migration through retirement is distinct from cleanup's behavior-preserving edit and integration's service-contract evolution. |

No correction was requested from the author. Behavioral evaluation should still independently observe positive use and the private-helper nontrigger; neither this review nor structural validation supplies that score.

## Primary-source check

The complete official main text of *Software Engineering at Google*, first edition (2020), Chapter 15 was inspected. Its author/editor match the ledger. The skill's treatment of technical retirement, unexpected consumers, explicit process ownership, intermediate progress and preventing renewed use is consistent with the chapter. The package avoids turning Google's particular tooling, staffing and controlled outages into general requirements. Its consumer matrices and recovery checks are labeled operational applications, not source quotations. The prior HTML hash matches the existing `books-quality.json` record and is accurately identified as historical rather than a fresh live-page hash. [Official Chapter 15](https://abseil.io/resources/swe-book/html/ch15.html).

Current PEP 387 distinguishes soft deprecation from scheduled removal and applies its compatibility process to Python itself. The skill accurately preserves that boundary without transferring Python's grace periods or governance to arbitrary projects. The ledger's displayed modification timestamp matches the page. [PEP 387](https://peps.python.org/pep-0387/).

The versioned warnings page identifies Python 3.14.7. Regular-build filters normally suppress `DeprecationWarning` outside `__main__`; filters can change whether a warning is displayed or raised. `warnings.deprecated` was added in 3.13, and its runtime category does not determine static-checker behavior. Therefore the package correctly requires checking installed tooling, configuration and exit status before claiming enforcement. Relevant warning categories, filters, testing/upgrading and decorator sections were inspected; no runtime behavior was reproduced. [Python warnings reference](https://docs.python.org/3.14/library/warnings.html).

## Independent structural evidence

Executed from the repository root using Node **v25.9.0** and the existing Python **3.14.3** validation environment:

```text
/tmp/tal-python-backend-impl/bin/python /Users/idanvaknin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/engineering/technical-deprecation
node scripts/check-skills.mjs
```

Both exited 0. The first reported `Skill is valid!`; the repository checker passed all **41** current skill packages, including this one. An independent read-only document check parsed the JSON; verified that all eight files were ordinary files with final newlines and no trailing whitespace; resolved every local Markdown target; and verified that package-local links stay inside the independently installable package. Metadata satisfies the display-name, short-description and explicit `$technical-deprecation` default-prompt requirements. These checks establish structure only.

HEAD observed during review: `6e461538a425700d24c8addf5cf9dbbadeef306c`. The reviewed files are identified by content hashes independently of that commit.

| Reviewed path, relative to repository root | SHA-256 |
| --- | --- |
| `skills/engineering/technical-deprecation/LICENSE` | `ac8d9fdd4a38fc1dcce90d64a1ba0c3b16c3390b1aab352500ddbd46ba0f5ba4` |
| `skills/engineering/technical-deprecation/SKILL.md` | `93de2ce8f37d07a4bbe4d124c2b5d4860620451db16546090081020292d085cc` |
| `skills/engineering/technical-deprecation/agents/openai.yaml` | `563bb9eb56543c0724e4b8277eaf75708b7ced68f203e0bb3184cd686c0e7304` |
| `skills/engineering/technical-deprecation/references/consumer-evidence.md` | `f3f11d395fef7f770eeed9e3332c5b725b4909e4abc199f905b2da460cc7d169` |
| `skills/engineering/technical-deprecation/references/migration-gates.md` | `5d7ce0fbc2e3e2762d06ae8b22d6d642c10e4984eaa458df39fb5c87e8a653b3` |
| `skills/engineering/technical-deprecation/references/sources.md` | `8dc3a739a81596868c97fbe6a577ac53cf255ad98067fd955060acdee84a2fe7` |
| `docs/research/engineering-toolkit/extensions/technical-deprecation.md` | `0e7a0a37c730ac128beee1dfb37c153a93a6ec528045f615ec92748001d3336f` |
| `docs/research/engineering-toolkit/extensions/technical-deprecation.json` | `382e479b67532ab715c9e1342e3750643346f26d373e8c1e251c18e284f275fa` |

The six-file package manifest digest is `3b691f252685d6d61d573fa34560060f5bf910bd5a130eacc8174e563d5216d7`: SHA-256 of concatenated sorted repository-relative paths, a NUL byte, each file's lowercase SHA-256, and a newline. The individual hashes above are the primary review record.
