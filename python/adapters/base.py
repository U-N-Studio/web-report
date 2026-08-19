from abc import ABC, abstractmethod
from ..models import Video, Comment


class BaseAdapter(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def search(self, keyword: str) -> list[Video]: ...

    @abstractmethod
    async def fetch_comments(self, video_id: str) -> list[Comment]: ...

    async def fetch_homepage(self) -> list[Video]:
        return []
