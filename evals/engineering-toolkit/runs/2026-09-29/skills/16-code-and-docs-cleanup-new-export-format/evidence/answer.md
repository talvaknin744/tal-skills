The smallest change is two lines in [export.py](/tmp/tal-skill-trials-20260929/16-code-and-docs-cleanup-new-export-format/workspace/project/export.py):

```diff
 def export_rows(rows, format_name):
     if format_name == "json":
         return to_json(rows)
+    if format_name == "csv":
+        return to_csv(rows)
     raise ValueError("unsupported format")
```

This delegates CSV to the helper specified by the ticket, preserving JSON behavior and the unsupported-format error.

All files remain unchanged. No external services used; tests were not run.
