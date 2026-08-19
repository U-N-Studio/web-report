from fastapi import FastAPI
from fastapi.responses import JSONResponse
from .models import SearchRequest, SearchResponse, AnalysisRequest, AnalysisResponse, Video
from .adapters import get as get_adapter, list_available
from .ai import analyze_comments
from .config import get_config, update_config
from .adapters.bilibili import BilibiliAdapter  # noqa: F401
from .adapters.youtube import YouTubeAdapter  # noqa: F401

app = FastAPI(title="Web Report Engine")


@app.get("/health")
async def health():
    return {"status": "ok", "adapters": list_available()}


@app.post("/homepage", response_model=SearchResponse)
async def homepage(req: SearchRequest):
    adapter = get_adapter(req.platform)
    videos = await adapter.fetch_homepage()
    return SearchResponse(videos=videos)


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    adapter = get_adapter(req.platform)
    videos = await adapter.search(req.keyword)
    return SearchResponse(videos=videos)


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalysisRequest):
    adapter = get_adapter(req.platform)
    config = get_config()
    if req.ai_mode:
        config.mode = req.ai_mode
    if req.model_name:
        config.model_name = req.model_name

    comments = await adapter.fetch_comments(req.video_id)
    if not comments:
        return AnalysisResponse(
            video=Video(id=req.video_id, title="", url=""),
            comments=[],
            total=0,
            flagged=0,
        )

    if config.mode == "cloud" and not config.api_key:
        return JSONResponse(
            status_code=400,
            content={"detail": "未配置 AI API Key，请在设置页配置后重试"},
        )

    analyzed = await analyze_comments(comments, config, req.custom_rules)

    flagged = sum(1 for c in analyzed if c.is_violation)
    return AnalysisResponse(
        video=Video(id=req.video_id, title="", url=""),
        comments=analyzed,
        total=len(analyzed),
        flagged=flagged,
    )


@app.post("/config")
async def set_config(data: dict):
    extra = {}
    if "bilibiliSessdata" in data:
        extra["bilibili_sessdata"] = data.pop("bilibiliSessdata")
    if extra:
        data["extra"] = extra
    cfg = update_config(data)
    return cfg.model_dump()
