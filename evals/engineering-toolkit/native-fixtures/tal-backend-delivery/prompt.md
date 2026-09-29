Add duplicate-safe reservations to this existing Python inventory service. Follow
the public contract in `contract.md`, preserve the function interface, and verify
the result against `python3 -B verify.py`. The service uses local SQLite and trusted
tenant context supplied by its caller. Keep this a complete, bounded implementation;
modify `inventory.py` and add `test_inventory.py` if useful. Treat `contract.md` and
`verify.py` as supplied acceptance inputs. Report the final checks and review result.
