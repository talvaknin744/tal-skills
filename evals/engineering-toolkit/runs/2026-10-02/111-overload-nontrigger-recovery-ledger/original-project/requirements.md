# Local label rotation

A UI preview rotates the following finite list one place left so each displayed
label gets a turn. Preserve order and repeated labels:

`["anna", "ben", "anna", "cy"]` becomes `["ben", "anna", "cy", "anna"]`.

This is one pure local formatting operation, with no jobs, queue service,
resource sharing, tenants, deadline or scheduler. Review the supplied function
only and recommend the smallest correction. Do not change either file.
