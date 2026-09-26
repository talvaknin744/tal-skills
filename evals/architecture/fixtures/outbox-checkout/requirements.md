# Checkout service

An accepted order must eventually produce an `order.created` event. The inventory consumer uses the event to reserve stock. A request can be retried after a timeout. The SQL database supports transactions; the event broker is a separate service. There is no distributed transaction coordinator. The system must tolerate a broker outage lasting 30 minutes without losing accepted orders. The consumer currently reserves stock whenever it receives a message, without recording processed event IDs.
