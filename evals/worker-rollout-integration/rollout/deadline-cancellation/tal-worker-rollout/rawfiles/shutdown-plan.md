# Proposed procedure

Use on_stop for both SIGTERM and Cancel export. Its cancelled status confirms the
native call has stopped. Wait 75 seconds after SIGTERM, then allow eight seconds
each for checkpoint and release. ACK in finally lets the successor finish the
remaining work. A timeout is a failed mutation and needs only a log line.

After the process exits, the Deployment is complete and cleanup belongs to the
replacement worker. If the old local lease check passed before publication, the
old worker's eventual output is valid even if another host has claimed the job.
