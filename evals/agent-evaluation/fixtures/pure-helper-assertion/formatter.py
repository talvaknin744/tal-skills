def format_order_number(number: int) -> str:
    """Return ORD followed by the nonnegative integer in four decimal digits."""
    return f"ORD{number:04d}"
