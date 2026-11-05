from .base import BaseAdapter

_adapters: dict[str, BaseAdapter] = {}


def register(adapter: BaseAdapter) -> None:
    _adapters[adapter.name] = adapter


def get(name: str) -> BaseAdapter:
    if name not in _adapters:
        raise ValueError(f"Adapter '{name}' not found. Available: {list(_adapters.keys())}")
    return _adapters[name]


def list_available() -> list[str]:
    return list(_adapters.keys())
