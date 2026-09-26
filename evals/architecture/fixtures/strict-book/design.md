# Catalog indexing

The application writes product changes to its relational database and a scheduled process rebuilds a search index every hour. The product brief accepts search results that are up to two hours old. There are 20,000 products, and the rebuild takes eight minutes in the last recorded test. This fixture includes no books, excerpts, verified bibliographic records, or external source snapshots.
