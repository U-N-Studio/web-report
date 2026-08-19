import httpx
from ..models import AIConfig, AnalyzedComment, Comment
import json

DEFAULT_SYSTEM_PROMPT = """你是一个内容审核助手。分析以下评论，判断是否违规。
违规类别：涉政、涉黄、暴力、诈骗、仇恨言论、骚扰。
返回JSON格式：{"category": "类别或null", "is_violation": true/false, "confidence": 0.0-1.0, "reason": "判定理由"}"""


async def analyze_comments_local(
    comments: list[Comment], config: AIConfig, custom_rules: str | None = None
) -> list[AnalyzedComment]:
    system_prompt = custom_rules or DEFAULT_SYSTEM_PROMPT
    results = []

    async with httpx.AsyncClient() as client:
        for comment in comments:
            try:
                resp = await client.post(
                    f"{config.ollama_url}/api/generate",
                    json={
                        "model": config.model_name,
                        "prompt": f"{system_prompt}\n\n评论内容：{comment.content}",
                        "format": "json",
                        "stream": False,
                    },
                    timeout=60.0,
                )
                analysis = json.loads(resp.json().get("response", "{}"))
                results.append(AnalyzedComment(
                    **comment.model_dump(),
                    category=analysis.get("category"),
                    is_violation=analysis.get("is_violation", False),
                    confidence=analysis.get("confidence", 0.0),
                    ai_reason=analysis.get("reason"),
                ))
            except Exception as e:
                results.append(AnalyzedComment(
                    **comment.model_dump(),
                    ai_reason=f"本地AI分析失败: {str(e)}",
                ))

    return results
