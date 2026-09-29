def total_cents(quantity, unit_price_cents, per_unit_discount_cents):
    """Return the total price for a validated line item."""
    return quantity * unit_price_cents - per_unit_discount_cents
