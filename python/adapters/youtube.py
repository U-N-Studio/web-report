from .base import BaseAdapter
from .registry import register
from ..models import Video, Comment


class YouTubeAdapter(BaseAdapter):
    @property
    def name(self) -> str:
        return "youtube"

    async def search(self, keyword: str) -> list[Video]:
        return []

    async def fetch_comments(self, video_id: str) -> list[Comment]:
        return []


register(YouTubeAdapter())
