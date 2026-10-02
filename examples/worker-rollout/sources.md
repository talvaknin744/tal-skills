# Primary contracts checked on 2026-10-02

- [PostgreSQL 18 explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html):
  job `FOR UPDATE` locks serialize protected mutations through transaction end;
  generation `FOR SHARE` conflicts with the update used to close admission.
- [PostgreSQL date/time functions](https://www.postgresql.org/docs/18/functions-datetime.html):
  `clock_timestamp()` observes current database time rather than transaction start.
  The protocol reads it after acquiring the job lock.
- [PostgreSQL client timeouts](https://www.postgresql.org/docs/18/runtime-config-client.html):
  statement and lock timeouts are scoped SQL execution bounds. They are not a
  complete cumulative transaction or commit deadline.
- [Psycopg transaction management](https://www.psycopg.org/psycopg3/docs/basic/transactions.html):
  an autocommit connection plus explicit transaction blocks keeps each effect,
  receipt and business-total update together and rolls it back on failure.
- [Python signals](https://docs.python.org/3/library/signal.html) and
  [monotonic time](https://docs.python.org/3/library/time.html): handlers run in
  the main Python thread and may be delayed by C operations. The minimal handler
  records the first deadline; the runtime performs SQL and closes sockets later.
- [Docker PostgreSQL image PGDATA](https://github.com/docker-library/docs/blob/master/postgres/README.md#pgdata):
  PostgreSQL 18's versioned data directory is under `/var/lib/postgresql`, the
  fixture's tmpfs mount. [Docker tmpfs](https://docs.docker.com/engine/storage/tmpfs/)
  establishes that this storage is disposable, not power-loss evidence.
- [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/):
  the fixture publishes to `127.0.0.1`; the documented older-engine L2 caveat is
  why this verifier requires Docker Engine 28 or newer.
- [psycopg 3.3.6 metadata](https://pypi.org/pypi/psycopg/3.3.6/json),
  [psycopg-binary 3.3.6](https://pypi.org/pypi/psycopg-binary/3.3.6/json), and
  [typing-extensions 4.16.0](https://pypi.org/pypi/typing-extensions/4.16.0/json)
  identify the exact Python dependency versions in `requirements.txt`.

The image reference is the existing historical draining fixture's immutable
`postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`.
The author report records the locally observed image digest and server version;
the tag alone is not the pin. This example retains that known fixture rather than
claiming to use whichever image happens to be newest.
