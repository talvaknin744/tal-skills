# Knowledge ownership and change locality

Use this reference when duplicated rules disagree, shared helpers bind unrelated policies, or a small functional change requires edits across unrelated components.

## Identify the same knowledge

Ask what event would require each representation to change and who can decide that change. Two expressions of one policy need one authority; two policies that happen to use the same formula may need separate owners. Judge by meaning and change history, not matching lines.

For each relevant representation, name:

- The rule or fact it represents and its authoritative owner.
- Whether it is authoritative, derived, or a deliberately independent policy.
- How changes reach consumers and how disagreement becomes observable.

Prefer deriving a representation over manually maintaining its twin when the source and generation path are practical. Include generation in the normal update or build workflow; a one-time copy creates another maintenance obligation. For caches and precomputed fields, localize invalidation or recomputation and test the stale-value boundary. Independent expected results in a behavioral test can supply a useful oracle; deriving expectations from the implementation under test may conceal the same error.

An implementation, schema, and user-facing explanation can express different aspects of one policy. Centralize the shared value or rule where appropriate while keeping each representation's distinct purpose. State which explanatory material still requires review.

## Test independence with a concrete change

Walk a functional variation through its callers and dependencies. Inspect shared mutable state, leaked provider types, knowledge of storage layout, and helpers that require flags for unrelated policies. Note what must change together and why.

Choose a boundary that owns the changing knowledge and exposes the behavior its consumers need. A function or module may be sufficient. A boundary is weak when every caller must understand the dependency's representation even though calls pass through a wrapper.

Use test setup as evidence: if checking one rule requires booting unrelated infrastructure, locate the dependency responsible before adding more mocks. Preserve necessary integration tests for the contracts that remain.

Several coordinated edits can be legitimate when a requirement changes several responsibilities. Evaluate the responsibilities independently; file count alone does not establish good or poor design. Record the present tradeoff when separating ownership would cost more than the actual change justifies.

## Make reversibility concrete

For a selected dependency, identify the narrow behavior callers require and the assumptions that leak through it. An adapter helps only when it contains those assumptions. Preserve real limits such as different consistency guarantees, error semantics, or data formats.

If the change writes a new persistent representation, describe how old and new readers handle it and what reverting would require. When the data cannot be translated without loss, name that commitment explicitly. A replacement mechanism and a data transition are separate parts of the same decision.
