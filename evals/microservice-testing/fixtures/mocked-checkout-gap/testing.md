# Checkout test plan

Checkout writes an order and an outbox row in one local transaction. A relay sends OrderPlaced to a broker and marks the row sent after broker acknowledgment. Fulfillment consumes the event and records a reservation. Current unit tests mock the broker send method to return success and call the consumer directly once. They prove fields are mapped correctly but never restart a relay or consumer.

The team proposes replacing these tests with a single end-to-end test that checks the website displays "Order received". A local test broker and disposable database can run in CI. Production failures have included a send acknowledged before the relay crashes and a consumer whose database commit succeeds before message acknowledgment is lost. Reservation has a unique constraint on order_id. An order status view exposes pending or reserved, and the system records outbox age and consumer processing errors.
