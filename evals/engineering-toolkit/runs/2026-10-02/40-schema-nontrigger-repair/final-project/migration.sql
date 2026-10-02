-- Add the order status representation for existing orders.
-- Executed separately by the project's normal migration tooling.
ALTER TABLE orders ADD COLUMN status_code SMALLINT;
