# Netflix r03 export observer

A separate one time reader now preserves newly observed coherent checkpoint exports without changing the running collector or making network requests. Its lifetime follows the current collector process. Each snapshot preserves exact checkpoint, summary, pending frontier and body event bytes as lossless gzip artifacts, with byte lengths and SHA256 hashes for both compressed and original data.

A snapshot is retained only when every original export hash matches the existing immutable checkpoint report. Earlier unmatched mutable exports remain an explicit historical reconstruction gap. The observer lives outside the collector's final inventory tree, so continued observation does not mutate that inventory. The companion JSON identifies both actual processes and their source identities.
