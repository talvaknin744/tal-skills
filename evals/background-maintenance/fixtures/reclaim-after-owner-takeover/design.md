# Paginated backfill and reclamation contract

This fictional store has immutable source generation `S/7`, stable job `J`, and
metadata rows mapping each live object/version to a source or destination. J
backfills live objects into a new destination format, updates serving locations,
and then reclaims S/7. Objects x, y, and z initially have version 1 on S/7.
A user delete creates a tombstone/version increment; a concurrent update of y
creates authoritative version 2 with new bytes on S/8. The backfill must preserve
newer authoritative values. Foreground reads pin a source generation while
reading; a retention hold can also require retaining it.

Supported primitives:

- `claim(J)` is an atomic metadata update. Each successful takeover increments
  the job's ownership epoch. Epoch checks on later operations are explicit.
- `read_live_page(S/7, cursor)` scans current live references by object identity.
  It returns rows, an end cursor, and `has_more`; it supplies no snapshot or
  mutation log. The first page contains x and y, ends at y, and has_more is true
  because z remains. References to existing immutable bytes can be added while
  S/7 is active, including identities sorting before a saved cursor. A cursor
  alone therefore proves neither stable membership nor caught-up coverage.
- `copy_buffered(snapshot, destination)` returns before the destination is crash
  durable. `durable_seal(destination)` returns only after the copied bytes are
  durable and supplies a manifest/checksum record. Output names are unique.
- `metadata_tx` atomically reads/checks and conditionally updates job epochs,
  object versions/locations, tombstones, reader pins, and retention holds in the
  metadata database. It cannot atomically include storage writes or deletion.
- In `metadata_tx`, the application may atomically move a source generation from
  ACTIVE to RETIRED after proving no live metadata reference, reader pin, or
  retention hold still needs it and durable replacement records exist. This
  stores an immutable retirement record and yields a token bound to S/7. All
  reference, pin, and hold admission checks ACTIVE in that same authority;
  retired generations reject new admissions. Reader location resolution and pin
  acquisition are one metadata transaction, closing the acquire/retire race.
- `delete_retired(S/7, token)` checks that retirement record/generation before
  deleting; repeated calls with a valid token are harmless. Volume identities
  may be reused only with a new generation. A valid retirement record remains
  sufficient even when the job owner changes.
- A legacy `force_delete(S/7)` bypasses retirement validation.

The current worker performs:

```text
epoch = claim(J)
page = read_live_page(S/7, saved_cursor(J))
save_cursor_if_epoch(J, epoch, page.end_cursor)
destination = unique_output_name()
copy_buffered(page.rows, destination)
put_locations_unconditionally(page.rows, destination)
force_delete(S/7)
mark_job_done_if_epoch(J, epoch)
```

`put_locations_unconditionally` is an ordinary metadata write. It overwrites
newer locations and tombstones; it does not validate versions, ownership, or
destination durability. The worker can pause after any line. A timeout during
metadata publication may occur after the write committed. An expired owner can
resume even after a successor has claimed J. The final completion epoch check
only rejects writing the completion status. The worker ignores has_more, saves
progress before publication, and declares completion after only one page.

Required outcome: y's authoritative version-2 bytes remain readable after
restart; deleted x stays deleted; z is processed or remains discoverable as
incomplete; pinned readers and retention holds are respected; S/7 is freed only
under its valid retirement proof. Scan completion, accepted publication, and
safe retirement are separate claims. Incomplete work and temporary output must
remain recoverable or safely collectible. No external service, source snapshot,
change-log API, or cross-store transaction is available. A supported fix can use
bounded rescans and conditional per-object publication plus the authoritative
retirement gate; it must state how ongoing admissions affect completion.
