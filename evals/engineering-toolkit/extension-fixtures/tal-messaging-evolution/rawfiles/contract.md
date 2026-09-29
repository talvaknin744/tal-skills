# Regional cutover review facts

This is an original local model of an application-owned aggregation pipeline. Its
regional aggregate logs can interleave source streams differently. It is **not** a
claim that default MirrorMaker 2 merges multiple source topics into one partition.
All log contents, sequences, group members, and receipts here are synthetic.

Offsets denote the next record to read in the named log/partition/incarnation.
Event IDs and payloads are immutable. Accepted business events are A1, A2, B1, B2.
A durable application ledger shared across regions already records effects for A1
and A2. The specified ledger API atomically checks event ID + payload before an
effect and stores its receipt; replay with identical identity returns that receipt,
while changed payload conflicts. No process implementing that API runs here.
Business acceptance requires all four effects once, no silently skipped records,
and no simultaneous source/target effect owners. The control plane can fence an
owner generation; until confirmed, either region may still be active.

`cutover.json` supplies the proposed starting position, observed log contents, one
translation checkpoint, and target consumer activity. The checkpoint is emitted
by the custom aggregation mapper, not a Kafka commit or automatically installed
consumer position. Its named source/target incarnations, contiguous coverage, and
age must be checked against the cutover contract. An unavailable mapping or missing
accepted event is unresolved evidence, not permission to invent a safe position.
The declared maximum checkpoint age is 120 seconds, measured at the decision time.
A new decision after that window needs refreshed evidence. Group ownership and
fencing records must also be current at the actual switchover.

Deployment notes for the separate MM2 connector: `emit.offset-syncs.enabled=true`;
`sync.group.offsets.enabled=false` today; an operator proposes enabling the latter.
Kafka 4.3 documents that group sync writes translated target offsets only when the
group has no active target consumers. The configuration's default checkpoint and
sync intervals are 60 seconds; they are not an end-to-end freshness SLA. Disabling
offset-sync emission disables the information needed by the checkpoint connector.
Do not treat this configuration change as proof that an application aggregation
checkpoint was translated or installed for this group.

Sources: [Kafka 4.3 MirrorMaker configuration](https://kafka.apache.org/43/configuration/mirrormaker-configs/),
[Kafka cross-cluster replication](https://kafka.apache.org/43/operations/geo-replication-cross-cluster-data-mirroring/),
and [Uber's historical Kafka retrospective](https://www.uber.com/us/en/blog/kafka/).
The historical aggregate example motivates this model; it is not a current MM2
guarantee. Broker transactions or replication exactly-once configuration do not
by themselves establish the application ledger's external-effect behavior.
