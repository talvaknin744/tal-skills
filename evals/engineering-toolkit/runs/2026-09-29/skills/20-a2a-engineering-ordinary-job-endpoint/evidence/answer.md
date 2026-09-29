For an authorized `GET /jobs/j2` by user `u1`, return the response specified in [api.md](project/api.md):

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":"j2","state":"running"}
```

Preserve the existing authorization rule and JSON shape. All files remain unchanged; no external services were used.
