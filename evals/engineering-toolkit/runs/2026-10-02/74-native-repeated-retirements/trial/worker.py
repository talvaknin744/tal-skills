"""Current source excerpt; adapters are not supplied or executed by this bundle."""

async def poll(worker):
    while not worker.poll_stop.is_set():
        delivery = await worker.queue.receive()
        worker.buffer.append(delivery)
        worker.pool.submit(handle, worker, delivery)


async def handle(worker, delivery):
    key = (delivery.tenant_id, delivery.export_id)
    claim = await worker.queue.claim(key, worker.revision)
    progress = await worker.store.inspect(key)
    try:
        for batch in worker.manifest.after(progress.cursor):
            worker.cancellation.throw_if_requested()
            await worker.export_rows(batch)
            await worker.store.save_progress(
                key, batch.cursor, format=worker.default_write_format)
        await worker.store.finish(key, claim.epoch, delivery.export_id)
        await worker.queue.ack(delivery)
    except Exception as error:
        await worker.queue.business_fail(key, claim.epoch, error.name)


async def on_sigterm(worker):
    worker.readiness = False
    worker.cancellation.cancel_all()
    await worker.pool.wait(timeout_seconds=85)
    worker.exit(0)
