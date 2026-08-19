from pydantic import BaseModel
from typing import Optional


class Video(BaseModel):
    id: str
    title: str
    url: str
    author: Optional[str] = None
    thumbnail: Optional[str] = None


class Comment(BaseModel):
    id: str
    author: Optional[str] = None
    content: str
    original_url: Optional[str] = None


class AnalyzedComment(Comment):
    category: Optional[str] = None
    is_violation: bool = False
    confidence: float = 0.0
    ai_reason: Optional[str] = None


class SearchRequest(BaseModel):
    platform: str
    keyword: str
    url: Optional[str] = None


class SearchResponse(BaseModel):
    videos: list[Video]


class AnalysisRequest(BaseModel):
    platform: str
    video_id: str
    ai_mode: str = "cloud"
    model_name: Optional[str] = None
    custom_rules: Optional[str] = None


class AnalysisResponse(BaseModel):
    video: Optional[Video] = None
    comments: list[AnalyzedComment]
    total: int
    flagged: int


class AIConfig(BaseModel):
    mode: str = "cloud"
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model_name: str = "gpt-4o-mini"
    ollama_url: str = "http://localhost:11434"
    extra: Optional[dict] = None
