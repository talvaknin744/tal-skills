# Coordination boundaries

Read on 1 October 2026: [Keeping CALM, arXiv v2](https://arxiv.org/pdf/1901.01930v2),
complete extracted main text, sections 1–6; figures were not visually inspected.
Also read Peter Bailis's complete [2014 author explanation](https://www.bailis.org/blog/when-does-consistency-require-coordination/).
The linked invariant-confluence paper and thesis were not read in this batch.
Versions, scope and practice cards are in [the source record](coordination-design.json).

CALM concerns deterministic eventual outputs under its execution model. It does
not supply latest-value reads, serializable transactions or arbitrary invariant
preservation. The author explanation distinguishes convergent merge from a
business constraint that must survive concurrent local decisions. These are
different review questions, even when the representation is a CRDT.

## Proposed addition to existing correctness guidance

When considering independently accepted updates, write the valid local states,
allowed transactions and merge rule. Check whether two states reachable from a
common ancestor can each satisfy the rule but violate it after merging. Name the
authoritative boundary for the failing decision. Compare serialization, explicit
allocation of disjoint rights, or a business-approved compensation contract;
do not infer any of these from a datatype name.

Our example begins with one unit of stock. Replica A accepts sale A and replica B
accepts sale B during disconnection. Set union converges to both sale identities;
stock is now negative. Deduplication and identical final replicas have preserved
the two sales, rather than preventing over-reservation. A provisional shopping
view can accept lag; an irrevocable reservation has a stronger acceptance rule.
This example is independently authored, not a reproduction of a vendor incident.

An absence or completion decision also needs an explicit boundary. “No matching
record has arrived” is insufficient when later inputs remain admissible. A sealed
input manifest can establish a finite cut only if its authority, completeness,
identity and publication protocol are enforced. Repeat-safe external effects
still require their own receipt and atomicity contract.

## Executed evidence and limits

[coordination-oracle.py](coordination-oracle.py) ran with Python 3.14.3. Its
[recorded output](coordination-oracle-result.json) checks union laws on eight
states and 121 delivery sequences; demonstrates the stock counterexample,
lagging reads, a sequential reservation authority, and duplicate effect counting.
Run it from the repository root:

```sh
python3 docs/research/distributed-systems-followup/2026-10-01/coordination-oracle.py
```

These are finite in-memory examples. They demonstrate neither crash-safe
receipts nor a real datastore's transaction guarantees. Implementation needs
controlled concurrent sessions and checks at its actual mutation/effect boundary.

Fit: a conditional reference in `concurrency-correctness`, shared conceptually
with `stream-processing-design` finality. No new agent or independently installable
skill is justified yet; the existing specialists already own these decisions.
