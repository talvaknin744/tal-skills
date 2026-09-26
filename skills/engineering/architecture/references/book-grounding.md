# Book grounding

Use books when requested or when a specific source materially clarifies a decision. Book attribution supplements architecture evidence. It does not prove runtime behavior or reveal which documents a model was trained on.

## Establish support

Select only works relevant to the question. There is no minimum count unless the user specifies one. Start with a small set and add a book only for a distinct unresolved concern. Respect a requested title; if it cannot be verified, explain that limitation instead of silently substituting another.

Treat recalled titles, editions, chapters, and practices as search leads. Confirm identity against the publisher or author and confirm the attributed practice against accessible source material that actually supports it. A table of contents can establish chapter names, but is insufficient on its own to establish a detailed practice. Use user-provided lawful excerpts or accessible previews where appropriate; a complete book copy is not required.

For each attribution, record the exact title, author, edition, source URL and locator, supported practice in your own words, relevant system evidence, and the decision it informs. Keep quotations brief. When a practice cannot be verified after one targeted attempt to correct the attribution, drop the book authority. A separately supported architecture finding can remain, clearly grounded in its own evidence. If strict book verification is required, record the unmet requirement and keep that book-based conclusion unresolved.

## Optional librarian handoff

A separate librarian is useful when selecting sources is substantial independent work. It is optional; direct verification is sufficient for a small source set. Send the problem and constraints without proposed conclusions. The librarian returns identity, fit, and locatable sources; the coordinator verifies them before using them. Do not request private familiarity tests or claims about training-set membership.

If exchanging JSON, use the following interfaces. These records support each book-guided role; they are not mandatory records for ordinary architecture analysis.

- [Book request](contracts/book-request.schema.json): selection question, role, request ID, request kind, and excluded editions; replacements name the existing book ID.
- [Book response](contracts/book-response.schema.json): echoes the request metadata and returns selected sources or an explicit unavailable result. A replacement response contains exactly one book.
- [Accepted books](contracts/accepted-books.schema.json): the coordinator's complete validated selection with stable book IDs. This is a different record from the librarian's response.

For a replacement, verify the response matches the request and role, reject previously excluded editions and duplicate identities, replace the named slot, and retain its ID. Other IDs remain unchanged. The accepted collection may contain several books even though the replacement response contains one. An unavailable response leaves the existing collection unchanged; it does not make the rejected slot usable. Mark that slot unresolved or remove it from the report.

One initial request plus one targeted correction or replacement attempt is the limit for an unresolved selection in a run. Do not evade that limit by creating a new request ID. If the user's required source count or title remains unsatisfied, report the gap.

Validate record shape and cross-record identity before accepting a response. When a JSON Schema validator is available, use it; otherwise check the contract explicitly and describe the check as manual. Schema validity establishes structure and syntactic URLs, not source existence, truth, or support. Source verification remains a separate evidence check.
