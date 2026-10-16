# Sources and scope

Checked 2026-09-29. These are conditional engineering references, not claims that every broker implements the same protocol. Verify the deployed version before changing configuration. No book or article code was copied.

| Source | Material read and useful boundary |
| --- | --- |
| [Confluent: Error handling patterns in Kafka](https://www.confluent.io/blog/error-handling-patterns-in-kafka/) (2021-05-21) | Complete article. Retry/redirect routing can preserve related-message order; the sketch leaves atomic recovery and reassignment decisions to the application. |
| [RabbitMQ: At-least-once dead lettering](https://www.rabbitmq.com/blog/2022/03/29/at-least-once-dead-lettering) (2022-03-29) | Complete article, including examples and caveats. Historical 3.10 feature introduction; current 4.3 documentation governs configuration. |
| [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms) and [quorum queues](https://www.rabbitmq.com/docs/quorum-queues) | Relevant acknowledgement, dead-letter, delivery-limit, and persistence sections, current 4.3. The local example runs 4.3.0 with a classic queue; quorum and dead-letter behavior were not executed. |
| [NATS: Per-subject discard policy](https://nats.io/blog/new-per-subject-discard-policy/) (2022-11-14) | Complete article, including deletion and republication example. Rejection depends on retained state; historical cross-product comparisons were not adopted. |
| [NATS publishing](https://docs.nats.io/learn/jetstream/publishing), [retention](https://docs.nats.io/learn/jetstream/shaping-the-stream), [stream API](https://docs.nats.io/reference/jetstream/api/stream/create) | Relevant outcome, retention, and configuration sections; stream API displayed 2.15. Missing PubAck can be an unknown outcome. Inspect supported persistence mode; no NATS runtime test was performed. |
| [Kafka design](https://kafka.apache.org/43/design/design/) and [KafkaConsumer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html) | Transaction, compaction, consumer-position, and concurrent-processing sections; 4.3 documentation/API page displayed 4.3.1. No Kafka cluster was run. |
| [Pulsar messaging](https://pulsar.apache.org/docs/4.2.x/concepts-messaging/) | 4.2 retry, negative-acknowledgement, subscription, and dead-letter sections. Retry-topic guidance has subscription-specific limits; no Pulsar runtime test was performed. |
| [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html) | Relevant event ID and aggregate key fields; stable page displayed 3.6. No connector deployment was performed. |
| [Schema Registry evolution](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html) | Relevant compatibility and transitivity sections. Registry validation was not run; historical fixture tests remain an application responsibility. |
| [Uber: Disaster Recovery for Multi-Region Kafka](https://www.uber.com/us/en/blog/kafka/) (2020-12-21) | Complete article prose and diagram captions. Custom aggregation and offset mapping motivate a conditional recovery check; this is not the default MirrorMaker topology. |
| [Kafka MirrorMaker configuration](https://kafka.apache.org/43/configuration/mirrormaker-configs/) and [geo-replication](https://kafka.apache.org/43/operations/geo-replication-cross-cluster-data-mirroring/) | 4.3 offset-sync/checkpoint prerequisites, target-group conditions, filters, exactly-once configuration, and monitoring sections. No MirrorMaker deployment or failover was executed. |
| [Segment: Delivering billions of messages exactly once](https://www.twilio.com/en-us/blog/insights/exactly-once-delivery) (2017-06-29) | Complete implementation retrospective, including abandoned design, capacity eviction, and output reconciliation. Historical observations do not establish a present service guarantee or arbitrary external-effect atomicity. |
| [Segment duplicate data](https://www.twilio.com/docs/segment/guides/duplicate-data) and [replay](https://www.twilio.com/docs/segment/guides/what-is-replay) | Complete substantive current pages. Ingress/destination deduplication differ; replay/resync, filters, and disabled-destination behavior are product-specific. No Segment runtime was exercised. |
| [Trigger.dev regional incident](https://trigger.dev/blog/incident-report-jun-22-2026) (displayed 2026-06-22; incident continued June 23), [run states](https://trigger.dev/docs/runs), and [queues](https://trigger.dev/docs/queue-concurrency) | Complete incident and relevant current state/concurrency/TTL sections. Pre-execution reservations motivate a failure schedule; planned mitigations are not evidence of shipped behavior. No scheduler or capacity test was executed. |

Research also read Temporal's [automated worker versioning example](https://temporal.io/blog/automated-worker-versioning-with-github-actions) (2026-09-09) and current [Worker Versioning documentation](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning). Those operational decisions belong in deployment/Temporal skills: keeping compatible pinned workers and recovering already-pinned executions are distinct from changing traffic for new runs.

## Schema registry identity

Rechecked 2026-10-15 against current official Confluent documentation. These
pages are mutable contracts, the deployed registry, client and serializer versions
govern an implementation. No registry, import, restore or SDK decoding was executed.
The conditional reference's admission and business invariant checks are authored
synthesis, not outcomes reported by these sources.

| Source | Material read and limits |
| --- | --- |
| [Schema contexts](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html) and [client FAQ](https://docs.confluent.io/platform/current/schema-registry/faqs-cp.html) | Context ID and subject scope, qualified subjects, explicit context paths and client lookup differences. Client support must be checked on the installed version, the FAQ is not a universal language capability matrix |
| [Registry deployment](https://docs.confluent.io/platform/current/schema-registry/installation/deployment.html) | Kafka metadata source and backup/restore sections, including subject/version, ID metadata, compatibility and raw byte backup. Tutorial commands and production recovery were not executed |
| [Schema migration](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html) and [API reference](https://docs.confluent.io/platform/current/schema-registry/develop/api.html) | Whole registry versus subject import preconditions, ID preservation and collisions, mode scope and schema references. Full manuals were not read, no force mode or merge procedure is prescribed |
| [Serialization formats](https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html) | Payload ID, header GUID and header preservation limits. The guide distinguishes Confluent Platform versions, this package does not upgrade the selected format or assert support for a particular client |

The original Confluent [registry pitfalls article](https://www.confluent.io/blog/17-ways-to-mess-up-self-managed-schema-registry/)
(2019) and [data sharing article](https://www.confluent.io/blog/data-sharing-patterns-with-confluent-schema-registry/)
(2021) were read as complete available recovered text in the 2026-10-14
continuation research. They motivate retained ID authority and collision checks.
Their topology advice, preview labels and historical configuration defaults are
separate from current implementation contracts. Original publication data and
reading receipts remain preserved, diagrams and runtime claims were not reproduced.
