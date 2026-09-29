# Rental application design review

This is one application and one relational database. The requested change is to
make pricing and eligibility rules easier to change. HTTP endpoints and a nightly
batch both call application operations. No service split is planned.

`quoteRental`, `extendRental`, and `replaceVehicle` are transaction scripts. Each
loads Rental, Vehicle, Customer, and tariff rows. Each implements its own copy of
the following rules: prepaid kilometers versus distance charges; day/week price
caps; rate changes across the rental interval; age restrictions by vehicle group;
and the interaction between replacement eligibility and an existing extension.
Two recent changes required all three scripts to change. The batch retained an
older weekly-cap calculation after the endpoints were corrected.

A rental's price is calculated from dated tariff segments and distance bands.
These values span `rental`, `rental_segment`, `tariff_period`, and `distance_band`
tables. Existing handwritten mapping code loads those rows into input records.
Database access is already isolated in `RentalStore`; it can save the changed
rental and its segments within a transaction supplied by the caller. The team
can extend this mapping and is comfortable testing ordinary objects or functions.
There is no ORM and no shared mutable Record Set API or record-set UI toolkit.

Separate staff-note and vehicle-color administration each contain one small
script: validate two fields, execute one update, return the updated record. They
have no pricing or rental-policy logic. Their tests are stable.

The proposed redesign would convert every script to a per-table Table Module,
introduce an ORM, and add a new service layer containing all pricing conditions.
The proposal argues that Table Module means any class with the name of a table,
and that enterprise software should use one pattern consistently everywhere.

Recommend a focused structure and migration seam. No dependency additions or
code changes are authorized in this review. Preserve existing transaction and
public API behavior unless a concrete defect requires a separately stated change.
