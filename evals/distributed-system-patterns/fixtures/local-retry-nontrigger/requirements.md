# Local status parser

A command-line script reads a status JSON file from the local filesystem. There
are no network calls, workers, containers, or shared state. Its parser currently
retries malformed JSON three times against the same unchanged string.

For this small cleanup, keep successful parsing unchanged and return the parse
error immediately on malformed JSON. The caller already prints the error and
sets a nonzero process exit status. This is a review request, so no files should
change.
