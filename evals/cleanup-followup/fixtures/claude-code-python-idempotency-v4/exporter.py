import asyncio

async def export(pool, remote, batches):
    async with pool.connection() as conn:
        task = asyncio.create_task(remote.send_batches(conn, batches))
        try:
            return await asyncio.shield(task)
        except asyncio.CancelledError:
            return []
