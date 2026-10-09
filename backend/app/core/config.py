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
    upload_dir: str = "uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
