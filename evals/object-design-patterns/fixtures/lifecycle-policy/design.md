# Document publication model

The Python application keeps documents in `draft`, `published`, or `archived`.
A draft may be edited or published. A published document may be archived, but
must not be edited. An archived document may be restored to draft. Publishing
adds one entry to that document's history. Other invalid events raise
`InvalidTransition` without changing body, state, or history.

Today, `edit`, `publish`, `archive`, and `restore` each contain a switch on
`document.status`. We need a `scheduled` phase: a draft can be scheduled, a
scheduled document can be unscheduled back to draft, and a scheduler can publish
a scheduled document. Scheduled documents are not editable. All existing rules
still apply. The scheduler uses the same application command boundary as the UI.

Separately, each workspace chooses a `compact` or `detailed` rendering policy.
Rendering can change while a document is published and must not change its
publication state. Renderers return text and do not update history.

## Proposed refactor

The author proposes one `DocumentStrategy` for each publication status, with
`edit`, `publish`, `archive`, `restore`, and `render` methods. The UI would call
`document.set_strategy(...)` to select the current strategy; the scheduler would
do the same before publishing. There would be eight shared strategy singletons,
one for each status/rendering combination, and each singleton would hold a
mutable `document` field set before a call.

The author says that moving each switch branch into a strategy class means
transition validation is no longer necessary. They also suggest making invalid
operations silently return because every class will have the same methods.

The design has not been implemented. There are existing tests for draft editing,
successful publication, and archive/restore. No test currently uses two document
instances in the same call sequence or covers rejected events.
