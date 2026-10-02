# Independent regression review supplement — worker rollout integration

No actionable defect found in the new timeout/cleanup paragraph, evaluation policy, or regression-suite wiring. This supplement preserves [the original review](instruction-review.md) and [the schema update](instruction-review-update.md), including both JSON records. It does not inspect or score native model responses.

Reviewed 2026-10-02T09:13:39.474814+00:00. Git HEAD `e75ec059f69b503957bf08e8e24c99cc5b45d68a` is context only; the hashes below identify the reviewed uncommitted bytes.

## Instruction and policy assessment

- **Deadline observations, `deadline-domains.md:58–64`:** the added paragraph correctly distinguishes cancellation completion from a bounded caller response. It requires observations before acquisition, before dispatch, after a possibly accepted effect, and after cleanup when subsequent useful work should complete. Unexecuted checks remain proposed. The existing clock-domain, cleanup ownership and uncertain-effect rules remain intact. The archived file matches its original review hash; the paragraph is the only change from that archive.
- **Evaluation obligations, `AGENTS.md:7–20`, `CONTRIBUTING.md:30–59`, `agents/CONTRACT.md:47–52`, `evals/README.md:7–12`:** the policy requires relevant old-behavior checks alongside new-capability cases, including nontriggers and changed boundaries. It preserves historical cases, verifiers, rubrics and failed attempts, and requires explained replacements for intentional contract changes. Independent results and unexecuted coverage stay visible. Concise repeated pointers in repository and standalone agent contexts are appropriate.
- **Regression routing, `scripts/evals/lib.mjs:30–35,90–103,128–137`:** the new suite uses existing corpora. Filtering separates graceful-draining and concurrency-correctness in the shared corpus; direct loading rejects a case owned by the other skill. Dedicated legacy corpora keep support for omitted ownership fields. The existing shared corpus contract requires globally unique case IDs. Default-suite selection and record format remain intact; changed runner bytes receive new content hashes.
- **Earlier runner hardening:** the pre-dispatch suite/control check remains enforced. The integration test still rejects a removed control suite before trying to launch its nonexistent host. The prior observation remains closed without rewriting its earlier record.

## Executed checks

```sh
node --test tests/worker-rollout-integration/runner.test.mjs tests/engineering-toolkit/runner.test.mjs
```

Result: **29 passed, 0 failed, 0 skipped**, exit 0, using Node v25.9.0 on Darwin arm64. This includes 19 unchanged default-runner tests and 10 integration/regression runner tests. Execution used local synthetic hosts and test fixtures; no native model ran.

The existing runner test and all four legacy corpora's cases and fixture paths are unchanged from HEAD, with no untracked additions in those paths. The four earlier review artifacts retain their exact hashes. Five scoped documentation pointers/anchors resolve, and scoped whitespace checks passed.

## Reviewed hashes

| File | SHA-256 |
| --- | --- |
| `AGENTS.md` | `38fa0c655b002e2f36e904a730eb63d4816e214488583d5f2fecb85df8484e0c` |
| `CONTRIBUTING.md` | `cfa6127166a60bf65c73d4c2204ff597c87e21f9ab12d098fc2a4925e159e4c8` |
| `agents/CONTRACT.md` | `65b8f5fd28033ec2a9a372ba902f8fb2241ae147c91c414196f50df43ab886ca` |
| `evals/README.md` | `7dacae3da6f436550678f73b97ebe54dac7d7f4dd2288dbb8f25fff993d663d8` |
| `skills/engineering/microservice-operations/references/deadline-domains.md` | `a583c46f89023a90461e0e323d744cabe75df3dd1aa3cf23da01fd75cdde3c31` |
| `scripts/evals/lib.mjs` | `aa8b121b2299135fde0030bf04c4da9509c270b7f3fe59becc978d710304a2bf` |
| `scripts/evals/cli.mjs` | `7d58ac400540150fef613e265781388d1f5e2af7fb93da490a068e553b9684aa` |
| `tests/worker-rollout-integration/runner.test.mjs` | `7378ec48c50f0963adcee5f15af7b60facac1606f06207d08f693927e5e33a96` |
| `tests/engineering-toolkit/runner.test.mjs` | `9bae0b2f96c4b5273a45b29b0480ecfbac5da285ec177287f88192a92944b15d` |

The [machine-readable supplement](instruction-review-regression-update.json) also binds the archived deadline reference, legacy corpus files, corpus uniqueness check, preserved review records, and executed check details.

## Limits

These local tests verify bounded runner behavior. They do not establish preservation or improvement of native skill behavior; the selected legacy/new behavioral cases and dependent workflow runs need separate execution records and independent scores. No runtime deadline, cancellation cleanup, clock adjustment, database, broker, rollout or production recovery was exercised. This is a scoped review, not a full runner security audit. Later edits require a new scoped check; earlier records remain historical evidence of their own candidates.
