def import_document(user, url, http_client, parser):
    if not user.is_authenticated:
        raise PermissionError("Sign in required")
    response = http_client.get(url, follow_redirects=True)
    return parser.parse(response.content)
