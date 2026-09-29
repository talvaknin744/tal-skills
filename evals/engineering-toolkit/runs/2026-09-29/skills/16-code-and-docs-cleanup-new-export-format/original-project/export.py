def export_rows(rows, format_name):
    if format_name == "json":
        return to_json(rows)
    raise ValueError("unsupported format")
