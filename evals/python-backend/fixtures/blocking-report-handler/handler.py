client = LegacyClient()

async def report(account):
    return client.fetch(account, timeout=6)

async def health():
    return {"ok": True}
