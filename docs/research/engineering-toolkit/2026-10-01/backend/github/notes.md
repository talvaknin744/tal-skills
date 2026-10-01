# GitHub Engineering archive metadata

The [official Engineering archive](https://github.blog/engineering/) was exhausted through [page 12](https://github.blog/engineering/page/12/): 175 unique articles dated 21 February 2013 through 25 September 2026. Page 12 has no next link; page 13 returns HTTP 404. This is metadata enumeration, with no article-body or deep-reading claim.

The [official category API](https://github.blog/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,parent,count,link) identifies Engineering (72) and five child categories. Their [post metadata union](https://github.blog/wp-json/wp/v2/posts?categories=72,3307,3308,3309,3310,3312&per_page=100&_fields=id,link,title,date,modified,categories&page=1) returns 175 articles over two pages, exactly matching the HTML URL set and publication dates. Page 3 returns `rest_post_invalid_page_number`. The parent term's count of 174 excludes one article assigned only to a child term; the union includes it.

All five post sitemaps listed by [GitHub's sitemap index](https://github.blog/sitemap_index.xml) were fetched. Every archive article appears there. Only 165 have canonical URLs under `/engineering/`; the remaining ten are included because the archive and category metadata include them. URL path alone would undercount this archive.

Canonical URLs were compared with the previous research ledgers and notes. None of these 175 article URLs was previously recorded. The previously researched [MySQL migration automation article](https://github.blog/enterprise-software/automation/automating-mysql-schema-migrations-with-github-actions-and-more/) is absent from this current category archive and remains in the prior backend ledger. The index does not claim to capture engineering subject matter elsewhere in GitHub's other categories or older library.

[index.json](index.json) contains URL, title, date and supporting metadata. [coverage.json](coverage.json) records each archive/API page, sitemap counts, terminal evidence, reconciliation, deduplication and exclusions. Article bodies and raw archive HTML were not saved.
