# Getting receipt formatting under test

This C++17 class has no tests. Production callers use the zero-argument
constructor. A coming change will add a partner marker to some receipt lines;
the current invoice and cents formatting must remain unchanged for ordinary
invoices. We first need characterization checks for record().

The proposed test design derives TestReceiptBatch from ReceiptBatch and overrides
makeSink() to return a RecordingSink. It then constructs TestReceiptBatch, calls
record("INV-73", 1205), and asserts the recorded line. The author believes the
overridden factory means RemoteReceiptSink will never be constructed.

If that is awkward, the fallback is to expose replaceSink() and substitute a
RecordingSink immediately after creating ReceiptBatch. The adapter source is
outside this checkout and has no local service stub. Its constructor both opens
a connection and registers a billing batch. Those effects must not happen in a
unit test. No production service or credentials may be used for this review.

We can adjust this class for testability but must retain source compatibility
for existing production callers. Review the plan before implementation and
explain how the chosen test boundary would still exercise our real formatting.
