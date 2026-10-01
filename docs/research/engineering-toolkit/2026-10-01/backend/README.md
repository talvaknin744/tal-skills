# Backend archive inventory — 2026-10-01

2,924 official archive metadata records across ten publishers. Metadata enumeration is separate from article reading. Accessible terminal endpoints are exhausted where indicated; publisher history gaps remain explicit.

| Publisher | Records | Status | Missing publication dates |
| --- | ---: | --- | ---: |
| [Netflix](netflix/coverage.json) | 219 | Sitemap exhausted; older history limited | 0 |
| [Uber](uber/coverage.json) | 768 | Engineering category exhausted | 0 |
| [Stripe](stripe/coverage.json) | 26 | Current category exhausted; legacy taxonomy unknown | 0 |
| [Shopify](shopify/coverage.json) | 432 | Feed exhausted; HTML gaps listed | 0 |
| [GitHub](github/coverage.json) | 175 | Current English taxonomy exhausted | 0 |
| [Slack](slack/coverage.json) | 194 | Public API exhausted | 0 |
| [Airbnb](airbnb/coverage.json) | 71 | Limited feeds; history blocked/rate limited | 0 |
| [Spotify](spotify/coverage.json) | 288 | Current API exhausted; publication dates partial | 283 |
| [DoorDash](doordash/coverage.json) | 341 | Engineering API exhausted | 0 |
| [Dropbox](dropbox/coverage.json) | 410 | All-stories and sitemap reconciled | 0 |

A separate Stripe legacy corporate supplement contains 234 dated records back to 2012-06-13; its historical engineering category is unresolved, so it is excluded from the main count. Netflix exposes history only from 2020 through its accessible sitemap; Airbnb history remains feed-limited and rate-limited. Spotify publication dates are unverified for 283 rows; CMS archive dates are retained separately.

Each publisher directory contains index.json and coverage.json with exact endpoint, page, date-basis and exclusion details. [Combined index](index.json) normalizes metadata and prior-record URL matches; [coverage](coverage.json) preserves publisher limits.

[Capacity/data cards](deep-capacity-data.json) and [interface/dataflow cards](deep-interfaces.json) contain four fresh article reads, six-dimensional practices and current primary-document crosschecks. Their Markdown companions record read scopes and ranked existing reference placements.

Approved package changes are recorded separately in the deep-read records and implementation report. No commits or deployments were performed here; root owns model trials and integration. Article enumeration itself remains metadata-only.
