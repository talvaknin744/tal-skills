# Purchase assistant

Each purchase has immutable tenantId and requestId. Activities may execute again
after a timeout or lost completion acknowledgement. A completed Activity
result is durable in orchestration history; local intermediate variables in a
failed Activity are not.

Supplier.placeOrder(items, key) deduplicates identical arguments under the same
key for seven days and rejects changed arguments with the same key. Automatic
recovery lasts at most one day. One purchase request may place one order.
Every model request can cost up to $0.20, including requests whose responses
are lost. The model API has no request deduplication or usage lookup. Spending
for one logical purchase must stay at or below $1 across crashes and retries.

Incident: Supplier accepted an order. The summary model call was billed, but
its response was lost. runGraph retried and selected different items.
Review the orchestration and budget design. No provider or Temporal execution
logs are supplied. Keep the files unchanged.
