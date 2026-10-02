For `["anna", "ben", "anna", "cy"]`, `rotate_once` returns `["ben", "cy", "anna"]`. The `set` removes the repeated `"anna"`, and `sorted` changes the original order.

The smallest correction is to replace `ordered = sorted(set(labels))` with `ordered = labels` in [rotate.py](../final-project/rotate.py). The existing rotation then returns `["ben", "anna", "cy", "anna"]`, as required. Both files remain unchanged.
