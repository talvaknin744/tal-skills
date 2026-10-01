# Immutable-volume maintenance incident

This is a fictional storage service. Volumes are closed and immutable, each with
100 GiB allocated capacity. Every copied object requires one authoritative
location update. Source retirement is already protected by a separate durable
publication protocol; this review concerns policy, cost, and control. Foreground
reads share metadata, disk, and cell-local network resources with maintenance.

The serving objective is p99 below 100 ms with the current error rate unchanged.
Debt must clear within the project's seven-day recovery horizon. Capacity and
metadata ceilings below are observations for this fixture, not recommended
production settings.

Before the incident, 1,000 volumes were mostly 90% live. After a placement rollout:

| Class | Volume count | Live GiB per volume | Objects per volume |
| --- | ---: | ---: | ---: |
| Dense | 600 | 90 | 50,000 |
| Middle | 150 | 40 | 2,000,000 |
| Tail | 250 | 2 | 2,000,000 |

The new producer closes a volume after a short elapsed interval even when few
bytes have arrived. Under low-byte-rate, small-object input it emits tail volumes.
The team has correlated the new path with the distribution shift but has not yet
reproduced the closure behavior or measured alternative batching latency.

An isolated trial copies all live objects in five source volumes of one class.
It allocates the minimum whole destination-volume count needed for those bytes.
Source capacity becomes reusable only after destinations are allocated:

| Trial | Read/write GiB each | Destination volumes | Gross source capacity retired | Net capacity freed | Metadata updates |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dense | 450 | 5 | 500 GiB | 0 GiB | 250,000 |
| Middle | 200 | 2 | 500 GiB | 300 GiB | 10,000,000 |
| Tail | 10 | 1 | 500 GiB | 400 GiB | 10,000,000 |

The current dense-first worker uses five-source trials like these; 60% of recent
jobs targeted dense inputs. Its dashboard counts gross retired sources and
completed jobs as progress. Temporary destinations remain allocated until
publication and cleanup; interrupted jobs can leave orphan output.

During the incident CPU was 34%, disk utilization 55%, and local network 30%.
Metadata sustained capacity is 200,000 updates/s; foreground alone used about
160,000/s in the measured interval and combined traffic reached 192,000/s.
Foreground p99 rose from 70 ms to 180 ms as metadata waiting grew. One prior
8-to-16-worker trial copied bytes faster but increased metadata queues and p99.
Metrics arrive about three minutes late. No representative mixed-load or
interruption check has been run for the new proposal.
