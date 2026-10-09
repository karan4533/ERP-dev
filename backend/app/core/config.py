import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "QMIS ERP API"
    database_url: str = "postgresql+psycopg://postgres:root@localhost:5432/qmis_erp"
    jwt_secret: str = "local-dev-change-me-qmis-erp-2026"
    jwt_expire_minutes: int = 480
    otp_expire_minutes: int = 10
    otp_debug: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    admin_seed_email: str = "admin@qmis.edu"
    admin_seed_password: str = "admin123"
    hr_seed_email: str = "hr@qmis.edu"
    hr_seed_password: str = "hr12345"
    accounthead_seed_email: str = "accounthead@qmis.edu"
    accounthead_seed_password: str = "accounts123"
    finance_assistant_seed_email: str = "finance.assistant@qmis.edu"
    finance_assistant_seed_password: str = "finance123"
    upload_dir: str = "uploads"

    # demo = local outbox + demo Razorpay HMAC (not real merchant). live = real providers.
    integrations_mode: str = ""

    # Payment (Razorpay sandbox/live). Empty + non-demo = stub gateway.
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    payment_provider: str = "razorpay"  # razorpay | stub

    # SMTP. Empty host + non-demo = stub email.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True

    # WhatsApp provider HTTP API. Empty URL + non-demo = stub.
    whatsapp_api_url: str = ""
    whatsapp_api_token: str = ""
    whatsapp_from: str = ""

    # RFID / eSSL punch import — off until school confirms.
    rfid_import_enabled: bool = False

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
