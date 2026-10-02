import asyncio
import time


async def dispatch(pool, carrier, shipment_id):
    deadline = time.time() + 0.5
    connection = await pool.acquire()
    child = asyncio.create_task(carrier.send(connection, shipment_id))
    try:
        async with asyncio.timeout_at(deadline):
            done, pending = await asyncio.wait({child}, timeout=0.5)
            if pending:
                child.cancel()
                return {"status": "pending", "shipment_id": shipment_id}
            return child.result()
    finally:
        await pool.release(connection)
