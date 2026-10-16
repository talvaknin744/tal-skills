# Netflix r03 checkpoint export retention observation

Earlier checkpoint reports bind pending frontier and body event export files that continue to change. Their exact earlier bytes were not separately frozen at checkpoint creation. Historical bindings therefore require a matching preserved prefix or an explicitly verified reconstruction. The immutable checkpoint summary files do preserve the exact bytes claimed by every summary binding inspected so far.

A separate immutable observation leaf now preserves a coherent later checkpoint, its exact current summary, pending frontier and body event export bytes. Each copied file matches the hash already claimed by that checkpoint. The companion JSON binds this observation and records the historical gap. The running collector source and earlier raw receipts remain unchanged.

Archive completion requires an existing archive inventory and successful checks of its bindings. A generated running false or finalized flag alone is insufficient. This observation is separate from an independent archive audit.
