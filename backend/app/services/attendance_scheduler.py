"""Optional in-process loop for the attendance auto-sync (ATTENDANCE_AUTO_SYNC_ENABLED=true).

Runs ``attendance_sync.run_scheduled_sync_once`` immediately, then every
``ATTENDANCE_AUTO_SYNC_INTERVAL_MINUTES``. With several API workers each worker runs its own loop;
that is safe (the sync is idempotent and duplicates are blocked by unique keys) but wasteful, so
enable it on one worker or call the run-now endpoint from an external cron instead.
"""

from __future__ import annotations

import asyncio
import logging

from app.core.config import settings
from app.services import attendance_sync

log = logging.getLogger("uvicorn.error")


async def _loop(interval_seconds: float, stop: asyncio.Event) -> None:
    while not stop.is_set():
        try:
            await asyncio.to_thread(attendance_sync.run_scheduled_sync_once)
        except Exception:
            log.exception("Attendance auto-sync tick failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=interval_seconds)
        except asyncio.TimeoutError:
            pass


def start_attendance_auto_sync() -> tuple[asyncio.Task, asyncio.Event] | None:
    """Start the loop on the running event loop when enabled; None when disabled (the default)."""
    if not settings.attendance_auto_sync_enabled:
        return None
    interval = max(1, int(settings.attendance_auto_sync_interval_minutes)) * 60
    stop = asyncio.Event()
    task = asyncio.create_task(_loop(interval, stop), name="attendance-auto-sync")
    log.info("Attendance auto-sync loop started (every %s min)", interval // 60)
    return task, stop


async def stop_attendance_auto_sync(handle: tuple[asyncio.Task, asyncio.Event] | None) -> None:
    if handle is None:
        return
    task, stop = handle
    stop.set()
    try:
        await asyncio.wait_for(task, timeout=30)
    except (asyncio.TimeoutError, asyncio.CancelledError):
        task.cancel()
