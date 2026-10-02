For `["anna", "ben", "anna", "cy"]`, `rotate_once` returns `["ben", "cy", "anna"]`. The `set` removes the repeated `"anna"`, and `sorted` changes the input order.

The smallest correction is to rotate the list directly:

```python
def rotate_once(labels):
    return labels[1:] + labels[:1]
```

That returns `["ben", "anna", "cy", "anna"]` as specified. Both files are unchanged.
