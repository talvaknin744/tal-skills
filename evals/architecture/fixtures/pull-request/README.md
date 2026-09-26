# Pagination helper change

The endpoint requests at most `page_size` records. It should return another offset when the response contains exactly that many records. A shorter response ends pagination. The proposed patch is in `change.diff`.
