import httpx
from .base import BaseAdapter
from .registry import register
from ..models import Video, Comment


class BilibiliAdapter(BaseAdapter):
    @property
    def name(self) -> str:
        return "bilibili"

    def _headers(self) -> dict:
        from ..config import get_config
        config = get_config()
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        cookie = ""
        if config.extra and "bilibili_sessdata" in config.extra:
            cookie = f"SESSDATA={config.extra['bilibili_sessdata']}; "
        if config.extra and "bilibili_cookie" in config.extra:
            cookie += config.extra["bilibili_cookie"]
        if cookie:
            headers["Cookie"] = cookie.strip()
        return headers

    async def fetch_homepage(self) -> list[Video]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.bilibili.com/x/web-interface/ranking/v2",
                params={"rid": 0, "type": "all"},
                headers=self._headers(),
            )
            data = resp.json()
            items = data.get("data", {}).get("list", [])[:30]
            videos = []
            for v in items:
                videos.append(Video(
                    id=str(v.get("aid", "")),
                    title=v.get("title", ""),
                    url=v.get("short_link_v2") or f"https://www.bilibili.com/video/av{v.get('aid', '')}",
                    author=v.get("owner", {}).get("name"),
                    thumbnail=v.get("pic", "").replace("http://", "https://"),
                ))
            return videos

    async def search(self, keyword: str) -> list[Video]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.bilibili.com/x/web-interface/search/all/v2",
                params={"keyword": keyword},
                headers=self._headers(),
            )
            data = resp.json()
            results = data.get("data", {}).get("result", [])
            videos = []
            for item in results:
                if item.get("result_type") == "video":
                    for v in item.get("data", [])[:20]:
                        videos.append(Video(
                            id=str(v.get("aid", "")),
                            title=v.get("title", "").replace('<em class="keyword">', "").replace("</em>", ""),
                            url=f"https://www.bilibili.com/video/av{v.get('aid', '')}",
                            author=v.get("author"),
                        ))
            return videos

    async def fetch_comments(self, video_id: str) -> list[Comment]:
        async with httpx.AsyncClient() as client:
            comments = []
            for page in range(1, 4):
                resp = await client.get(
                    "https://api.bilibili.com/x/v2/reply",
                    params={"type": 1, "oid": int(video_id), "pn": page, "ps": 20},
                    headers=self._headers(),
                )
                data = resp.json()
                replies = data.get("data", {}).get("replies", []) or []
                for r in replies:
                    comments.append(Comment(
                        id=str(r.get("rpid", "")),
                        author=r.get("member", {}).get("uname"),
                        content=r.get("content", {}).get("message", ""),
                    ))
                    for sub in r.get("replies", []) or []:
                        comments.append(Comment(
                            id=str(sub.get("rpid", "")),
                            author=sub.get("member", {}).get("uname"),
                            content=sub.get("content", {}).get("message", ""),
                        ))
                if len(replies) < 20:
                    break
            return comments


register(BilibiliAdapter())
