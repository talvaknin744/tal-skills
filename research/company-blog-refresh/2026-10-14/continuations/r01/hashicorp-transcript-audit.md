# HashiCorp transcript audit

The original full page parser and its six controls remain unchanged. The audit
first froze fourteen selected captures externally, then an additive verifier
checked all 1538 completed shard captures and 1642 frames. Original markers,
verifications, frame hashes and body bindings remain intact, as do all forty two
previously frozen native evaluation review files.

The initial three conflicts concern changed related posts and footer snapshots.
Each individual frame contains the complete matching article interval, and the
normalized article hashes agree:

| Capture | Body lines | Closing boundary | First conflict | First missing footer lines |
| --- | --- | --- | --- | --- |
| s1/0317 | L107 through L330 | L331 | L333 | L409 through L413 |
| s1/0329 | L105 through L289 | L290 | L292 | L354 through L373 |
| s1/0341 | L115 through L296 | L297 | L299 | L347 through L382 |

A separate modern article proof requires the exact publisher path, explicit
redirect identity checks, matching H1, one share and closing boundary, every
intervening line and substantive body in one frame. Every overlapping article
fragment must agree. Legacy s1/0493 and s2/0238 additionally require complete page
coverage and the explicit share/H1/date/divider/partner/newsletter/related sequence.
Their article dividers occur at L114 and L161; newsletter headings at L117 and
L163; legacy related headings at L128 and L174.

For s3/0819, frame0000 independently contains H1 L81, share L109, body L110
through L349 and closing L350. Frame0001 only fails a footer request at L422 and
explicitly names the same article URL. A precisely bound one line failed window
contributes no article fragment and cannot prove an article alone. Its original
full page result remains failed. An unbound or foreign failed window is rejected.

The authoritative `article-recovery/r01/results/terminal-pass-03/manifest.json`
records 1500 modern single frame article proofs, two legacy proofs, twenty nine
attributed prior full page proofs and seven rejections. Twenty three proofs
recover article evidence from original full page failures: twenty one modern
cases retain whole page false; two legacy cases have whole page true. All thirty
original whole page gaps remain in their original records. Later ordinary
publication route or retry recoveries have separate owner receipts.

The seven original rejections are s0/0064, s0/0276, s1/1333, s2/0730, s2/1414,
s3/1363 and s3/1495. s0/0064, s0/0276 and s2/0730 contain fetch errors only.
s1/1333 redirects to `/en/tao-of-hashicorp`, outside its blog identity. s2/1414
requires fragment joining without a prior complete page proof. s3/1363's raw
L180 promises a systemd example, L182 starts that example, L187 ends at
`ConditionFileIsExecutable=` and L188 starts related cards. Its frame digest is
`d18e76886ccf2e665900203910de77cf93faebf1b3aef37a3e85d7a69a75adce`.
No complete article termination is evidenced. s3/1495 has differing article
representations, including heading spacing and code formatting, so agreement
remains unproved despite a complete later frame. These limitations preserve
actual missing evidence and renderer ambiguity separately from unavailable routes.

The final source digest is
`ddaf7bb123f1565a97bd24fb31b0fa16f6d256bbac1be4a2f4646efb371e5bbb`.
The authoritative manifest digest is
`b63c2f99f8a35efce72e0bd18867481afeb4e19f806de9392030815259325582`.
Fifty focused controls, five output isolation checks and the original six controls
pass. Earlier source versions, manifests and the retained forty one of forty four
control attempt remain visible. Three new rejection fixtures in that attempt
accidentally inherited a positive coverage expectation; their rejection checks
passed, and a new fixture version corrects only that mistaken expectation.
Existing parser and native cases remain unchanged. All body_read fields stay
false. Complete published text proof does not establish raw HTML, linked media,
direct HTTP availability, semantic reading or native agent behavior.
