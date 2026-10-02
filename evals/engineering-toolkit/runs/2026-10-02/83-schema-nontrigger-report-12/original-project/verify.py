"""Protected exact-text check; this does not execute SQL."""

from pathlib import Path

EXPECTED = (
    "-- Add the order status representation for existing orders.\n"
    "-- Executed separately by the project's normal migration tooling.\n"
    "ALTER TABLE orders ADD COLUMN status_code SMALLINT;\n"
)

actual = Path("migration.sql").read_text()
assert actual == EXPECTED, "requested comment differs or unrelated text changed"
print("comment text verified; no SQL executed")
