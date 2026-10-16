# Company blog refresh archive manifest

This archive preserves the readable external crawl tree, including recovered
historical metadata, raw responses, extraction outputs, discovery proofs,
attempts, source snapshots and failed checks. It is retained locally in the
`archives/company-blog-refresh-2026-10-14` directory beside the repository.
Nothing was uploaded or published. The original [research manifest](../../MANIFEST.md)
and release asset remain unchanged.

| Archive observation | Value |
| --- | --- |
| File | `tal-skills-company-blog-refresh-2026-10-14.tar.zst` |
| Compressed bytes | 1,160,483,295 |
| SHA256 | `717fabb17896a6c8f9f01a48d4a67d92e55c235c9896558615193e0c424bbefc` |
| Readable source files | 72,804 |
| Embedded proof members | 3 |
| Individually decompressed and verified members | 72,807 |
| Completion UTC | 2026-10-14T19:40:48.923178+00:00 |

Every included member was independently read through decompression and checked
against its declared byte count and SHA256. The sidecar
`tal-skills-company-blog-refresh-2026-10-14.tar.zst.evidence/receipt.json`
records this verification. Structural and included member integrity passed;
whole original evidence integrity remains partial because three referenced
response objects are missing.

| Unavailable original object | Expected bytes | Expected SHA256 |
| --- | ---: | --- |
| Cloudflare article response | 316,843 | `a3d2e995571eb4e5badc351481024847f6ca0ab66e54f64958da0fd81b21d5e0` |
| Snyk article response | 159,634 | `28300551d12d98a66fdf3a58f15eb17b216e85868376a5d05bf97bbfb4151cdd` |
| Elastic article response | 1,139,210 | `5ceb8ebb7d5963bf95b7c99dd6464c3e85f75d5d0d1a9229b179b422629ee7d9` |

Original request receipts, object paths and subsequent availability observations
remain retained. Missing bytes were not recreated or silently omitted from the
gap accounting. The [coverage audit](coverage-audit.md) binds the publisher
reports and separates retrieval, extraction, deliberate reading and unresolved
article candidates.

The archive embeds these proof members under `archive-evidence/`. Matching
sidecars allow inspection without extracting the full payload.

| Proof file | Bytes | SHA256 |
| --- | ---: | --- |
| `source-inventory.jsonl` | 20,315,316 | `95c02837f5f1ebab0fdb98a11d8280e342ad78073929835adbbca62140ba30e6` |
| `member-manifest.jsonl` | 15,364,644 | `c98c259c318eeffb069ca5a88a5f939e879571fb70d98c5b2ce1fe0d830d0c81` |
| `receipt-object-gaps.jsonl` | 1,724 | `0ed080cdf5f46075ebc209d142bdffaf4d07d93b8b19362499d0b34054d7eb5b` |

An initial freeze inspection was interrupted after the audit log changed during
inspection. Its inventory and exit record remain beside the final archive in
`tal-skills-company-blog-refresh-2026-10-14.tar.zst.evidence.scan1`. No compressed
asset from that incomplete attempt was accepted. The successful attempt used a
frozen tree. The [packaging helper](../../../scripts/research/package-blog-crawl.py)
rejects destination overlap, overwrite and receipt content mismatch; its five
contract cases and actual compression smoke check passed.

Native agent trial artifacts are retained in a separate archive. Their
[archive receipt](../../../evals/company-blog-refresh/runs/2026-10-14/archive-manifest.json)
records the final source snapshot, all candidate stages and independent grading
evidence without rewriting sealed run paths.
