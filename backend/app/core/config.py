from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    DATABASE_URL: str = (
        "sqlite:///./trustgrc.db"
    )

    # -----------------------------------------------------
    # AUTHENTICATION / JWT
    # -----------------------------------------------------

    JWT_SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # -----------------------------------------------------
    # APPLICATION
    # -----------------------------------------------------

    APP_NAME: str = "TrustGRC AI 360"

    FRONTEND_URL: str = (
        "http://localhost:3000"
    )

    # -----------------------------------------------------
    # EMAIL / SMTP
    # -----------------------------------------------------

    SMTP_HOST: str | None = None

    SMTP_PORT: int = 587

    SMTP_USERNAME: str | None = None

    SMTP_PASSWORD: str | None = None

    SMTP_FROM_EMAIL: str | None = None

    SMTP_FROM_NAME: str = (
        "TrustGRC AI 360"
    )

    SMTP_USE_TLS: bool = True

    SMTP_USE_SSL: bool = False

    EMAIL_VERIFICATION_EXPIRY_MINUTES: int = 30

    EMAIL_ENABLED: bool = False

    # -----------------------------------------------------
    # PYDANTIC SETTINGS
    # -----------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()