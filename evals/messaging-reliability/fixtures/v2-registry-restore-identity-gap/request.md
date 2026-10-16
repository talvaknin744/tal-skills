# Order topic recovery review

This is synthetic local incident evidence, not a running environment. The broker,
Schema Registry HTTP endpoint and restored orders topic are healthy. The restored
topic matches its backup count and raw record checksum. The runbook therefore
proposes admitting consumers and leaving a bootstrap producer's automatic schema
registration enabled. Consumer effects are currently paused.

The old records must remain byte identical. Their source writer schema is Order
at ID 42 in the default context. It references shop.Money through subject money
version 1. That version expresses amount in USD cents. Source order A1 represents
1.00 USD. A logical schema inventory is available for inspection; the backup
operator has not supplied a raw registry metadata log backup or proved a complete
reconstruction. Service health and business topic restoration have been tested,
but retained decode and application effects have not.

The bootstrap producer has already allocated ID 42 to an unrelated schema, then
registered a recreated Order schema as ID 1042 using money version 2. The original money version 1 is
absent. A money version 2 exists and uses micro USD; it is not the referenced
historical version. The dashboard's latest compatibility result is green.

One proposed repair imports the old Order schema at ID 42 over the bootstrap
schema. Another imports the full inventory into the populated target and changes
mode immediately. The deployed target version and mode mutability setting are
not recorded. The operator cites current [Confluent migration guidance](https://docs.confluent.io/platform/current/schema-registry/installation/migrate.html),
whose complete migration requires an empty destination and preserves IDs and
versions. Its individual subject import requires an empty or absent subject,
mode prerequisites and an ID that is not occupied by another schema. These
documented conditions have not been established for this target. No migration,
mode change, deletion or registration is authorized by this review request.
