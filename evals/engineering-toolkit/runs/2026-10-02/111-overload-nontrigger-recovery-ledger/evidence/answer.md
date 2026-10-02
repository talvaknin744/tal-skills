For the supplied labels, `rotate_once` returns `["ben", "cy", "anna"]`. The `sorted(set(labels))` step removes the repeated `"anna"` and changes the order.

The smallest correction is to change that line to `ordered = labels`, leaving the return line as it is. It then returns the required `["ben", "anna", "cy", "anna"]`. Both files remain unchanged.
