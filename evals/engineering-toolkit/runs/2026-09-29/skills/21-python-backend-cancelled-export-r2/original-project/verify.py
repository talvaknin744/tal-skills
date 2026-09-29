import asyncio
from contextlib import asynccontextmanager
from exporter import export

class Pool:
    def __init__(self, remote):
        self.remote, self.releases = remote, 0
    @asynccontextmanager
    async def connection(self):
        try:
            yield object()
        finally:
            self.releases += 1
            assert not self.remote.active, "connection released while its owned work is still active"

class Remote:
    def __init__(self):
        self.started, self.before_commit, self.committed, self.reply = [asyncio.Event() for _ in range(4)]
        self.active, self.effects = False, []
    async def send_batches(self, conn, batches):
        self.active = True
        self.started.set()
        try:
            await self.before_commit.wait()
            self.effects.extend(batches)
            self.committed.set()
            await self.reply.wait()
            return list(batches)
        finally:
            self.active = False

async def cancellation(after_commit):
    remote = Remote()
    pool = Pool(remote)
    task = asyncio.create_task(export(pool, remote, ["batch-17"]))
    await remote.started.wait()
    if after_commit:
        remote.before_commit.set()
        await remote.committed.wait()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    else:
        raise AssertionError("owned cancellation was converted into success")
    assert pool.releases == 1
    assert remote.effects == (["batch-17"] if after_commit else [])
    assert not remote.active

async def success():
    remote = Remote()
    pool = Pool(remote)
    remote.before_commit.set()
    remote.reply.set()
    assert await export(pool, remote, ["batch-17"]) == ["batch-17"]
    assert pool.releases == 1 and remote.effects == ["batch-17"]

async def main():
    try:
        async with asyncio.timeout(3):
            await success()
            await cancellation(False)
            await cancellation(True)
        print("PASS success, pre-commit cancellation, post-commit cancellation and resource ownership")
    finally:
        remaining = asyncio.all_tasks() - {asyncio.current_task()}
        for task in remaining:
            task.cancel()
        if remaining:
            await asyncio.gather(*remaining, return_exceptions=True)

asyncio.run(main())
