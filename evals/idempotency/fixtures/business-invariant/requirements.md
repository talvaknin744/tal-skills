# Accepting an invitation

An invitation belongs to one workspace and one verified email address. It can
be accepted once by that address before expiry. A retry may happen after the
database commit but before the HTTP response arrives. Successful retries should
return the membership already created. A different authenticated user must not
receive invitation or membership details. A revoked membership must not be
re-created by replaying an old acceptance.

Everything is stored in one relational database. There are no emails, payments,
events, or external side effects in this path. The existing transaction locks
the invitation, checks current authorization, and returns the stored membership
when the invitation is already accepted. Revocation is a separate operation and
the authorization/accepted branch returns an access error for revoked members.
The existing design has the database constraints below. We have not supplied
concurrency test results. A proposal would add Redis locks, random client keys,
a second response database, and a cleanup worker solely to make acceptance
idempotent.
