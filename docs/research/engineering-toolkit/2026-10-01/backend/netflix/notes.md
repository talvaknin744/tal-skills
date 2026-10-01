# Netflix archive metadata

The [official publication sitemap](https://netflixtechblog.com/sitemap/sitemap.xml) exposed 219 article URLs and was consumed to its XML terminal. All 219 now have verified titles and publication dates. The oldest observed article is dated 2020-10-19. Modification dates remain separate.

This is **sitemap-exhausted, history-limited** coverage. The [archive](https://netflixtechblog.com/archive) and [2020 archive filter](https://netflixtechblog.com/archive/2020) yield no usable article enumeration in web extraction, and direct archive requests return 403. The [RSS feed](https://netflixtechblog.com/feed) exposes the latest ten stories without historical pagination. Pre-2020 coverage remains unresolved.

Metadata enumeration does not constitute deep reading. `index.json` records the source of each title/date and every prior research URL match; `coverage.json` and `request-ledger.json` preserve the endpoint boundary.
