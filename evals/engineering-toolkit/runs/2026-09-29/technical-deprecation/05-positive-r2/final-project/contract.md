# Harbor Relay configuration contract

Harbor Relay is a customer-installed queue relay. Each installation reads a local JSON configuration at process startup. The central console can queue a replacement file, but a queued file is not an acknowledgement of receipt or a successful restart. An offline installation receives queued files in queue order when it reconnects; configuration delivery does not inspect its executable version. A customer may keep an installation disconnected for 45 days.

## Supported formats

Relay 3.6 and 3.8 are supported through 2026-12-31. Customers may run those releases and use their documented configuration keys until that date. A newer executable is an optional upgrade during that period.

The legacy top-level keys are `read_ahead_enabled` and `read_ahead_limit`. The replacement is a `prefetch` object with fields `enabled` and `max_items`. Both spellings use the following semantics:

| Value | Enabled field | Limit field |
| --- | --- | --- |
| Omitted | Inherit the installation policy at each startup | Inherit the installation policy at each startup |
| `false` | Disable read-ahead | Invalid type |
| `true` | Enable read-ahead | Invalid type |
| `0` | Invalid type | No item-count cap |
| Positive integer | Invalid type | Cap at this number of items |

An explicit limit remains stored when read-ahead is disabled and applies if read-ahead is subsequently enabled. Installation policy is separately managed and may change; replacing an omitted field with today's policy value changes future behavior. JSON `null` is invalid for these fields.

Relay 3.6 accepts only the legacy spellings. It rejects the entire file at startup if it contains the unknown top-level key `prefetch`, including when the file also contains valid legacy keys. On this validation failure the process exits before connecting to its queue.

Relay 3.8 accepts either format. If both spellings are present, an explicitly present replacement field takes precedence over its corresponding legacy field; `false` and `0` count as present. A missing replacement field falls back to the corresponding legacy field, then to installation policy. Release candidate 3.9-rc1 accepts only the replacement format and rejects either legacy key.

## Configuration tools and rollback

`relay-config` 9.2 is the documented local editor shipped with supported installation kits. It understands the legacy fields and rejects `prefetch`. Customers can edit their files without the central console. `relay-config` 10.0-rc1 can read legacy or replacement fields and emits only the replacement format. The current central console still accepts both formats and stores the submitted document verbatim.

The deployment system has independently versioned executable and configuration channels. Executable rollback restores the selected binary. It neither restores configuration bytes nor removes queued configuration updates. A replacement file is activated at the next process restart. Saved configuration revisions are retained centrally for seven days; local editors do not create central revisions. There is no transaction joining executable delivery, file delivery, and restart.

Successful deployment is defined by an executable download acknowledgement. Startup health is a separate signal. Customers retain their last downloaded installation kit for recovery. Configuration migration must preserve effective behavior and the distinction between explicit values and policy inheritance.
