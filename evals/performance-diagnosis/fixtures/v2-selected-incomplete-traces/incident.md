# Latency investigation after trace pipeline changes

This is synthetic incident evidence for a read only review. The endpoint has an
independently recorded histogram covering every completed request before trace
sampling, with separate success and timeout outcomes. In a ten minute incident
window it records 48000 successes, 2000 timeouts and success p99 of 880 ms.
Arrival and unfinished request counts are available in another dashboard but
were not exported into this packet.

The SDK at the gateway uses a parent based ratio sampler with a 2 percent root
decision. Child SDKs honor the parent's sampling flag. The Collector receives
only exported spans. Its tail processor retains every received trace containing
an error or a duration above 700 ms, plus 1 percent of the remaining received
traces. The dashboard calculates p99 of 1700 ms over these retained traces and
labels it Endpoint p99.

The Collector has finite pending trace storage and a finite decision cache.
Its early eviction counter increased during the incident. A recovered collector
log identifies a database child for T88 arriving after its trace decision was
removed from the cache. Export queue drops are also recorded. Exact component
versions and the late span handling configuration are not in this packet.

For a timeout T88, application logs record issuing a database call and ending
the request 950 ms later. The displayed T88 trace has a root and an HTTP pricing
child, with no database child. Database completion, cancellation and connection
reuse for T88 are not recorded in this packet.

An incident note says the missing database span proves there was no database
work. It also says the tail rule guarantees retention of every slow endpoint
request, including requests dropped at the SDK. A proposed release note says
the endpoint population p99 is now 1700 ms and blames pricing exclusively.

No production configuration change or runtime test is authorized. Determine the
supported conclusions and the smallest evidence repair or discriminating check.
