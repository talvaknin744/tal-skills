# Independent integration supplement review

Reviewed 2026-10-01 against the exact working-tree snapshots below. **One P2 validator finding; no material source-fidelity or placement findings in the two adoption branches or two agent changes.** This supplement reviews work authored by other agents. The earlier [existing-adoption review](review-existing-adoptions.md) remains unchanged. No scores, skills, agents, validator or manifests were edited during this review; the only repository write is this new report.

## P2: Check that coverage proof belongs to the publisher and preserves its access boundary

**Locator:** `scripts/check-research-archive.mjs:25–27`, reviewed SHA256 `a2cfeafd7360e14c707b4a7867636d21db7e4a1fe41f9113eb7133af1cc3d113`.

`readBound` verifies the coverage file's bytes, but the returned `proof` is only checked for truthiness. The script never associates its publisher identity with the manifest entry or checks that the manifest's gap/terminal claims preserve the referenced proof. Consequently an edit can publish incorrect attribution or erase an explicit access gap while the ordinary archive check still succeeds.

Two controlled cases reproduced this without modifying any repository file. A Node VM ran the reviewed script with an in-memory replacement only for the manifest read; inventory and coverage reads still used their actual bound bytes:

| Isolated manifest change | Observed outcome |
| --- | --- |
| Remove the last publisher | Rejected: coverage/count/reading boundary mismatch |
| Set `all_article_bodies_read` to `true` | Rejected: coverage/count/reading boundary mismatch |
| Change OpenAI's inventory hash to 64 zeroes | Rejected: archive source changed |
| Replace OpenAI's coverage path and hash with Anthropic's valid coverage path and hash | **Accepted** despite proof referring to the wrong publisher |
| Change Pinterest's gap flag to `false`, clear its gaps and replace its summary with terminal endpoint completion | **Accepted** despite the unchanged coverage proof recording a blocked historical archive |

**Action:** add per-format coverage adapters, alongside the inventory adapters, that locate the exact publisher proof and reject missing/mismatched identity. Preserve or verify normalized access/history-gap and terminal fields from that proof, rather than requiring only a nonempty summary. Add these two negative controls to the validator's checks. Different raw schemas need explicit adapters; inventing a universal historical-completeness claim would be incorrect.

The current manifest correctly retains Pinterest's gap and does not currently bind OpenAI to Anthropic. This finding concerns the regression guard, not a claim that those published records are already false. The validator's count/hash/URL checks remain useful; its current green output establishes structural attribution only, not semantic consistency of every coverage assertion. Root was notified promptly before this report was written.

## Adoption and route assessment

| Reviewed change | Assessment and boundary |
| --- | --- |
| `architecture/SKILL.md:28` and `references/analytical-read-models.md` | Conditional architecture decision guidance rather than a mandatory ClickHouse conversion. The new branch distinguishes historical/current answers, approximation, CDC identity, mutable grouping keys, inserted-block JOIN triggering, engine-local version reconciliation, catch-up and cross-table snapshots. Source-ledger lines 3–10 preserve historical vendor claims and independently authored checks. Existing `planning.md` and `review.md` still govern general architecture decisions. No change requested. |
| `microservice-operations/references/capacity.md:48–71` and `sources.md:97–99` | Resource lifetimes, slots versus rate/byte budgets, admitted resource-holding work, stage coordination and useful completion remain separate from historical CockroachDB queue/settings choices. Node-local policy is not presented as fleet fairness, connection control or rejection guarantees. This complements the existing failure-handling queue/bulkhead checks. Other capacity branches and model-trial outcomes are outside this supplement. No change requested. |
| `agents/platform/tal-messaging.md:4–15` | The streaming skill and conditional time/join/state inputs fit continuously maintained computation. The stream package explicitly separates operator contribution semantics from broker acknowledgements and external effects; synchronous local callbacks remain excluded. No material scope expansion beyond the named streaming contracts found. |
| `agents/platform/tal-reliability.md:8–16` | Background maintenance is added with resource-budget, durable-progress and pause/resume inputs while retaining selection of only the relevant declared branch. Its skill excludes finite local cleanup and preserves review/design/implementation modes and authorized production effects. No material scope issue found. |

## Primary-source scope and limits

Independent delegated reviewers read the actual source ledgers and local storage research cards separately from these live primary reads:

- [ClickHouse's V2 modeling article](https://clickhouse.com/blog/postgres-to-clickhouse-data-modeling-tips-v2): complete substantive text, introduction through summary, including SQL examples and reported results. [ClickPipes ordering keys](https://clickhouse.com/docs/integrations/clickpipes/postgres/ordering-keys): complete substantive page, including stable custom keys and deletion replica identity. [Incremental materialized-view documentation](https://clickhouse.com/docs/concepts/features/materialized-views/incremental-materialized-view): selected background, JOIN and refreshable-view distinction sections, including the beginning of the worked JOIN example; not the full manual. Diagram pixels and linked implementations were not inspected. SQL/CDC/performance claims were not reproduced.
- [CockroachDB's admission design account](https://www.cockroachlabs.com/blog/admission-control-in-cockroachdb/): complete main body through conclusion, including resource ordering, slots/tokens, grant chaining, priority, tenants and epoch-LIFO. [Current admission documentation](https://docs.cockroachlabs.com/docs/stable/admission-control): selected Work queues and ordering, Known limitations and Considerations; not the full manual. Graph/diagram pixels and reported throughput were not independently verified. Queue/deadline/cleanup prescriptions remain original application synthesis.

## Archive and structural checks

The current manifest records exactly the previous 60 survey IDs and sums to 58,178 metadata records. It labels body reading as separate and lists history/access gaps for Pinterest, Netflix, Stripe, Airbnb, JetBrains, Discord, LinkedIn and MongoDB. The surrounding README additionally qualifies finite sitemap terminals, supplemental rows, release/community records and unverified publication dates. No current global lifetime-completeness claim was found. The review read the manifest summaries and corresponding lane coverage structures; it did not repeat archive crawls or independently verify all 58,178 article pages.

Executed read-only checks:

- `node scripts/check-research-archive.mjs`: passed, 60 publishers / 58,178 metadata records; five isolated VM controls are recorded above.
- `node scripts/check-toolkit.mjs`: passed, 15 roles / 8 workflows / 46 native artifacts. Agent skill dependencies exist. This does not establish routing behavior from a model trial.
- 21 local Markdown path targets across architecture/operations adoption and context files resolve. Anchor existence was not generally validated. Basic architecture frontmatter name/description checks passed.
- `git diff --check` passed for the reviewed tracked paths. No model requests, SQL/CDC experiments, load tests, vendor runtime checks or score edits were executed by this reviewer. Root's actual model trials remain separate work and are not assessed or claimed here.

## Exact snapshots

Paths are relative to `$HOME/Documents/ChatGPT/skills`. SHA256 covers whole file bytes, including context outside the scoped verdict. The validator finding and VM outcomes apply to the specified original validator hash; later root fixes require a separate closing check.

| File | SHA256 |
| --- | --- |
| `skills/engineering/architecture/SKILL.md` | `aae6cf938ef7e2102b2d89c73de902c2f1f83080bbbe6e33480c87f93e129918` |
| `skills/engineering/architecture/references/analytical-read-models.md` | `5e7bfdccfe7700d41ad5043b611de12bdaee5f699773a975c75f933c80340dbd` |
| `skills/engineering/architecture/references/sources.md` | `ad60ec3b3d14d6b1495052c4917a779386def25a18884b02e76991d02120884b` |
| `skills/engineering/architecture/references/planning.md` | `a8292dadd87dafeeed9744b96c91e2d63ec905730663efebb74cfbe16b33014a` |
| `skills/engineering/architecture/references/review.md` | `6f9e04615b2af3fb4c509ee8fc36bc7558bf6ded4453a90168a77cac5efdca5d` |
| `skills/engineering/microservice-operations/SKILL.md` | `a8f2988fa64b4d5c39ddec1d4197edd6b40466be289eff2fa4ef6d650d39d144` |
| `skills/engineering/microservice-operations/references/capacity.md` | `e1c6538a368a6444e3d2899efeea691b6947dc03213a3d72e3e731d6df9e16ba` |
| `skills/engineering/microservice-operations/references/sources.md` | `628b189809c9a92afe2a0a9a5aec3f32e30580a34572eb1bf291c0264a56859b` |
| `skills/engineering/microservice-operations/references/failure-handling.md` | `2e40bc522da79f6330737625ffb78c48a750850041e313f026421d6cccd717d5` |
| `skills/engineering/microservice-operations/references/retry-coordination.md` | `a1c969db3d171b4af3dfcc05a2ee432991be57712e64687daebf2465e8e83e60` |
| `agents/platform/tal-messaging.md` | `32cacf467bee4b0f0710337cc056b61495ef253981c8d83e0159ac2992eab7af` |
| `agents/platform/tal-reliability.md` | `eb0e067fd6ad2e3cac08f64e3c974dc6227a29aff0bb12c8f8f6b7fff25bae99` |
| `skills/messaging/stream-processing-design/SKILL.md` | `25f88df258830e8826c779f7a6eb18c1fdc893e9fb37e7496867fb5e017c6932` |
| `skills/engineering/background-maintenance/SKILL.md` | `f4fd905b03bbf95980363e43342fa023804d6225a817f20c39f22c020605632c` |
| `scripts/check-research-archive.mjs` | `a2cfeafd7360e14c707b4a7867636d21db7e4a1fe41f9113eb7133af1cc3d113` |
| `scripts/check-toolkit.mjs` | `24ed7de15b42c8e52b886216e4cbb3c2491abf8cf687a40b8ea5ae0e3713ff2b` |
| `docs/research/engineering-toolkit/publisher-survey.json` | `459f85fa57ca6fa178188f4d6a3acc356eae1a3a366f6849ea8769391996dc9f` |
| `docs/research/engineering-toolkit/2026-10-01/archive-manifest.json` | `15ffdcfe9bfe78914468e8c4b847bc114980464ae9b9d9f2aeadfec7c4b2b559` |
| `docs/research/engineering-toolkit/2026-10-01/README.md` | `a41b149e2ccf282327d35781eafc94f01484bb3164e759430ad2fdad4c48ee65` |
| `package.json` | `bedddfb480235b6e2d1126d401fe07627991bb82b377440fd8f88225a4e67ba7` |

## Dated recheck — 2026-10-01

The new `validateCoverageAttribution` helper is wired into the real archive checker. It requires exactly one matching publisher proof and exact equality of the referenced summary and gap list. **The two original demonstrated controls are now fixed at the hashes below.** The historical finding, original hashes and outcomes above are retained.

Executed independently:

- `node --test tests/research-archive.test.mjs`: all four tests passed, including the adapter pass across all 60 published proofs, foreign publisher substitution, combined Pinterest gap/terminal erasure, and Discord terminal/duplicate-proof controls.
- `node scripts/check-research-archive.mjs`: passed for 60 publishers and 58,178 metadata records.
- Full-checker VM controls used only in-memory manifest changes, with the checker and helper evaluated in the same realm and actual inventory/proof reads unchanged. The unchanged baseline passed. OpenAI-to-Anthropic coverage substitution rejected with `Coverage publisher mismatch: openai`; the original Pinterest gap/terminal erasure rejected with `Coverage summary or gaps mismatch: pinterest`; Discord's forged `proven` terminal field rejected with the matching summary/gaps error.
- Additional independent single-field controls rejected Pinterest gaps-only erasure and terminal-summary-only forgery. A separate helper check rejected duplicate matching Discord proof rows. No model, package, skill, frozen runner or score was changed.

**Residual P2 completeness metadata issue:** `history_or_access_gap` remains outside the adapter's validation. Changing only Pinterest's flag from `true` to `false`, while leaving its correctly bound blocked-history summary and gaps untouched, passed the full checker. The current manifest is accurate, but that standalone field can regress and mislead a consumer relying on the boolean. Validate it against a lane-specific normalized proof contract, or remove the duplicate scalar and derive the displayed status from validated fields. Do not infer universal lifetime completeness merely from an empty gap list. Root was notified of this exact accepted mutation.

**P3 regression-test improvement:** the Pinterest unit test changes both summary and gaps before expecting one rejection. Either remaining comparison would mask removal of the other. Split it into gaps-only and summary-only assertions; both already reject under the current helper. This concerns future regression detection, not a current acceptance defect in those two comparisons.

| Rechecked file | SHA256 |
| --- | --- |
| `scripts/research/coverage.mjs` | `62f93b7554ef64e83d6385971a6ee13db5b32732222870357aba30e3a65bcdd5` |
| `scripts/check-research-archive.mjs` | `abdbfc26e854039ac46005dc2313650126102d406ded6a4aa05a7e6f677a9530` |
| `tests/research-archive.test.mjs` | `88eafeaf1b2cb862caf0d779cd922a90ea45e9324fc142bf456254dbadc333f8` |

## Final closure — 2026-10-01

**The original P2 attribution finding, residual P2 unbound flag, and P3 coupled regression-test gap are closed at the final hashes below.** Earlier findings and rechecks remain historical evidence about their specified snapshots.

The manifest removes `history_or_access_gap` from every one of its 60 publisher entries. The helper explicitly rejects reintroducing that own property rather than inferring a binary history classification. Bound publisher-specific summaries, qualifications and gap lists remain the coverage evidence. The tests now distinguish gaps-only erasure from summary-only forgery and include the unbound-scalar control.

Independently executed closing checks:

- `node --test tests/research-archive.test.mjs`: all six tests passed.
- `node scripts/check-research-archive.mjs`: passed for all 60 publishers and 58,178 metadata records. A structural inspection found the removed scalar in zero entries.
- Full-checker in-memory controls: unchanged baseline accepted; reintroducing only Pinterest's scalar as either `false` or `true` rejected with `Unbound coverage flag: pinterest; use the attributed summary and gaps`. Foreign OpenAI proof substitution, separate Pinterest gaps-only and summary-only mutations, and Discord terminal forgery also rejected.
- Mutation sensitivity: evaluated the six actual current test bodies against the final helper, then against an in-memory helper differing only by removal of the gaps-equality comparison. All six passed with the real helper. The mutant failed the independent `blocked archive gaps cannot be erased` test with `Missing expected exception`; the other five passed. The regression suite therefore detects precisely the missing comparison that the earlier coupled test concealed. No mutant was saved to disk.

These checks establish the concrete reviewed validator controls, not lifetime archive completeness or article-body reading. No model requests, scores, frozen runner, package, agent or skill files were changed. Only this closure was appended, preserving all preceding report bytes.

| Final rechecked file | SHA256 |
| --- | --- |
| `scripts/research/coverage.mjs` | `88f8d7cfd204166d93b06589ee810f24236767338f6adc9542accdb465409b23` |
| `scripts/check-research-archive.mjs` | `abdbfc26e854039ac46005dc2313650126102d406ded6a4aa05a7e6f677a9530` |
| `tests/research-archive.test.mjs` | `80bcd37cc63c0c539efbd2dab9dd8cb4f13759af50008cb0ca7dd768232a65ea` |
| `docs/research/engineering-toolkit/2026-10-01/archive-manifest.json` | `ccf95b90cd6e72ab31b6d13d9a00cbd2118c69a73dc0802949ec66059f5f95b7` |
