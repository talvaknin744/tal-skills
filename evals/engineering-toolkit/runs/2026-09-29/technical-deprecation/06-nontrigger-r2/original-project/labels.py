"""Small local label formatter."""
__all__ = ["format_label"]


def _old_label(prefix, value):
    return str(prefix) + ":" + str(value)


def format_label(prefix, value):
    if not isinstance(prefix, str) or not prefix.strip():
        raise ValueError("prefix must be a nonempty string")
    if not isinstance(value, int) or isinstance(value, bool):
        raise ValueError("value must be an integer")
    return f"{prefix.strip()}: {value:,}"
