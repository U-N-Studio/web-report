from openai import AsyncOpenAI
from ..models import AIConfig, AnalyzedComment, Comment
import json

DEFAULT_SYSTEM_PROMPT = """你是一个内容审核助手。分析以下评论，判断是否违规。
违规类别：涉政、涉黄、暴力、诈骗、仇恨言论、骚扰。
返回JSON格式：{"category": "类别或null", "is_violation": true/false, "confidence": 0.0-1.0, "reason": "判定理由"}"""


async def analyze_comments_cloud(
    comments: list[Comment], config: AIConfig, custom_rules: str | None = None
) -> list[AnalyzedComment]:
    client = AsyncOpenAI(api_key=config.api_key, base_url=config.api_base)
    system_prompt = custom_rules or DEFAULT_SYSTEM_PROMPT
    results = []

    for comment in comments:
        try:
            resp = await client.chat.completions.create(
                model=config.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"评论内容：{comment.content}"},
                ],
                response_format={"type": "json_object"},
            )
            analysis = json.loads(resp.choices[0].message.content)
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
                ai_reason=f"AI分析失败: {str(e)}",
            ))

    return results
