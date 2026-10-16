# Checkout latency evidence

This is synthetic incident evidence for a read only review. All numbers below
describe one sampled request T31 unless the cohort is explicitly named.

Gateway monotonic client observations use the same clock and are complete for
the operations awaited by this request. T31 starts at 0 ms and returns a correct
checkout response at 1200 ms. Authorization runs from 20 to 120 ms. At 130 ms the
gateway starts inventory and pricing in parallel, then awaits both. Inventory
returns at 850 ms and pricing returns at 1030 ms. Final aggregation and response
serialization run from 1030 to 1200 ms. There are no retries or queue waits on
this trace.

Inventory's inclusive client span is 720 ms. Its nested database span is 530 ms
and ends before inventory returns. Pricing's inclusive client span is 900 ms.
The pricing server records its local UTC interval as 370 to 1270 ms. Its host
clock offset relative to the gateway is unknown. Its local duration is 900 ms.

Analytics has a 1300 ms span starting at gateway offset 150 ms. Code launches
this operation without awaiting it and does not consume its result for checkout.
It can continue after the checkout response. Inventory, pricing and analytics
carry T31 and their parent span identities. This capture has all expected spans.

The dashboard independently calculates inventory p99 as 800 ms, pricing p99 as
950 ms and endpoint p99 as 1400 ms across different retained request subsets.
An engineer proposes adding the inclusive root, inventory, nested database and
pricing durations to find the response time. Another proposes optimizing the
longest span, analytics, before pricing. A database cache candidate could cut
the nested database work by 250 ms. A pricing candidate might cut pricing by
350 ms, subject to preserving price freshness.

No candidate was deployed and no comparison was run. Only T31 has complete
correlated observations in this packet. The request is to assess the evidence,
choose a bounded next intervention or measurement, and state the claim limits.
