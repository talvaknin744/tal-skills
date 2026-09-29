# Migration and retirement gates

Read the branch matching the requested stage. A small migration needs only its
relevant gates; keep the project's existing issue and release mechanisms.

## Discouraging or blocking new usage

Choose a check at the actual dependency boundary: a build rule, targeted static
check, API policy, or scoped runtime validation. Define whether it prevents new
consumer projects, new call sites, or all use. Preserve explicitly supported legacy
uses while they migrate; record exceptions with an owner and an exit condition.
Verify both a prohibited new dependency and a permitted existing one. Update
examples and templates that would otherwise introduce fresh legacy usage.

A deprecation annotation is a signal until the configured tool makes it an
enforced rule. For Python, regular-build defaults often hide `DeprecationWarning`
outside `__main__`; `warnings.deprecated` was added in 3.13 and its runtime category
does not control static checker diagnostics. Inspect the installed checker,
warnings filters, and CI exit status before claiming enforcement. See the
[versioned warnings reference](https://docs.python.org/3.14/library/warnings.html).

## Migrating consumers

Start with a batch whose compatibility check can reveal a missing replacement
behavior. Keep old/new interfaces available when supported consumers upgrade
independently. If persistent state changes, specify which versions can read and
write it during transition and recovery; restoring old code alone may not restore
compatibility. Name temporary adapters and their retirement dependencies.

Where policy differentiates advisory/soft deprecation from scheduled removal,
record that state explicitly. Python's [PEP 387](https://peps.python.org/pep-0387/)
is one such policy; its core-language and standard-library process does not set
grace periods for an unrelated application. Follow the target's actual support
agreement and version policy.

## Removing the old contract

Check the agreed policy, consumer transitions, retained-input requirements,
unresolved evidence, and recovery route before the removal step. Resolve residual
unknown consumers with the accountable decision owner; a calendar date cannot
silently accept that risk. Dry-run or rehearse against the actual packaging,
configuration, or routing boundary being removed. Keep an unaffected consumer
working while a deliberate legacy reference is detected by the intended check.

Record whether the old contract is merely hidden, disabled, or physically removed.
An adapter still required by a supported client is unfinished retirement work.
Retire obsolete instructions, checks, and temporary resources only after their
remaining responsibilities are accounted for. Service shutdown, data disposal,
and public-product commitments need their own scoped procedures when applicable.
