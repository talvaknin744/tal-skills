# technical-deprecation evaluation inputs

Two retirement reviews and one private-helper cleanup are original authored inputs,
not behavioral scores. Use the [toolkit runner](../engineering-toolkit/README.md)
and [evaluation guide](../README.md). The candidate receives the natural prompt,
only its declared fixture files, and normally discoverable skill metadata. Keep
`cases.json`, this README, and `author-calibration.json` outside the trial workspace;
the case corpus contains private scoring criteria.

- `periodic-export-client`: review a supported API/client retirement with a rare
  monthly consumer, incompatible snapshot semantics, and continuing new adoption.
- `config-channel-migration`: review a phased configuration migration across
  parser versions and offline clients, with explicit semantic and rollback limits.
- `private-format-helper`: remove one truly unused private helper in `labels.py`
  while preserving the public formatter and running the protected local verifier.

Both positive cases are read-only synthetic contract reviews. Their facts are
supplied application contracts, not statements about a real platform or library.
The nontrigger allows one source-file edit and standard-library Python execution;
`python3 -B verify.py` refuses optimized Python so assertions cannot be disabled.
All cases prohibit external services and communication. No fixture requires a
network, package installation, real customer data, credential or infrastructure.

Author calibration records source facts and separate scratch baseline/control
checks. It is not candidate scoring, independent review of a model response, or
proof of real consumer migration. Score actual traces, answers, diffs and executed
checks independently, preserve candidate hashes, and report capability deviations
without claiming filesystem read isolation. Fixture authors must not score these
cases' later candidate responses.
