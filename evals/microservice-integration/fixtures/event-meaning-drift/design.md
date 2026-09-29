# Payment event evolution

The billing stream currently publishes PaymentCompleted with payment_id, order_id, amount_cents, and currency. Its documented meaning is that funds were captured. Fulfillment releases goods on this event. Analytics archives and replays events for 90 days. A new payment provider separates authorization from capture, which can fail later.

A proposal keeps the event name and fields but publishes PaymentCompleted immediately after authorization; the code comment calls authorization completion. The team will add optional capture_status, initially "pending", and argues that adding an optional field is backward compatible. The current Fulfillment consumer ignores unknown fields, so it will continue acting on PaymentCompleted. Replayed old events have no capture_status. Provider-specific retry or deduplication behavior is outside this decision; the concern is the meaning of the integration contract.
