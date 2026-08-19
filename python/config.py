from .models import AIConfig

_config: AIConfig | None = None

def get_config() -> AIConfig:
    global _config
    if _config is None:
        _config = AIConfig()
    return _config

def update_config(data: dict) -> AIConfig:
    global _config
    _config = AIConfig(**data)
    return _config
