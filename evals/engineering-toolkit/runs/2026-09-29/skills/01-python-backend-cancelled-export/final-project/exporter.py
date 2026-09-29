async def export(pool, remote, batches):
    async with pool.connection() as conn:
        return await remote.send_batches(conn, batches)
