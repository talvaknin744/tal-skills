# Verify the reader's path

Use this branch when consolidating instructions, fixing stale documentation, or
removing apparently redundant prose.

1. Name the audience and starting state: checkout, runtime, credentials, working
   directory, data, and assumed prior knowledge only where they affect execution.
2. Find the authoritative instruction for each operation. Consolidate repeated
   commands there and link from other entrypoints; keep audience-specific
   explanation when it serves a different task.
3. Retain prerequisites and reasons for surprising constraints. A compatibility
   note, recovery condition, or deliberate-duplication explanation carries knowledge
   that a command listing cannot recover.
4. Check referenced paths and commands, then execute the affected safe local path
   from the stated starting state. Use a disposable workspace when feasible. Label
   externally mutating or unavailable steps as unexecuted and say what they require.
5. Read the final path as a newcomer: a reader must know what success looks like,
   how to interpret a failure, and which authoritative page applies next.

An introductory walkthrough and an exhaustive reference can discuss the same API
without being redundant. Reduce conflicting authority and reader effort, not a
word-count target. Preserve an operational rationale unless evidence shows it no
longer applies; record that evidence when retiring it.
