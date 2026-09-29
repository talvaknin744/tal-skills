The ticket needs only a CSV branch in [export.py](/tmp/tal-skill-trials-20260929/24-code-and-docs-cleanup-new-export-format-r2/workspace/project/export.py):

```diff
 def export_rows(rows, format_name):
     if format_name == "json":
         return to_json(rows)
+    if format_name == "csv":
+        return to_csv(rows)
     raise ValueError("unsupported format")
```

This preserves JSON behavior and the unsupported-format error. All files remain unchanged; no external services were used.
