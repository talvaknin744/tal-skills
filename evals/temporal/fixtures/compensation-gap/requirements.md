# Two reservations

A booking must hold both a room and a car or release its holds. Each provider
supports reserve and release by the immutable booking reference. Repeated
reserve returns the same hold; release is idempotent and is safe when no hold
exists. Both providers can be slow or accept an operation before its response
is lost. A release does not cancel a reserve request still in flight. Provider
support can inspect the booking reference; no additional automatic status API
is specified. The providers do not participate in a shared transaction.

The pseudocode uses durable Activities and a compensation list in Workflow
state. On a Workflow-task replay the list is reconstructed from execution.
After Activity retries exhaust, an Activity failure reaches the catch block.
Release Activities may fail transiently too. The system must surface bookings
whose cleanup still needs attention. Do not change the supplied files.
