from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình trung tâm cho hệ thống Backend Chợ Đồ Cũ Sinh Viên."""

    APP_NAME: str = "Chợ Đồ Cũ Sinh Viên API"
    APP_VERSION: str = "2.1.0"

    # Kết nối CSDL: Mặc định fallback sang SQLite khi chạy dev/test local nếu không cấu hình DATABASE_URL
    DATABASE_URL: str = "sqlite:///./chodocu.db"

    # Bảo mật & JWT
    JWT_SECRET_KEY: str = "super-secret-jwt-key-change-in-production-chodocusinhvien-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Quy tắc nghiệp vụ (Business Logic Rules)
    DAILY_LISTING_LIMIT: int = 5
    UPLOAD_DIR: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
