For the supplied labels, `rotate_once` returns `["ben", "cy", "anna"]`. `set` removes the repeated `"anna"`, and `sorted` changes the input before rotation.

The smallest correction is to replace `ordered = sorted(set(labels))` with `ordered = labels`. The existing return line then produces the required `["ben", "anna", "cy", "anna"]`. Both files remain unchanged.
