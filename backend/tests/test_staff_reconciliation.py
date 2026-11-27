"""Redacted reconciliation counts: Excel body vs hrSeed (no live DB, no passwords)."""

from __future__ import annotations

import importlib.util
import os
from pathlib import Path

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "reconcile_staff_roster.py"


def _load():
    import sys

    spec = importlib.util.spec_from_file_location("reconcile_staff_roster", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_excel_122_body_resolves_to_120_staff_aligned_with_seed():
    module = _load()
    rec = module.build_report()
    assert rec.excel_body_rows_under_header == 122
    assert rec.excel_blank_rows == 1
    assert rec.excel_repeated_header_rows == 1
    assert rec.excel_raw_staff_rows == 120
    assert rec.hr_seed_count == 120
    # Seed eligibility grew as Maintenance/File Room/CCTV/PRO and related roles were mapped.
    assert rec.in_seed_eligible == 107
    assert rec.in_seed_directory_only == 13
    assert rec.in_seed_eligible + rec.in_seed_directory_only == rec.hr_seed_count
    assert rec.excel_raw_staff_rows == rec.excel_unique_after_email_dedupe
    assert len(rec.duplicate_emails_in_excel) == 0
    assert len(rec.invalid_email) == 0
    assert rec.multi_email_cells == 7
    assert "live" in rec.live_note.lower()
