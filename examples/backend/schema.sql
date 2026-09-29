-- Applied only to the launcher's newly created disposable database.
CREATE TABLE inventory (
  tenant_id text NOT NULL,
  sku text NOT NULL,
  available integer NOT NULL CHECK (available >= 0),
  PRIMARY KEY (tenant_id, sku)
);

CREATE TABLE reservations (
  tenant_id text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type = 'reserve-v1'),
  request_key text NOT NULL,
  reservation_id uuid NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000000),
  PRIMARY KEY (tenant_id, operation_type, request_key),
  UNIQUE (tenant_id, reservation_id),
  FOREIGN KEY (tenant_id, sku) REFERENCES inventory (tenant_id, sku)
);
