# Stream processing design package scope

The user approved this addition on 2026-10-01. The independently installable package is `skills/messaging/stream-processing-design`.

The trigger covers ordinary continuously maintained computations: choosing event/logical/processing time, late arrival, duplicate/correction semantics, changing versus final output, temporal enrichment, and state/history lifetime. A broker acknowledgement repair and a bounded local collection edit remain countertriggers.

The short workflow establishes one observable result contract, loads only relevant conditional references, traces admission and contribution through the sink, and verifies arrival/progress schedules against independent expected values. Contract fields keep time, identity/revision, lateness, output operations, finality, and retained-state horizon distinct.

Conditional references own time/finality, streaming identities and corrections, join meaning, and retained state/history. Public primary-source attribution stays inside the package; installed runtime behavior constrains product syntax. Broker effects remain separate, while the package itself composes late admission, duplicate arbitration, corrections, aggregate contributions, and sink changes.

Two relevant evaluation fixtures cover a delayed window with duplicate/correction/replay/conflict arrivals, and historical enrichment with late dimension correction, deletion, and output retractions. A local completed-array grouping is the nontrigger. Case rubrics stay separate from the evaluated fixture workspace. Corpus and package validation do not count as actual behavioral trials.
