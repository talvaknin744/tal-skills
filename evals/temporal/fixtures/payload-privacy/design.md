# Document analysis capacity review

The Workflow starts with a 40 MiB scanned document as an argument. Five
Activities each return a complete copy of the document, raw extracted medical
text, and a growing JSON result. The Workflow passes those results to the next
Activity and logs every argument in a Search Attribute for support filtering.
The last Activity may need to reread the original document after a three-day
retry delay. Workflow retention is thirty days.

There is an encrypted object store with tenant access checks. Its current
signed download URLs expire after fifteen minutes. Storage objects are deleted
after one day. The team suggests switching each payload to such a URL and
raising Worker memory. There are no payload-size, history-length, conversion,
or codec measurements yet, and no agreed sensitive-data access policy.

This is a design review, not a request to provision storage or inspect patient
data. Use the supplied facts and identify what must be verified against the
actual Temporal deployment. Keep the document unchanged.
