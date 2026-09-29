# Customer API release evidence

The Customer API is available to internal apps and external partners. Its current response has customer_id, email, and display_name. The proposed version removes email and renames customer_id to id at the same endpoint. Consumer contract tests cover the web app and billing worker; both have already migrated to id and no longer use email. Those tests pass, as do provider unit tests.

Three known partners have not supplied contracts, and older API keys still receive traffic that is not attributed to a specific consumer version. No public deprecation date was announced. The deployment team proposes treating the passing contract suite as proof that the change is safe for all consumers. A rollback can restore the old fields, but failed partner processing during the interval may need manual replay. The user is asking about test evidence and release confidence, not a new test framework.
