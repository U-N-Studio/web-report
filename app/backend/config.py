from .models import AIConfig

_config: AIConfig | None = None

CAMEL_TO_SNAKE = {
    "aiMode": "mode",
    "apiKey": "api_key",
    "apiBase": "api_base",
    "modelName": "model_name",
    "ollamaUrl": "ollama_url",
}

def get_config() -> AIConfig:
    global _config
    if _config is None:
        _config = AIConfig()
    return _config

def update_config(data: dict) -> AIConfig:
    global _config
    extra = data.pop("extra", None)
    mapped = {CAMEL_TO_SNAKE.get(k, k): v for k, v in data.items()}
    if extra:
        mapped["extra"] = extra
    _config = AIConfig(**mapped)
    return _config
