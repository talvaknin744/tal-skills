Use State to organize publication behavior and Strategy for the independent rendering choice. Reject the proposed eight status/rendering combinations, public `set_strategy` calls, shared mutable `document` references, and silent invalid operations. These would change required behavior and couple two independent dimensions.

The [design](/tmp/book-skill-trials-20260929/object-design-patterns/project/design.md:3) supplies a real State pressure: four existing methods repeat decisions on publication status, and adding `scheduled` changes the valid-event matrix. Rendering has a different driver: workspace policy can change while the document stays published. A rendering Strategy can be a Python callable; it does not require a class hierarchy.

The smallest alternative is a single explicit transition table plus ordinary command functions and two rendering functions. That is defensible for this small lifecycle and should remain the baseline for complexity. I favor a small State implementation if it consolidates each phase's behavior and removes the repeated switches; a table-driven implementation is preferable if state classes merely duplicate identical rows. Neither choice removes transition validation. Do not introduce factories, a dependency-injection framework, or a Singleton pattern: no construction or global-uniqueness requirement is present.

The publication contract must be explicit before refactoring:

| Current status | `edit` | `publish` | `archive` | `restore` | `schedule` | `unschedule` |
| --- | --- | --- | --- | --- | --- | --- |
| `draft` | Change body; stay draft | Become published; append one publication entry | Invalid | Invalid | Become scheduled | Invalid |
| `scheduled` | Invalid | Become published; append one publication entry | Invalid | Invalid | Invalid | Become draft |
| `published` | Invalid | Invalid | Become archived | Invalid | Invalid | Invalid |
| `archived` | Invalid | Invalid | Invalid | Become draft | Invalid | Invalid |

Every invalid cell raises `InvalidTransition` and leaves body, status, and history unchanged. In particular, repeated publication is invalid rather than a second history append or silent success. Scheduled documents cannot be edited. Restore returns an archived document to draft, after which it can be edited or published again. Existing effects and return conventions of accepted `edit`, `archive`, and `restore` must be characterized and retained; the document does not supply their full implementation details. No new publication-history entry is implied by scheduling or unscheduling.

The requirement authorizes the scheduler to publish scheduled documents through the same command boundary used by the UI. It does not specify a scheduler-only authorization rule. Preserve existing authorization checks and clarify that policy separately if needed; do not turn caller identity into an invented lifecycle restriction.

Map the useful roles to the domain as follows:

| Role | Owner and contract |
| --- | --- |
| State context: `Document` | Owns body, status, history, and the current state handler. Exposes events such as `edit`, `publish`, `archive`, `restore`, `schedule`, and `unschedule`. Owns the application of validated changes so publication's state update and one history append occur together. |
| State handlers: `DraftState`, `ScheduledState`, `PublishedState`, `ArchivedState` | Decide whether an event is valid and produce its permitted action/next status. A default invalid-event path raises `InvalidTransition`. Handlers do not select themselves on behalf of UI or scheduler and do not contain rendering policy. |
| Existing application command boundary | Resolves the target document, retains existing input/authorization/error/return behavior, and calls its event method. Both UI and scheduler go through it. Neither caller can force the document into a phase to make an otherwise invalid event succeed. |
| Rendering Strategy: `compact` and `detailed` renderers | Accept the same read-only document view and return text. They cannot alter status, body, or history. Rendering is independent of publication transitions. |
| Workspace rendering selection | Reads the workspace's current compact/detailed setting at the composition point and supplies the corresponding renderer. Changing policy changes subsequent render output, including for a published document, without changing its state handler. |

For example, the scheduler issues `publish(document_id)` through the existing application command boundary. That boundary obtains the document and invokes `document.publish()`. Its current `ScheduledState` permits publication; `Document` applies the approved status change and appends exactly one history entry. A subsequent `publish()` sees `PublishedState`, raises `InvalidTransition`, and changes nothing. The scheduler never replaces the handler first. UI publication of a draft follows the same path with `DraftState`.

Rendering instead follows `workspace setting -> renderer selection -> renderer(document view) -> text`. The client need not branch on renderer concrete types or use casts. Both renderers accept the same promised inputs, return text with their respective formatting, retain established error behavior, and have no domain mutation. Unknown rendering configuration should use the application's established error/default policy; no new fallback is specified here.

Keep per-document mutable state on `Document`. State handlers may be shared only if stateless, receiving the relevant document view or context explicitly for each call and retaining no mutable per-document data. Alternatively, create a handler owned by each document. Renderers can also be stateless shared functions. The proposed singleton `document` field can be overwritten by another call, reentrant call, or concurrent request, causing validation or history changes on the wrong document. A shared method signature does not provide substitutability: swallowing invalid events breaks the client's promised failure contract.

Keep status changes internal to validated events. If hydration from persistent data is needed, use an internal construction path that validates the stored status and selects the corresponding handler without replaying publication side effects. Do not expose that construction mechanism as a public transition setter. The design supplies no persistence or concurrency implementation, so State should not be credited with database atomicity or duplicate-delivery guarantees.

Use an incremental seam at the existing document event methods. First characterize their observable behavior, then replace their repeated status decisions with the state collaboration while preserving their public signatures and application boundary. Add `schedule` and `unschedule` and the scheduled publication path through that boundary. Extract rendering independently into the two policy functions. Remove the old switches and any status/rendering combination classes once the transition path is covered. Adding a later publication phase then changes its handler/transition definitions and corresponding tests; adding a rendering format changes renderer selection and its implementation without changing publication handlers or command callers.

Concrete validation to add when implementation is authorized:

1. Run the existing draft-edit, publication, and archive/restore tests before and after the refactor. Record the current accepted inputs, return values, history details, and error mapping instead of guessing them from method names.
2. Cover all 24 cells of the four-state, six-event table. The seven permitted cells produce the specified state/body/history outcome; the other 17 raise `InvalidTransition`. Snapshot body, status, and full history before each rejected call and assert exact equality afterward.
3. Exercise draft -> scheduled -> draft and confirm editing becomes available again. Exercise draft -> scheduled -> published through the scheduler's normal command boundary; body stays intact and history gains exactly one publication entry. A second publish raises and leaves that history unchanged.
4. Exercise publish -> archive -> restore -> publish. Retain the earlier publication entry and append one new publication entry on the second valid publication. Check existing archive/restore history behavior as well.
5. Interleave two document instances: schedule A, edit and publish B, reject editing A, then publish A. Each body's contents, status, and history must remain attached to its own document. If handlers are shared, also exercise reentrant or concurrent calls in the application's actual execution model to expose retained-context bugs.
6. Run both renderers against the same document-view contract across all statuses. Assert text output and no mutation. Change a workspace from compact to detailed while its document is published; only the rendering changes. A second workspace's policy remains independent.
7. Check representative rejected events through both UI and scheduler command entry paths, retaining existing exception/error mapping. Prevent callers from using a strategy setter to bypass transitions.

These are proposed tests, not executed tests. The only supplied project artifact is the design document, so no current Python implementation, test runner, persistence guarantees, or concrete formatting outputs were verified. The design review and pattern comparison are complete; the next implementation step is characterization at the existing event and rendering boundaries, with no dependency additions required.
