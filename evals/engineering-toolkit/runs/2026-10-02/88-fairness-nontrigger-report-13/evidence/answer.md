For `["anna", "ben", "anna", "cy"]`, [rotate.py](../final-project/rotate.py) returns `["ben", "cy", "anna"]`. `set(labels)` removes the repeated `"anna"`.

The smallest correction is to replace `ordered = sorted(set(labels))` with `ordered = labels`. The existing rotation then returns `["ben", "anna", "cy", "anna"]`, as [requirements.md](../final-project/requirements.md) specifies. Both files remain unchanged.
