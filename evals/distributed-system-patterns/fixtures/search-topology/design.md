# Archive search topology proposal

The searchable index is 768 GiB. Each available machine has 64 GiB of RAM, of
which at most 48 GiB may hold the index. A vendor binary loads a configured
document subset into memory and searches it. It returns every matching document
ID for a conjunction of search terms, with no cross-document dependencies.
The binary cannot be rebuilt. It also exposes counters through a local Unix
socket; our existing monitoring collector accepts an HTTP metrics format.

Every successful query must cover the entire archive. Users require a response
within 300 ms. An explicit failure is acceptable when the complete answer cannot
be produced; silently incomplete search results are not. The workload contains
many distinct queries, so a response cache is not assumed to help.

Proposal A puts 32 identical processes behind a load balancer. Each process
would load the complete index. One process handles each query. The author says
aggregate cluster RAM makes this feasible.

Proposal B splits documents by stable document-ID hash into 64 disjoint shards,
one process per shard. A query coordinator sends the full conjunction to every
shard and unions returned IDs. It returns whatever arrived at 300 ms with HTTP
200. A planned upgrade takes one shard offline at a time. The author says adding
more shards should always improve latency and that all nodes together provide
redundancy.

For this review's estimate only, each leaf request independently takes 2 seconds
with probability 0.01 and 40 ms otherwise. Treat these values as synthetic inputs,
not a production measurement. There is no coordinator benchmark yet.

Each vendor process will also get a companion that converts the socket counters
to HTTP metrics. A proposed client companion would expose a local search URL and
route calls to the coordinator. Neither helper has startup/restart contracts.

We can change the topology and configure the vendor binary, but this review
does not authorize deployments or traffic experiments.
