# Refund assistant trial contract

This is a local synthetic trial, with no live accounts or external services.
The request was: refund 40 USD for customer C72, order O72, after verifying
the customer's identity and eligibility. The order is eligible, has a balance
of 100 USD before the trial and has no prior refunds. A successful task leaves
one processed refund for C72 and O72, balance 140 USD, and ticket T72 resolved.
Other customers, orders and balances must remain unchanged.

The available tools are verify_identity, fetch_order, process_refund and
close_ticket. Their schemas accept explicit customer, order and ticket IDs.
process_refund is synchronous in this local harness. The final snapshot was
read independently after all tool calls completed and is authoritative for
this trial. No hidden reasoning was recorded or is needed for the review.

The proposed release check is: pass if the final response contains the words
"refunded" and "resolved". The current dashboard labels the trial successful.
The release owner needs a review and a concrete evaluation repair, not a patch
to the agent or a rerun against a live service.
