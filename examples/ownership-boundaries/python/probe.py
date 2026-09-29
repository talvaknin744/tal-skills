"""Controlled ownership observations; standard library only."""

import asyncio
import json
import platform
import sys


async def join_owned(tasks):
    for task in tasks:
        if not task.done():
            task.cancel()
    async with asyncio.timeout(1):
        await asyncio.gather(*tasks, return_exceptions=True)
    assert all(task.done() for task in tasks)


async def canceled(task):
    try:
        await task
    except asyncio.CancelledError:
        return
    raise AssertionError("Expected the observer task to propagate cancellation")


async def grant_before_resume():
    semaphore = asyncio.Semaphore(1)
    await semaphore.acquire()
    initial_held = True
    tasks = []

    async def worker(started, accepted, finish):
        # No suspension between the announcement and acquire. Since the permit
        # is held, the caller resumes only after this worker parks in acquire.
        started.set()
        await semaphore.acquire()
        accepted.set()
        try:
            await finish.wait()
        finally:
            semaphore.release()

    def start_worker(finish=None):
        started, accepted = asyncio.Event(), asyncio.Event()
        finish = finish or asyncio.Event()
        task = asyncio.create_task(worker(started, accepted, finish))
        tasks.append(task)
        return task, started, accepted, finish

    try:
        first, first_started, first_accepted, _ = start_worker()
        await first_started.wait()
        successor, successor_started, successor_accepted, release_successor = start_worker()
        await successor_started.wait()

        # These two synchronous calls share one event-loop turn: the queued
        # waiter is granted capacity, then canceled before its task can resume.
        semaphore.release()
        initial_held = False
        first.cancel()
        await canceled(first)
        assert not first_accepted.is_set()
        await successor_accepted.wait()

        already_finished = asyncio.Event()
        already_finished.set()
        probe, probe_started, probe_accepted, _ = start_worker(already_finished)
        await probe_started.wait()
        assert not probe_accepted.is_set(), "Grant was refunded more than once"
        release_successor.set()
        await successor
        await probe
        assert probe_accepted.is_set(), "Capacity was not returned"

        # Check the final capacity through competing public acquisitions too.
        holder, holder_started, holder_accepted, release_holder = start_worker()
        await holder_started.wait()
        await holder_accepted.wait()
        final, final_started, final_accepted, _ = start_worker(already_finished)
        await final_started.wait()
        assert not final_accepted.is_set(), "Final capacity exceeds one permit"
        release_holder.set()
        await holder
        await final
        return {
            "canceled_waiter_accepted": False,
            "successor_acquired": True,
            "third_waiter_blocked_while_successor_held": True,
            "final_single_permit_recovery": True,
            "private_semaphore_fields_used": False,
        }
    finally:
        await join_owned(tasks)
        if initial_held:
            semaphore.release()


async def shielded_acquisition_control():
    semaphore = asyncio.Semaphore(1)
    await semaphore.acquire()
    initial_held = True
    grant_repaid = False
    tasks = []
    grant_started, observer_started = asyncio.Event(), asyncio.Event()

    async def acquire_without_owner():
        grant_started.set()
        return await semaphore.acquire()

    grant = asyncio.create_task(acquire_without_owner())
    tasks.append(grant)

    async def unsafe_observer():
        observer_started.set()
        # Deliberately unsafe control: shield preserves acquisition, but this
        # caller has no policy to take ownership of a grant after cancellation.
        await asyncio.shield(grant)

    observer = asyncio.create_task(unsafe_observer())
    tasks.append(observer)
    probe_started, probe_accepted = asyncio.Event(), asyncio.Event()

    async def next_borrower():
        probe_started.set()
        await semaphore.acquire()
        try:
            probe_accepted.set()
        finally:
            semaphore.release()

    try:
        await grant_started.wait()
        await observer_started.wait()
        semaphore.release()
        initial_held = False
        observer.cancel()
        await canceled(observer)
        assert await grant is True

        probe = asyncio.create_task(next_borrower())
        tasks.append(probe)
        await probe_started.wait()
        assert not probe_accepted.is_set()
        # The harness, not the unsafe observer, repairs its abandoned permit.
        semaphore.release()
        grant_repaid = True
        await probe
        return {
            "observer_canceled": True,
            "shielded_acquisition_succeeded": True,
            "next_borrower_blocked_until_harness_repair": True,
            "harness_repaid_abandoned_grant": True,
        }
    finally:
        await join_owned(tasks)
        if initial_held:
            semaphore.release()
        if grant.done() and not grant.cancelled() and grant.exception() is None:
            if grant.result() and not grant_repaid:
                semaphore.release()


async def main():
    # Do not let optimized execution turn the observations into hardcoded
    # success. This guard intentionally does not use an assert statement.
    if sys.flags.optimize != 0:
        print(json.dumps({
            "language": "python",
            "runtime": platform.python_version(),
            "optimization_level": sys.flags.optimize,
            "scenarios": [],
            "error": "Assertions must be enabled; run without -O and PYTHONOPTIMIZE.",
        }))
        return 2
    cases = []
    for case_id, expected_status, fn in [
        ("semaphore-grant-cancel-before-resume", "pass", grant_before_resume),
        ("shielded-acquisition-abandoned-grant", "observed-unsafe", shielded_acquisition_control),
    ]:
        try:
            async with asyncio.timeout(3):
                evidence = await fn()
            pending = [task for task in asyncio.all_tasks() if task is not asyncio.current_task()]
            assert not pending, f"Owned tasks remain: {pending!r}"
            evidence["pending_tasks_after_cleanup"] = 0
            cases.append({"id": case_id, "status": expected_status, "evidence": evidence})
        except Exception as error:
            cases.append({"id": case_id, "status": "fail", "evidence": {"error": repr(error)}})
    print(json.dumps({
        "language": "python",
        "runtime": platform.python_version(),
        "implementation": platform.python_implementation(),
        "optimization_level": sys.flags.optimize,
        "scenarios": cases,
        "limitations": [
            "Controlled CPython event-loop schedule; not a fairness guarantee for every implementation.",
            "No private semaphore capacity or waiter fields are used as an oracle.",
            "Unsafe shield control is repaired and joined by the harness.",
        ],
    }))
    return int(any(case["status"] == "fail" for case in cases))


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
