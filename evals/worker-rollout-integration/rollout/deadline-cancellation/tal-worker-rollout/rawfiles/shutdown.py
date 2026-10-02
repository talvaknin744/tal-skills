"""Current excerpt; the unavailable adapters make this an inspection artifact."""

async def on_stop(worker, reason):
    worker.accepting = False
    worker.job.public_status = "cancelled"
    worker.job.cancel_requested = True
    worker.task.request_cooperative_stop()
    try:
        await worker.task.join(timeout_seconds=75)
        for operation in [worker.checkpoint, worker.release]:
            try:
                await operation(timeout_seconds=8)
            except TimeoutError:
                worker.log("will retry cleanup")
    finally:
        await worker.queue.ack(worker.delivery)
        worker.exit(0)
