# Stripe archive metadata

The current [Engineering topic](https://stripe.dev/blog/topic/engineering) contains 26 articles within a 120-post server-rendered dataset. This topic has no pagination and was consumed completely. Its earliest article is dated 2020-12-15.

The separate [corporate blog archive](https://stripe.com/blog/page/1) was walked across all 12 pages. It yields 233 unique article URLs after removing one duplicate; all nine [sitemap partitions](https://stripe.com/sitemap/sitemap.xml) supplied one additional article, producing 234 unique legacy corporate records, dated back to 2012-06-13. The [out-of-range page 13](https://stripe.com/blog/page/13) redirects to the blog root. `legacy-index.json` retains this metadata across all corporate categories.

Historical Engineering classification remains unresolved. The old [Engineering category](https://stripe.com/blog/engineering) and its pages 1–3 all redirect to the current developer topic. Archive entries lack Engineering category labels. The previously read [idempotency article](https://stripe.com/blog/idempotency), dated 2017-02-22, and [online migrations](https://stripe.com/blog/online-migrations), dated 2017-02-02, are present in the legacy archive but absent from the current topic. Thus the current topic is exhausted, while a complete historical Engineering-only inventory is not established.

All work here is metadata enumeration. Prior source matches and exact endpoint limits remain in the JSON records.
