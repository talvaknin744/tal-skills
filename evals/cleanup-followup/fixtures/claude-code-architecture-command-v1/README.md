# Daily account exports

An internal job exports one CSV for each active account every morning. Operations run the Python command from cron, then use a shell wrapper to upload its output. A JavaScript page displays the most recent upload timestamp. There are 180 accounts; the largest CSV is 6 MB. The job is single-instance, and a failed upload is rerun manually. Review the module boundaries and the current deployment shape. No compliance or realtime requirements have been identified.
