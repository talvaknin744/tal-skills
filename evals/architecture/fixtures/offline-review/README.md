# Notification dispatcher

This project runs one scheduled dispatcher process. The dispatcher finds unsent notifications, sends an email, and marks the row sent. After a process failure the scheduler starts it again. Duplicate emails are undesirable but not catastrophic. A missed notification is unacceptable. The mail provider supports an idempotency key, but this application does not currently send one. No additional workers are planned this quarter.
