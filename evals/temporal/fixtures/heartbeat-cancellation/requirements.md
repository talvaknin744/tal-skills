# Archive Activity

The archive Activity copies 10,000 objects to a destination supporting
idempotent put by object key and checksum. List order is stable for the immutable
manifest. The current Activity has a 15-minute Start-To-Close timeout, no
Heartbeat timeout, and ordinary retries. A full copy can take three hours.

Operations cancel a Workflow to stop a mistaken tenant export. The Worker
adapter below never reports progress or checks cancellation. A timeout does
not forcibly stop the running network calls. Retried Activity attempts may
overlap a slow previous attempt. A copied object remains after cancellation;
the business wants further copying to stop promptly and cleanup to be tracked,
not a promise that already written objects never existed.

The installed SDK supports progress heartbeats, retrieving heartbeat details
on retry, and a cancellation signal delivered through its Activity context;
its exact version and cancellation defaults are not supplied. Review only.
