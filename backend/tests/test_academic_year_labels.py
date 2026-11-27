"""Academic-year display-label equivalence (no DB / no mutations of stored strings)."""

from app.services.academic_year_labels import academic_year_key, academic_years_equivalent


def test_supported_formats_share_the_same_key():
    assert academic_year_key("2026-27") == (2026, 2027)
    assert academic_year_key("2026 - 2027") == (2026, 2027)
    assert academic_year_key("2026-2027") == (2026, 2027)
    assert academic_year_key("2026 – 27") == (2026, 2027)
    assert academic_years_equivalent("2026-27", "2026 - 2027") is True
    assert academic_years_equivalent("2025 - 2026", "2025-26") is True


def test_different_years_are_not_equivalent():
    assert academic_years_equivalent("2026-27", "2025-26") is False
    assert academic_years_equivalent("2026 - 2027", "2027 - 2028") is False


def test_invalid_and_ambiguous_labels_do_not_compare():
    assert academic_year_key("") is None
    assert academic_year_key(None) is None
    assert academic_year_key("2026") is None
    assert academic_year_key("FY 2026-27") is None
    assert academic_year_key("academic year 2026") is None
    # Non-contiguous pair is not a school year we recognise
    assert academic_year_key("2026-28") is None
    assert academic_years_equivalent("2026-27", "FY 2026-27") is None
    assert academic_years_equivalent("2026", "2026 - 2027") is None
