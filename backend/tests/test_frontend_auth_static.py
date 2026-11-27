"""Static guards that the frontend authenticates as the actual signed-in user.

These read the React sources (there is no JS test runner in the project). They prove the code
paths are gone; the runtime behaviour is covered separately by the manual browser checks.
"""

import re
from pathlib import Path

from app.core.config import settings

SRC = Path(__file__).resolve().parents[2] / "src"


def _source_files():
    return [p for p in SRC.rglob("*") if p.suffix in {".js", ".jsx"} and "node_modules" not in p.parts]


def _read(relative: str) -> str:
    return (SRC / relative).read_text(encoding="utf-8")


def test_sources_exist():
    assert (SRC / "services" / "authApi.js").exists()
    assert len(_source_files()) > 100


def test_no_seeded_api_passwords_in_frontend_source():
    """Seed passwords may appear only on SignIn as click-to-fill helpers (DEV demo UX).

    They must never appear in AuthContext, API clients, or other modules, and SignIn must
    still require an explicit Login submit (covered by sibling tests).
    """
    seeded = {
        value
        for name, value in settings.model_dump().items()
        if name.endswith("_seed_password") and value
    }
    assert len(seeded) >= 6
    allowed = {(SRC / "Pages" / "Authentication" / "SignIn.jsx").resolve()}
    offenders = []
    for path in _source_files():
        if path.resolve() in allowed:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for password in seeded:
            if re.search(r"['\"`]" + re.escape(password) + r"['\"`]", text):
                offenders.append(f"{path.relative_to(SRC)} contains a seeded password")
    assert offenders == []


def test_shared_demo_password_literal_is_gone():
    offenders = [
        str(path.relative_to(SRC))
        for path in _source_files()
        if re.search(r"Qmis@20\d\d", path.read_text(encoding="utf-8", errors="ignore"))
    ]
    assert offenders == []
    assert not re.search(r"export const DEMO_PASSWORD|(?<![A-Z_])DEMO_PASSWORD\s*=", _read("context/AuthContext.jsx"))


def test_apilogin_is_only_called_for_a_user_typed_login():
    callers = [
        str(path.relative_to(SRC)).replace("\\", "/")
        for path in _source_files()
        if re.search(r"\bapiLogin\(", path.read_text(encoding="utf-8", errors="ignore"))
        and path.name != "authApi.js"
    ]
    assert callers == ["context/AuthContext.jsx"]
    # ...and there it receives only the values typed into the sign-in form.
    assert "apiLogin(normalizedEmail, enteredPassword)" in _read("context/AuthContext.jsx")


def test_hr_and_finance_use_the_signed_in_token_and_never_log_in_themselves():
    for name in ("services/hrApi.js", "services/financeApi.js"):
        text = _read(name)
        assert "authApi" not in text, f"{name} must not import the login API"
        assert "apiLogin" not in text, f"{name} must not log in on its own"
        assert "getAccessToken" in text, f"{name} must rely on the signed-in token"
        assert not re.search(r"@(qmis|school)\.(edu|com)", text), f"{name} must not embed account emails"


def test_sign_in_page_demo_chips_fill_only_and_do_not_auto_login():
    """Sign-in must not embed demo account chips or auto-login helpers."""
    text = _read("Pages/Authentication/SignIn.jsx")
    # Password field starts empty.
    assert "useState('')" in text or 'useState("")' in text
    assert re.search(r"const \[password,\s*setPassword\]\s*=\s*useState\(['\"]['\"]\)", text)
    # Demo fill chips / tables stay removed (typed credentials only).
    assert "DEMO_TEST_LOGINS" not in text
    assert "fillDemoLogin" not in text
    assert "DEMO_ACCOUNTS" not in text and "API_ACCOUNTS" not in text
    # Actual auth still goes through the typed form submit path.
    assert "loginWithCredentials(email, password)" in text


def test_api_login_failure_never_falls_back_to_local_accounts():
    text = _read("context/AuthContext.jsx")
    api_branch = text[text.index("if (isApiAuthEnabled()) {\n            try {") : text.index("if (!isDemoLoginEnabled())")]
    assert "resolveAccount" not in api_branch
    assert "passwordMatches" not in api_branch
    assert "success: false" in api_branch
    # Offline accounts are reachable only through the explicit development-only switch.
    assert "if (!isDemoLoginEnabled())" in text


def test_the_fake_otp_login_is_removed():
    text = _read("context/AuthContext.jsx")
    assert "Enter a valid 6-digit OTP" not in text
    assert not re.search(r"\blogin,\s*$", text, flags=re.MULTILINE)


def test_stored_session_role_is_verified_against_the_server():
    text = _read("context/AuthContext.jsx")
    assert "apiMe()" in text
    assert "SESSION_EXPIRED_EVENT" in text
    assert "SESSION_EXPIRED_EVENT" in _read("services/apiClient.js")


def test_demo_login_switch_is_development_only():
    text = _read("services/apiClient.js")
    assert re.search(r"isDemoLoginEnabled\s*=\s*\(\)\s*=>\s*\n?\s*Boolean\(import\.meta\.env\.DEV\)", text)
    assert "VITE_ENABLE_DEMO_LOGINS" in text
