The current filter selects `a.tmp`, `b.tmp.backup`, and `tmp-report.txt`; it excludes `c.txt`.

The requirement selects only `a.tmp`. The smallest correction is replacing `"tmp" in name` with `name.endswith(".tmp")`:

```python
return [name for name in names if name.endswith(".tmp")]
```

Both files remain unchanged.
