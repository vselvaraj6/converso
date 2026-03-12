from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Application
    app_name: str = Field(default="Converso", env="APP_NAME")
    app_env: str = Field(default="development", env="APP_ENV")
    app_port: int = Field(default=8000, env="APP_PORT")
    app_host: str = Field(default="0.0.0.0", env="APP_HOST")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://converso:password@localhost:5432/converso",
        env="DATABASE_URL"
    )
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Security
    secret_key: str = Field(default="secret-key", env="SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Twilio
    twilio_account_sid: str = Field(default="", env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="", env="TWILIO_AUTH_TOKEN")
    twilio_phone_number: str = Field(default="", env="TWILIO_PHONE_NUMBER")
    
    # OpenAI
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4-turbo", env="OPENAI_MODEL")
    
    # Cal.com (self-hosted)
    calcom_base_url: str = Field(default="", env="CALCOM_BASE_URL")
    calcom_api_key: str = Field(default="", env="CALCOM_API_KEY")
    calcom_webhook_secret: str = Field(default="", env="CALCOM_WEBHOOK_SECRET")

    # VAPI
    vapi_api_key: str = Field(default="", env="VAPI_API_KEY")
    vapi_base_url: str = Field(default="https://api.vapi.ai", env="VAPI_BASE_URL")
    
    # Celery
    celery_broker_url: str = Field(default="redis://localhost:6379/1", env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()