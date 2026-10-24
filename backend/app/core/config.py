import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Shipped placeholder secret. It is public (in git history), so it must never sign tokens
# anywhere except an explicitly configured local development machine.
DEFAULT_JWT_SECRET = "local-dev-change-me-qmis-erp-2026"
MIN_JWT_SECRET_LENGTH = 32
_DEVELOPMENT_NAMES = {"development", "dev", "local"}
_KNOWN_WEAK_SECRET_MARKERS = ("change-me", "changeme", "secret", "password", "example", "placeholder")


class InsecureConfigurationError(ValueError):
    """Raised at startup when a non-development environment has an unsafe configuration."""


class Settings(BaseSettings):
    # hide_input_in_errors: a failed validation must not echo secrets (DB URL, JWT secret) into logs.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)

    app_name: str = "QMIS ERP API"
    # Secure by default: anything other than an explicit development value is treated as production.
    environment: str = "production"
    database_url: str = "postgresql+psycopg://postgres:root@localhost:5432/qmis_erp"
    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_expire_minutes: int = 480
    otp_expire_minutes: int = 10
    # Returns the OTP in the API response. Only honoured when ENVIRONMENT is development.
    otp_debug: bool = False
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )
    admin_seed_email: str = "admin@qmis.edu"
    admin_seed_password: str = "admin123"
    superadmin_seed_email: str = "superadmin@qmis.edu"
    superadmin_seed_password: str = "superadmin123"
    hr_seed_email: str = "hr@qmis.edu"
    hr_seed_password: str = "hr12345"
    accounthead_seed_email: str = "accounthead@qmis.edu"
    accounthead_seed_password: str = "accounts123"
    finance_assistant_seed_email: str = "finance.assistant@qmis.edu"
    finance_assistant_seed_password: str = "finance123"
    teacher_seed_email: str = "teacher@qmis.edu"
    teacher_seed_password: str = "teacher123"
    coordinator_seed_email: str = "coordinator@qmis.edu"
    coordinator_seed_password: str = "coord123"
    principal_seed_email: str = "principal@qmis.edu"
    principal_seed_password: str = "principal123"
    prm_seed_email: str = "prm@qmis.edu"
    prm_seed_password: str = "prm12345"
    director_seed_email: str = "director@qmis.edu"
    director_seed_password: str = "director123"
    upload_dir: str = "uploads"

    # --- Brute-force protection (in-memory, per API process) ---
    login_max_failures: int = 5  # failed logins per email before lockout
    login_lockout_minutes: int = 15
    login_ip_max_failures: int = 20  # failed logins per client IP before that IP is blocked
    otp_challenge_max_per_window: int = 3  # OTP requests per email per window
    otp_challenge_ip_max_per_window: int = 10  # OTP requests per client IP per window
    otp_challenge_window_minutes: int = 10
    otp_verify_max_failures: int = 5  # wrong codes per email before lockout (challenge is burned)
    otp_verify_ip_max_failures: int = 20
    # Only enable behind a trusted reverse proxy that overwrites X-Forwarded-For.
    trust_proxy_headers: bool = False

    # --- Password policy (applies when a password is set or changed, never at login) ---
    password_min_length: int = 10

    # demo = local outbox + demo Razorpay HMAC (not real merchant). live = real providers.
    integrations_mode: str = ""

    # Payment (Razorpay sandbox/live). Empty + non-demo = NOT_CONFIGURED (no fake paid).
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""  # webhook HMAC only — never put in frontend
    payment_provider: str = "razorpay"  # razorpay | stub

    # SMTP. Empty host + non-demo = NOT_CONFIGURED (no fake delivered).
    # SMTP_FROM should be a non-reply address once the school configures mail.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    school_display_name: str = "Queen Mira International School"

    # WhatsApp provider HTTP API. Empty URL + non-demo = NOT_CONFIGURED.
    whatsapp_api_url: str = ""
    whatsapp_api_token: str = ""
    whatsapp_from: str = ""
    # RFID / eSSL punch import — off until school confirms.
    rfid_import_enabled: bool = False

    # ProTrack365 Open API (https://api.protrack365.com) — bus GPS.
    # Admin panel account sees the full fleet; parent panel is the school parent login.
    protrack_admin_account: str = ""
    protrack_admin_password: str = ""
    protrack_parent_account: str = ""
    protrack_parent_password: str = ""

    @property
    def is_sqlite(self) -> bool:
        """True when DATABASE_URL targets SQLite (tests / local in-memory)."""
        return self.database_url.strip().lower().startswith("sqlite")

    @property
    def is_development(self) -> bool:
        return self.environment.strip().lower() in _DEVELOPMENT_NAMES

    @property
    def otp_debug_enabled(self) -> bool:
        """OTP codes are only ever echoed back in explicitly configured development."""
        return self.otp_debug and self.is_development

    @property
    def seed_demo_accounts(self) -> bool:
        """Demo logins (admin/hr/teacher...) are created only in development."""
        return self.is_development

    def insecure_production_problems(self) -> list[str]:
        problems: list[str] = []
        secret = self.jwt_secret.strip()
        lowered = secret.lower()
        if secret == DEFAULT_JWT_SECRET:
            problems.append("JWT_SECRET is the shipped default; generate a unique random secret")
        elif len(secret) < MIN_JWT_SECRET_LENGTH:
            problems.append(f"JWT_SECRET must be at least {MIN_JWT_SECRET_LENGTH} characters")
        elif any(marker in lowered for marker in _KNOWN_WEAK_SECRET_MARKERS):
            problems.append("JWT_SECRET looks like a placeholder; generate a unique random secret")
        if self.otp_debug:
            problems.append("OTP_DEBUG must be false (it discloses one-time codes in API responses)")
        if "*" in self.cors_origin_list:
            problems.append("CORS_ORIGINS must list explicit origins, not '*'")
        if str(os.environ.get("INTEGRATIONS_MODE", self.integrations_mode) or "").strip().lower() == "demo":
            problems.append("INTEGRATIONS_MODE=demo (fake payment/email providers) is not allowed")
        if "postgres:root@" in self.database_url:
            problems.append("DATABASE_URL uses the default database password")
        return problems

    @model_validator(mode="after")
    def _reject_insecure_non_development(self) -> "Settings":
        if self.is_development:
            return self
        problems = self.insecure_production_problems()
        if problems:
            raise InsecureConfigurationError(
                f"Refusing to start with ENVIRONMENT={self.environment!r}: "
                + "; ".join(problems)
                + ". For local work set ENVIRONMENT=development in backend/.env."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def demo_integrations(self) -> bool:
        # Prefer live process env so pytest can force stub while .env keeps demo defaults.
        mode = os.environ.get("INTEGRATIONS_MODE", self.integrations_mode)
        return str(mode or "").strip().lower() == "demo"

    @property
    def razorpay_configured(self) -> bool:
        if self.demo_integrations:
            return True
        kid = self.razorpay_key_id.strip()
        secret = self.razorpay_key_secret.strip()
        if not kid or not secret:
            return False
        # Demo placeholders in .env must not activate live Razorpay during stub/pytest.
        if kid.startswith("rzp_test_qmis_demo") or "not_for_prod" in secret:
            return False
        return True

    @property
    def smtp_configured(self) -> bool:
        if self.demo_integrations:
            return True
        host = self.smtp_host.strip()
        frm = self.smtp_from.strip()
        if not host or not frm:
            return False
        if host.endswith(".local") or "demo" in host.lower():
            return False
        return True

    @property
    def whatsapp_configured(self) -> bool:
        if self.demo_integrations:
            return True
        url = self.whatsapp_api_url.strip()
        token = self.whatsapp_api_token.strip()
        if not url or not token:
            return False
        if "demo.whatsapp.local" in url or token.startswith("qmis_demo_"):
            return False
        return True


settings = Settings()


def get_settings() -> Settings:
    """Compatibility helper for older services that call get_settings()."""
    return settings
