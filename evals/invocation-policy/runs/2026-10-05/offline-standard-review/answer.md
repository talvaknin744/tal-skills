**Add a stable provider idempotency key derived from the notification ID, and preserve the current send-then-mark order.** This is the smallest useful reliability improvement given the single dispatcher and provider support documented in [README.md](https://github.com/talvaknin744/tal-skills/releases/download/v1.0.0/tal-skills-phase2-native-2026-10-05.tar.zst#member=phase2-eval/invocation-policy/runs/offline-standard-review/trial/README.md&line=3).

The current order is valuable: [dispatch.py](https://github.com/talvaknin744/tal-skills/releases/download/v1.0.0/tal-skills-phase2-native-2026-10-05.tar.zst#member=phase2-eval/invocation-policy/runs/offline-standard-review/trial/dispatch.py&line=3) sends before recording completion. If the provider accepts the email and the process crashes before `sent_at` persists, the restart can send it again. A stable key lets the provider recognize that retry while keeping the notification eligible until completion is recorded.

Use the same key across restarts, with a namespace that prevents collisions. The tradeoff is dependence on the provider’s deduplication scope and retention period; retries beyond that period may still duplicate emails.

What still needs validation:

- **Provider contract:** confirm success means durable acceptance, and verify key scope, retention, and behavior when retrying the same payload.
- **Recovery:** inject failure before acceptance, an ambiguous timeout, and a crash after acceptance but before the database update persists. Pass if retries eventually persist `sent_at` and produce one accepted email within the deduplication window.
- **Failure isolation:** a send exception currently exits the function. Test a permanently failing notification alongside valid ones; pass if valid notifications continue progressing.
- **Delivery requirement:** clarify whether “no missed notification” means provider acceptance or recipient delivery. This change addresses duplicate submissions; final delivery needs separate evidence.

This was a source-only review. No runtime checks were run, and nothing was modified.
