CREATE TABLE coverage (
  ward text NOT NULL,
  doctor text NOT NULL,
  on_call boolean NOT NULL,
  PRIMARY KEY (ward, doctor)
);

-- Each request substitutes its own :doctor; both use :ward = 'east'.
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) AS remaining FROM coverage WHERE ward = :ward AND on_call;
-- Application checks remaining > 1; otherwise it rolls back and rejects.
UPDATE coverage SET on_call = false WHERE ward = :ward AND doctor = :doctor;
-- Application calls sendTimeOffEmail(:doctor) here, outside the database.
COMMIT;

-- Existing retry handler:
-- If the final COMMIT reports serialization_failure, reconnect and issue COMMIT
-- again. It does not repeat the SELECT or UPDATE.
