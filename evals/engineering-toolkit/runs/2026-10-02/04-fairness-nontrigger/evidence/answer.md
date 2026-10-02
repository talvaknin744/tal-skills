`rotate_once` currently returns `["ben", "cy", "anna"]`: `set(labels)` removes the repeated `"anna"`, and `sorted(...)` changes the order.

The smallest correction is to rotate the original list:

```python
return labels[1:] + labels[:1]
```

For the supplied labels, that returns `["ben", "anna", "cy", "anna"]`. Both files remain unchanged.
