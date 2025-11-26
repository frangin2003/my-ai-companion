from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    suggestion_cooldown: int = 60
    monitor_interval: int = 10
    gemini_api_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
