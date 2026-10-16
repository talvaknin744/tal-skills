# Public blog collector

The optional collector refreshes publisher discovery and preserves article
response evidence outside the checkout. It operates on the unchanged, verified
October archive baseline. It keeps fetched responses, extracted candidate prose
and source reading as separate facts. Automatic extraction never records a read.

Install the optional Python environment from
[the dependency file](requirements-blog-crawler.txt). Node validation does not
install these packages. The deterministic collector test explicitly reports a
skip when Python or either package is unavailable, so that host is a coverage gap.

```sh
python3 -m venv "$CRAWL_ENV"
"$CRAWL_ENV/bin/pip" install -r scripts/research/requirements-blog-crawler.txt
"$CRAWL_ENV/bin/python" scripts/research/blog-crawler.py \
  --publisher openai \
  --baseline-root "$RECOVERED_ROOT" \
  --archive-root "$EXTERNAL_CRAWL_ROOT" \
  --source-url https://developers.openai.com/sitemap-index.xml \
  --include-prefix https://developers.openai.com/blog/ \
  --no-default-sources
```

The recovered root must contain the historical member paths from
[the archive manifest](../../research/MANIFEST.md). Each imported inventory and
coverage proof must match its historical SHA256 and record count. Never extract
raw research archives into the source tree. Publication of refreshed evidence
requires an external retained archive and a digest receipt.

An independently enumerated publisher frontier can be supplied with
`--urls-file`, a newline URL file, followed by `--bodies-only`. Exact source
endpoints can be supplied repeatedly with `--source-url`. Prefer
`--no-default-sources` after publisher specific discovery, because generic
sitemaps can include languages, attachment pages and unrelated publications.
`--include-prefix` restricts fresh candidates while historical rows remain
retained. Explicitly reviewed taxonomy can be preserved as exclusions with
`--exclude-pattern`. The raw known count and the scoped article count remain
separate. A review of a publisher's hidden pagination remains required.

Cached public API pages can be supplied with `--import-source`, using
`SOURCE_URL=EXTERNAL_JSON_FILE`. The separator is the final equals sign, so source
query parameters are preserved. WordPress `content.rendered`, Ghost `html` and
RSS full content are retained with their source receipt. Import attribution does
not invent a transport result for the cached file. Original request receipts
must be retained beside any normalized import. `--import-bodies` accepts an
external JSONL mapping with `url`, `source_path`, `source_url` and `sha256` for
published alternate source files. It verifies the bytes and retains the source
identity. Alternate source retrieval is separate from canonical webpage access.

Resume skips successful URLs and retains every prior event. `--retry-failed`
retries unresolved dispositions, while `--retry-unextracted` attempts canonical
retrieval for an incomplete API body or page extraction. `--refresh-sources`
refreshes source responses. Saved source continuations are restored on resume
with the original source host boundary. `--reextract` uses verified saved bytes
locally and appends a corrected extraction event without making network requests.
Exclusions survive both retry and extraction. Unreadable local evidence is
recorded as `evidence_unavailable`, and a hash mismatch as
`evidence_integrity_failure`, with the earlier receipt retained. Local extraction
continues for other objects without a permission or access workaround.

The collector bounds host concurrency, request spacing, timeouts, retry count,
redirect hops and response bytes. Every article and source redirect target is
checked against the host robots policy. Missing robots with HTTP404 or HTTP410
allows access; unavailable or blocked robots leaves an unresolved disposition.
Declared crawl delays increase request spacing. Three blocked or challenge
responses open a host circuit for that run. Deferred URLs remain visible. A new
run must use an appropriate delay and explicit retry before attempting them again.
These controls do not establish a publisher rate limit guarantee.

`--repair-bindings` appends independently verified object byte counts for legacy
receipts that omitted that field. It leaves their original records unchanged and
refuses a missing object or a hash mismatch. Current summary binds the optional
correction sidecar digest. Exact source snapshots accompany later run receipts;
early candidate hashes without snapshots remain a source reconstruction gap.

Each publisher directory contains `summary.json`, current `article-state.jsonl`
and `source-state.jsonl`, SQLite resume state, append only request attempts,
body events, discovery events and run identities. Raw objects use their content
SHA256 as identity. A body receipt binds relative object path, bytes and SHA256.
Events retain prior failures and superseded classifications. Completed request
receipts are appended immediately, including from worker threads, before future
collection. Interruptions before a response is received can still leave an
unresolved request without response evidence. Summaries distinguish
raw known URLs from explicit exclusions, and raw completeness from scoped
completeness. An exhausted discovered frontier never establishes publisher
lifetime completeness. Deleted, private, unlisted, inaccessible and rendered
media content remain gaps. Short announcements can be fetched but unextracted.

The initial October refresh attempts exposed local defects before these controls
were complete: redirect slash normalization caused loops, body resume lacked a
robots preflight, interrupted discovery could lose continuations, generic source
scope admitted taxonomy and attachments, and some content containers were missed.
Some tutorial prose was initially mistaken for an access challenge, and HTTP202
challenge responses were initially labeled as fetched. Revised extraction and
policy events supersede those outcomes without deleting them. Initial request
traces remain evidence of the earlier candidate and its limitations. Later unit
checks do not retroactively establish policy compliance for those requests.
Early processes also retained request receipts only after a future completed, so
some interrupted work has raw objects without a complete request ledger. That
provenance gap remains visible.

Run the focused checks with `node --test tests/research-crawler.test.mjs` or
`python3 tests/research-crawler/collector-checks.py`. They use local fixtures and
mocked transport. Publisher availability, host rate limits, full rendered
content, copyrighted source reading and production reliability are outside their
scope. The repository archive validator and the refresh auditor cover separate
evidence contracts.


The [archive helper](package-blog-crawl.py) creates a retained external archive
with an exact readable member manifest, source inventory and explicit unavailable
or missing receipt object declarations. It checks every readable member digest
again after compression. It rejects a changed source, a receipt hash or byte
mismatch, output inside the input tree and overwriting an existing archive.
Failed packing attempts and partial archives remain visible. Symlinks are
recorded without following them. Unreadable files are declared without changing
permissions, names, paths or encoding. The helper uses standard Python plus the
Zstandard CLI for `.tar.zst`; its fixture tests use uncompressed tar and require
no external compressor. Call it only after publisher owners and the independent
auditor have frozen the source tree.

```sh
python3 scripts/research/package-blog-crawl.py \
  --source-root "$EXTERNAL_CRAWL_ROOT" \
  --output "$RETAINED_ARCHIVE_DIRECTORY/tal-skills-company-blog-refresh-2026-10-14.tar.zst"
```

State exports escape Unicode paragraph separators for consumers that split more
than physical LF records. The exact metadata values round trip unchanged.
Previously emitted literal separators are valid JSONL, and those byte versions
remain retained. Archive article routes with a year and article slug stay in
article scope, while a bare archive or year directory remains a collection.


The Vercel fallback runs only after the generic extractor leaves a response
unextracted. It requires exact requested, final and canonical publication
identities on the publisher blog or changelog, one specific headline, one article
and one publisher marked body. Paragraphs or list items corroborate the prose.
Collection schemas, navigation routes, duplicate markers, dynamic embeds, empty
or image only content and possible excerpt endings remain unresolved. The
fallback keeps existing publication metadata and records images as references
without inspecting their content. Other publishers and the generic 120 word
threshold keep their established behavior. A customer story moved from a blog
route remains separate alias evidence rather than an automatic identity match.

The observed publisher parser and its fourteen controls remain in the external
continuation evidence, bound to source SHA256
`d63459309369d2b0ac19b11bbb0960cadaa99b54429ccf45da7ffae12b564f66`.
The integrated parser adds exact requested identity and extracts the marked prose
body separately from contributor metadata. Its sixteen focused controls include
an offline state correction with prior events retained. All twenty six existing
collector cases remain unchanged. These checks establish bounded extraction
behavior, not source reading or future publisher markup compatibility.

The Databricks component union requires two distinct sibling body blocks in one
route specific publisher region, a matching headline and BlogPosting schema,
and one canonical link within the publisher article scope. It retains DOM order
and exposes each component hash. Nested or duplicate blocks, unrelated cards,
collection schemas, competing main regions and ambiguous identities retain the
generic extraction result. Other publishers and the general extractor are
unchanged. A different current canonical URL is recorded as an observed alias
with historical equivalence unresolved. Images and embedded media remain
unreviewed references, and recovered prose is not source reading.

Eighteen focused controls cover the component boundary, nontriggers, aliases,
media limits and offline event retention. Readonly verification compares every
one of the ninety independently audited cached responses with its expected text
hash, component hashes and word counts. The prior twenty six collector cases,
sixteen Vercel controls and earlier source candidates remain preserved. This
bounded verification does not establish completeness of every publisher page.

The Meta branch runs only when the generic extractor leaves a response
unextracted. It supports five bounded publisher page shapes: legacy AI prose,
Code Llama components, ordered hardware components, research prose and Tech
prose. Each shape requires a scoped requested and actual final URL, one publisher
canonical and publication URL metadata, an unambiguous article headline and the
observed publisher frame. It preserves case and source order. Hardware pages
without H1 use a separately checked hero title and date shape. The same general
120 word threshold remains in place.

Navigation, cookie dialogs, asides, ambiguous titles, collection metadata,
duplicate or nested components and unrelated cards do not qualify. Code Llama
share and newsletter components, research share components, hardware hero and
film or author blocks, and a structurally identified Tech recommendation section
are excluded. Verified technical accordion labels remain article text only when
the label metadata and exact sibling source panel agree. Their interaction is
unverified. JSONLD types outside a string or list of strings, and accordion state
outside an object, decline this branch. Other publisher and generic behavior
remain unchanged.

The standalone [reviewed helper](meta-article-helper.py) preserves the exact
reviewed implementation, also embedded in the collector so its reviewed source
identity remains exact. Images and embedded videos remain unreviewed references.
Three observed current aliases retain unresolved original historical
content equivalence. Article extraction adds no source reading, HTTP observation,
body availability or lifetime publication completeness.

Run `node --test tests/research-crawler-meta.test.mjs` or
`python3 tests/research-crawler/meta-portability-checks.py` for the sixteen small
synthetic controls. They require the declared optional Python dependencies and
no archived article bodies. The original twenty six generic, sixteen Vercel and
eighteen Databricks controls remain unchanged. The nineteen real cached Meta
fixtures, thirty one original Meta controls and fourteen independent controls
remain in external evidence, with failed candidates and exact source bindings
preserved. The [cached quality report](../../research/company-blog-refresh/2026-10-14/continuations/r13/meta-cached-quality.md)
records the installed candidate identity, actual replay and multimedia limits.
These checks qualify the tested shapes and refusals, not every future publisher
template or native model behavior.
# MongoDB Han prose boundary

The MongoDB fallback runs only when the generic parser leaves the response
unextracted. It requires matching requested, final, canonical and publication
identities, one bounded publisher article frame, an Article headline and
corroborating document metadata. Ordered, distinct paragraphs across multiple
sections qualify the prose. Character length alone does not establish an article.

Malformed identities, invalid Unicode, navigation or cookie regions, conflicting
document titles, collection metadata, short introductions and video shells
retain the generic result. SVG accessibility titles remain separate from HTML
document identity. The observed editorial title can differ from the headline
only when its own publication metadata corroborates it.

The two reviewed cached bodies retain Chinese source prose despite English HTML
language metadata. Their earlier availability remains unchanged. Extraction adds
no deliberate reading, media or native behavior credit. The generic word cutoff,
other publishers and the Meta branch retain their established behavior.

The [portable MongoDB controls](../../tests/research-crawler-mongodb.test.mjs)
exercise twenty one synthetic boundaries without an archived body dependency.
Larger real response fixtures, exact component proofs and earlier failed
controls remain outside the repository. The implementation is embedded in the
self contained collector and needs no duplicate MongoDB helper file.
