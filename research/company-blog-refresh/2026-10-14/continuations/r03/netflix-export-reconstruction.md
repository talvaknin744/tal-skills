# Netflix r03 historical export reconstruction

An offline replay reconstructed the exports bound by 18 earlier checkpoint reports. Every checkpoint passed four checks: the pending frontier hash, the exact body event byte prefix hash, the retained immutable summary hash and the processed source count. No source claim was weakened, and the running collector and network state were unchanged.

The replay uses the carried source state and append only discovery and source disposition events through each checkpoint timestamp, with the original serialization format. Each accepted body export is the exact retained byte prefix identified by that checkpoint's occurrence count. Frozen inputs, reconstruction source, checkpoint reports and accepted reconstructed exports are preserved as lossless gzip objects with original and compressed byte hashes.

These are explicitly reconstructed exports. They do not establish that direct snapshots existed at the earlier time. The companion JSON binds the detailed results and the remaining observation gap. Independent reconstruction audit remains pending.
