CREATE TABLE generations (
    name text PRIMARY KEY,
    admitted boolean NOT NULL,
    schema_version integer NOT NULL
);

CREATE TABLE jobs (
    id text PRIMARY KEY,
    manifest jsonb NOT NULL,
    input_hash text NOT NULL,
    schema_version integer NOT NULL DEFAULT 1,
    checkpoint integer NOT NULL DEFAULT 0 CHECK (checkpoint >= 0),
    epoch bigint NOT NULL DEFAULT 0 CHECK (epoch >= 0),
    owner text,
    lease_until timestamptz,
    deadline timestamptz NOT NULL,
    claims integer NOT NULL DEFAULT 0,
    maintenance_handoffs integer NOT NULL DEFAULT 0,
    infrastructure_interruptions integer NOT NULL DEFAULT 0,
    business_failures integer NOT NULL DEFAULT 0,
    business_budget integer NOT NULL DEFAULT 3 CHECK (business_budget > 0),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'business-failed',
                          'deadline-exceeded', 'quarantined')),
    CHECK ((owner IS NULL) = (lease_until IS NULL))
);

CREATE TABLE effects (
    job text NOT NULL REFERENCES jobs(id),
    step integer NOT NULL CHECK (step >= 0),
    amount integer NOT NULL CHECK (amount > 0),
    input_hash text NOT NULL,
    PRIMARY KEY (job, step)
);

CREATE TABLE totals (
    job text PRIMARY KEY REFERENCES jobs(id),
    value bigint NOT NULL DEFAULT 0
);

-- A retained cursor is meaningful only against the same input and interpretation.
CREATE FUNCTION preserve_job_input() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF ROW(NEW.manifest, NEW.input_hash, NEW.schema_version)
       IS DISTINCT FROM ROW(OLD.manifest, OLD.input_hash, OLD.schema_version) THEN
        RAISE EXCEPTION 'job input and checkpoint schema are immutable'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER immutable_job_input
BEFORE UPDATE OF manifest, input_hash, schema_version ON jobs
FOR EACH ROW EXECUTE FUNCTION preserve_job_input();
