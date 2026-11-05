from ..models import AIConfig, AnalyzedComment, Comment
from .cloud import analyze_comments_cloud
from .local import analyze_comments_local


async def analyze_comments(
    comments: list[Comment],
    config: AIConfig,
    custom_rules: str | None = None,
) -> list[AnalyzedComment]:
    if config.mode == "local":
        return await analyze_comments_local(comments, config, custom_rules)
    return await analyze_comments_cloud(comments, config, custom_rules)
