# Time, lateness, and finality

Choose the clock from the result's meaning. Event time describes when the source says an event occurred; processing time describes when work runs; engine logical time coordinates computation and reads. Record timestamp units, zone, validity, and the authority that assigns them.

Specify window boundaries and output behavior. A changing aggregate can emit replacements or retractions as accepted input arrives. A final row needs a defined completion condition and a policy for later input. If corrections remain permitted after a window first closes, that output remains revisable; give the eventual immutable boundary separately.

Define watermark generation, required input partitions, lag allowance, idle-input handling, and the installed operator's boundary comparison. Trace every required input's progress. A quiet input can hold progress back; advancing wall time alone need not advance a watermark derived from observed event time. Marking an input idle changes the completeness assumption, so document what happens when it resumes with older data.

Give input before the current progress boundary an explicit disposition: accept and revise, produce a compensating/correction record, retract prior output, or drop with an audit and owner. State the accepted horizon and sink representation. A fixed wait is a latency policy, not proof that all events have arrived. Checkpoints and batching barriers can establish durable progress or flush results without establishing event-time finality.

Temporal filters also schedule future additions and retractions. Visible rows, pending updates, and progress state have different lifetimes. Check far-future timestamps and already-expired arrivals separately from normal expiry.

Verify a row immediately before/at/after each time boundary; delayed input while one partition stalls; resumed idle input; and a correction before and after declared finality. Compare intermediate changes and the final materialized result. Engine specifics and current limitations are in [sources.md](sources.md).
