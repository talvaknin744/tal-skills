For `["anna", "ben", "anna", "cy"]`, [rotate.py](../final-project/rotate.py) returns `["ben", "cy", "anna"]`: `set` removes the repeated `"anna"`, then `sorted` changes the order.

The smallest correction is to replace line 2 with `ordered = labels`. The existing return statement then produces the required `["ben", "anna", "cy", "anna"]`. Both files remain unchanged.
