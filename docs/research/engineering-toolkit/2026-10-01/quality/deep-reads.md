# Design findings from five new quality-lane articles

Checked 2026-10-01. [Structured cards](articles.json) record each complete
substantive reading scope and the six dimensions: trigger, problem, mechanism,
limits, counterexample, and proposed verification. Selected URLs were checked
against prior engineering-toolkit JSON records and searched in prior docs/skills;
none duplicates an earlier candidate or deep read. Article outcomes and tool
examples were read, not reproduced. No agent model trial was run for this lane.

## Design implications

The selected sources broaden the toolkit through five questions:

- Which usable path exists while an optimized connection is still being found?
  [Tailscale's NAT design](https://tailscale.com/blog/how-nat-traversal-works)
  informs connection lifecycle reasoning; the [current connection documentation](https://tailscale.com/docs/reference/connection-types)
  includes Peer Relay alongside direct and DERP paths.
- Can ordinary application mutation paths carry the obligations required by a
  cross-owner copy? [Sentry's replication design](https://blog.sentry.io/designing-sentrys-cross-region-replication/)
  informs the existing data/messaging boundary. Receiver ordering, freshness and
  loop prevention still require their own contracts.
- Can an uncertain proposed boundary be exercised before an expensive move?
  [Sentry's boundary rehearsal](https://blog.sentry.io/removing-risk-from-our-multiregion-design-with-simulations/)
  motivates incremental evidence about the intended separation, with physical
  validation kept as a distinct obligation.
- Does a lifecycle have a specification that remains independent of its code?
  [Trail of Bits' state-machine example](https://blog.trailofbits.com/2018/05/03/state-machine-testing-with-echidna/)
  motivates explicit transition expectations. Its old tool API is not a present
  installation recipe; [maintained Hypothesis guidance](https://hypothesis.readthedocs.io/en/latest/stateful.html)
  supplies current model-testing mechanics.
- Can a compatibility seam make a cross-cutting concern easy to use and bounded
  under the actual workload? [Discord's tracing integration](https://discord.com/blog/tracing-discords-elixir-systems-without-melting-everything)
  informs message evolution and telemetry budgets. Sampling omissions and context
  restoration need explicit semantics.

These questions belong in ordinary architecture, interface and workflow work.
Failure experiments are one kind of evidence for the design, alongside ownership
models, contracts, measured workloads, compatibility and maintainable APIs.

## Toolkit application

Two existing packages received conditional references, preserving their existing
activation boundaries:

| Package | Addition | Observable done condition |
| --- | --- | --- |
| `microservice-extraction` | Proposed-boundary rehearsal before moving storage | Intended forbidden crossing rejected; a legal journey works; missing crossings/physical assumptions have named next checks |
| `failure-oriented-testing` | Independently specified state-dependent histories | Representative incorrect transition detected; explicit reduced actions replay against identified implementation |

The extraction reference offers a project-specific enforcement seam. It does not
prescribe framework monkeypatching universally, require double execution of every
test, or claim that CI validates uncovered branches. The testing reference keeps
legal-action generation and rejected-action checks distinct and limits a
sequential model's conclusion.

Replication remains research for existing `microservice-data`,
`messaging-reliability`, and `concurrency-correctness` ownership. Connectivity
belongs conditionally in `architecture` and `microservice-operations`; envelope
compatibility belongs in `microservice-integration`, and telemetry budgets in
`microservice-operations`. No distinct quality skill is established by these
five articles. A new general design package should earn its own activation and
completion contract instead of repeating these specialist workflows.

## Current crosschecks and consequential limits

[Django 5.2's QuerySet contract](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#update)
confirms that bulk update bypasses model `save()` and related signals. Its
[cross-database relationship limit](https://docs.djangoproject.com/en/5.2/topics/db/multi-db/#cross-database-relations)
requires explicit replacement semantics after a split. These are selected
supported-version checks, not framework-independent guarantees.

[OpenTelemetry's SDK specification](https://opentelemetry.io/docs/specs/otel/trace/sdk/#parentbased)
distinguishes root and sampled/unsampled parents. [W3C Trace Context](https://www.w3.org/TR/trace-context/)
requires format-aware parsing and qualifies what sampling communicates. The
[context API](https://opentelemetry-api.hexdocs.pm/OpenTelemetry.Ctx.html) supplies
explicit process context operations. The source card flags the illustrated
wrapper's exception cleanup gap; it is a static control-flow observation, not
an executed failure reproduction.

[RFC 8445 status](https://www.rfc-editor.org/info/rfc8445/)
lists RFC 8863 as an update. The update body returned 429 and was not read;
interoperable ICE advice remains bounded to consulting the normative selected
specification and its updates. Tailscale's intentionally adapted algorithm is
not presented as a complete interoperable implementation.

Validation checks the metadata and authored links. Repository-wide skill/docs
checks may report other packages while concurrent authors are still working;
those failures are retained separately from this lane's evidence. Completion of
research and structural validation does not establish a measured improvement in
agent performance.
