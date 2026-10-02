CREATE TABLE generations (name text PRIMARY KEY, admitted boolean NOT NULL);

CREATE TABLE jobs (
    id text PRIMARY KEY,
    manifest jsonb NOT NULL,
    input_hash text NOT NULL,
    input_schema integer NOT NULL,
    checkpoint_schema integer NOT NULL,
    semantics text NOT NULL,
    checkpoint integer NOT NULL DEFAULT 0 CHECK (checkpoint >= 0),
    epoch bigint NOT NULL DEFAULT 0 CHECK (epoch >= 0),
    owner text,
    generation text REFERENCES generations(name),
    lease_until timestamptz,
    deadline timestamptz NOT NULL,
    completed_at timestamptz,
    claims integer NOT NULL DEFAULT 0,
    maintenance_handoffs integer NOT NULL DEFAULT 0,
    infrastructure_interruptions integer NOT NULL DEFAULT 0,
    business_failures integer NOT NULL DEFAULT 0,
    business_budget integer NOT NULL DEFAULT 3 CHECK (business_budget > 0),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','completed','business-failed','deadline-exceeded')),
    CHECK (business_failures BETWEEN 0 AND business_budget),
    CHECK ((owner IS NULL) = (lease_until IS NULL)),
    CHECK ((owner IS NULL) = (generation IS NULL))
);
CREATE TABLE receipts (
    job text REFERENCES jobs(id), step integer NOT NULL,
    amount integer NOT NULL, input_hash text NOT NULL,
    PRIMARY KEY (job,step)
);
CREATE TABLE totals (job text PRIMARY KEY REFERENCES jobs(id), value bigint NOT NULL DEFAULT 0);

CREATE FUNCTION preserve_interpretation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF ROW(NEW.manifest,NEW.input_hash,NEW.input_schema,NEW.checkpoint_schema,NEW.semantics)
       IS DISTINCT FROM
       ROW(OLD.manifest,OLD.input_hash,OLD.input_schema,OLD.checkpoint_schema,OLD.semantics) THEN
        RAISE EXCEPTION 'retained input and checkpoint interpretation are immutable'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_interpretation BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION preserve_interpretation();
