"""Normalize academic-year *display labels* for equivalence checks only.

Campus seed / masters use short labels such as ``2026-27``. Mark Entry UI options use
``2026 - 2027``. ``Exam.academic_year`` stores whatever label the client sent (preserved).
``Student.academic_year_id`` points at ``AcademicYear.name``.

This module never rewrites stored strings. It only derives a comparable ``(start, end)``
year pair when the label matches a known pattern. Unrecognised labels are not guessed.
"""

from __future__ import annotations

import re

# 2026-27 | 2026–27 | 2026 - 27 | 2026-2027 | 2026 - 2027 | 2026–2027
_YEAR_PAIR = re.compile(
    r"^\s*(?P<start>20\d{2})\s*[-–—]\s*(?P<end>(?:20)?\d{2})\s*$"
)


def academic_year_key(label: str | None) -> tuple[int, int] | None:
    """Return ``(start_year, end_year)`` or ``None`` if the label is not a supported pair."""
    if label is None:
        return None
    text = str(label).strip()
    if not text:
        return None
    # Ignore financial-year prefixes — those are a different domain.
    if text.upper().startswith("FY"):
        return None
    m = _YEAR_PAIR.match(text)
    if not m:
        return None
    start = int(m.group("start"))
    end_raw = m.group("end")
    if len(end_raw) == 2:
        end = (start // 100) * 100 + int(end_raw)
        # Century boundary: 2099-00 → 2100
        if end < start:
            end += 100
    else:
        end = int(end_raw)
    if end != start + 1:
        # Supported school years are contiguous start→start+1 only.
        return None
    return start, end


def academic_years_equivalent(left: str | None, right: str | None) -> bool | None:
    """True / False when both labels parse; ``None`` when comparison is not possible."""
    a = academic_year_key(left)
    b = academic_year_key(right)
    if a is None or b is None:
        return None
    return a == b
