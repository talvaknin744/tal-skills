# Proposed release

Keep both region APIs available during a partition. Each checks that its local
remaining quantity is positive, then inserts its unique operation ID in the set.
The region update is atomic and retry delivery uses the same operation ID.

The replicas eventually have identical reservation sets. Idempotent union and
unique IDs should mean the global acceptance rule holds too. If the displayed
quantity briefly differs between regions, require all display reads to contact a
primary and wait five seconds before trying another reservation. Treat passing
the local arithmetic script as sufficient evidence to ship the acceptance path.
