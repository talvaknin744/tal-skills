"""Format a label from immutable caller-supplied values."""


def format_label(name, revision):
    return f"{name} (v{revision})"
