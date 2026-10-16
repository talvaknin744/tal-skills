# Netflix mechanism research

Two conditional additions to existing skill references are worth focused
evaluation. The research and source reviews establish useful mechanisms and
preservation limits. They establish no accepted behavior, adoption or native gain.
No new skill is needed. Exact source fields, package identities and four evidence
seals are bound in the [JSON companion](netflix-mechanism-research.json).

## Source facts and portable obligations

| Existing owner | Publisher facts | Authored portable obligations |
| --- | --- | --- |
| `concurrency-correctness`, `references/replica-reads.md` | [Titus Gateway](https://netflixtechblog.com/consistent-caching-mechanism-in-titus-gateway-6cb89b9ce296) preserves an existing client API using query related stream confirmations from one elected coordinator, ordered after active state updates. It describes process local ordering, idle events, shared confirmations and replacement snapshots after leader reconnection. | Establish the query boundary and writer domain covered by confirmation. Require application of the relevant updates to the exact cache read. Prove authority correspondence after replacement, with bounded failure and fallback. Idle events alone cannot bound transport or a stalled applier. |
| `microservice-testing`, `references/broader-tests.md` | [Data Canary](https://netflixtechblog.com/the-data-canary-how-netflix-validates-catalog-metadata-18b699d58e36) describes final transformed data corruption missed by input checks and code canaries. Healthy clusters serving intended baseline and candidate versions are compared through playback. Deliberately bad data demonstrated publication blocking. | Bind approval to the final serving artifact and configuration. Validate the intended comparison versions and populations through the relevant journey. Demonstrate that bad data blocks publication, rather than only alerts. Invalid comparison evidence stays inconclusive. |

The freshness proposal supplies a serving protocol alternative when clients do
not carry a revision. Existing guidance already covers causal tokens, exact cuts,
stale fills and startup admission. Keep a sufficient existing protocol, intentional
eventual reads and valid shared or delayed confirmations. A freshness floor is
neither an exact historical snapshot nor a reservation for a later mutation.
The article supplies no portable acknowledgement API or generation field.

The data proposal is limited to approval of the final transformed serving data,
including releases without a binary change. Existing guidance already covers
journeys, artifact identity, authorized canaries and stop conditions. Intended
baseline and candidate versions can differ. The source does not mandate a digest,
publisher API, production traffic, sticky sessions, metric, cohort fraction,
observation period or statistical confidence rule. Use the smallest authorized
experiment retaining the actual risk.

## Unchanged baseline and review scope

| Current baseline package | Tree SHA256 |
| --- | --- |
| `concurrency-correctness` | `8e5a69fa0f3e0c4bab04eefb5eabf9957fd8dc3dd16bc38f2e5c9ed06175201f` |
| `microservice-testing` | `f2d3e585418136bf4e363ab1309d877991f8bb7056e575d47fea7627cae8c595` |

External proposal packages remain separate from these unchanged canonical
baselines. Independent semantic review qualified the narrow gaps and complete
supplied fields. Independent source review found no source or static preservation
blocker in its selected package and publication inputs. It verified 43 selected
proposal payload members, without attesting the full 340 member proposal payload.
Static review cannot establish behavior preservation, supported host coverage or
production correctness.

Before adoption, preserve existing prompts, fixtures, verifiers, rubrics and
historical results. Independently author focused positive, changed boundary and
nontrigger inputs, evaluate the unchanged baseline and any revised candidate,
and retain independent scores plus failed and partial attempts. Host coverage,
full validation and generated checks remain separate gates. This continuation
uses no private case, rubric or native responder content and adds no such result.

## Reading and no-addition outcomes

The original study read four complete supplied RSS prose fields, 9,095 collector
counted words. This is four reader events, not four new globally distinct reads.
Cache warming was already deliberately read. Its body and Data Canary were already
extracted at stopped V2/r28 with identical hashes. Titus filled a missing body,
and the regional article was not known in that snapshot. Historical collector
read flags remain unchanged.

[Cache warming](https://netflixtechblog.com/cache-warming-agility-for-a-stateful-service-2d3b1da82642)
needs no new branch: existing cache coherence, maintenance and copy guidance
already covers conditional publication, shared resources, deletion and expiry.
[Regional resiliency](https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b)
needs no new branch: survivor capacity, cold recovery and rehearsal limits are
already covered. Its feed record is from 2017, while its prose identifies an
original publication on December 2, 2013.

All source facts here are paraphrased historical publisher reports. Exact RSS,
HTML, extracted text, GUID and response bindings remain under the original study
seal. No source passage or historical record is rewritten. Rendered original
parity, image pixels, linked documentation or code, implementation and reported
performance were not verified. No new HTTP request or live service operation
was made for these drafts.
