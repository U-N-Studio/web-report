# 架构设计

## 整体架构

```
┌─────────────────────────────────────────────┐
│              Electron 主进程                  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ IPC 处理  │  │ SQLite   │  │ Python    │ │
│  │ (report/ │  │ Database │  │ Bridge    │ │
│  │  settings)│  │          │  │           │ │
│  └────┬─────┘  └──────────┘  └─────┬─────┘ │
│       │                            │       │
│       │ IPC (contextBridge)        │ HTTP  │
│       │                            │ :8765 │
└───────┼────────────────────────────┼───────┘
        │                            │
┌───────┼────────────────┐  ┌───────┼───────┐
│       ▼                │  │       ▼       │
│  React Renderer        │  │  Python       │
│  (Chromium)            │  │  FastAPI      │
│                        │  │               │
│  - SearchPage          │  │ - /health     │
│  - ReportPage          │  │ - /homepage   │
│  - SettingsPage        │  │ - /search     │
│  - ReportDetailPage    │  │ - /analyze    │
│                        │  │ - /config     │
│  State: Zustand        │  │               │
│  UI: Ant Design 5     │  │ Adapters:     │
│                        │  │ - Bilibili    │
│                        │  │ - YouTube     │
│                        │  │               │
│                        │  │ AI Engine:    │
│                        │  │ - Cloud API   │
│                        │  │ - Ollama      │
└────────────────────────┘  └───────────────┘
```

## 通信机制

### Electron ↔ Renderer (IPC)

通过 `contextBridge.exposeInMainWorld` 暴露 `electronAPI` 对象：

| 方法 | 方向 | 说明 |
|------|------|------|
| `fetchHomepage(platform)` | R→M | 获取平台首页 |
| `searchAndAnalyze(params)` | R→M | 搜索视频 |
| `analyzeVideo(params)` | R→M | AI 分析评论 |
| `getReports()` | R→M | 获取报告列表 |
| `getReportDetail(id)` | R→M | 获取报告详情 |
| `updateCommentStatus(id, isViolation)` | R→M | 人工确认违规 |
| `getSettings()` | R→M | 获取设置 |
| `saveSettings(settings)` | R→M | 保存设置 |

### Electron ↔ Python (HTTP)

主进程通过 `pythonFetch()` 代理 HTTP 请求到 `http://127.0.0.1:8765`：

- 自动检查 `resp.ok`，非 2xx 抛出错误
- Python 作为子进程由 Electron 启停管理

## 数据流

### 搜索流程

```
用户输入关键词
  → Renderer IPC: search-and-analyze
  → Main pythonFetch: POST /search
  → Python Adapter.search(keyword)
  → 返回 Video[]
  → Renderer 展示视频列表
```

### 分析流程

```
用户点击"AI 分析"
  → Renderer IPC: analyze-video
  → Main pythonFetch: POST /analyze
  → Python Adapter.fetch_comments(video_id)
  → Python AI.analyze_comments(comments, config)
  → 返回 AnalysisResponse { comments, total, flagged }
  → Main 写入 SQLite (report + comments)
  → Renderer 跳转报告详情页
```

### 人工复核流程

```
用户在报告详情页确认/修改违规标记
  → Renderer IPC: update-comment-status
  → Main 更新 SQLite is_violation
```

## 数据库设计

### reports 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| platform | TEXT | bilibili / youtube |
| url | TEXT | 视频 URL |
| title | TEXT | 视频标题 |
| keyword | TEXT | 搜索关键词 |
| total_comments | INTEGER | 总评论数 |
| flagged_comments | INTEGER | 违规评论数 |
| created_at | DATETIME | 创建时间 |

### comments 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 评论 ID |
| report_id | TEXT FK | 关联报告 |
| author | TEXT | 评论作者 |
| content | TEXT | 评论内容 |
| original_url | TEXT | 原始链接 |
| category | TEXT | 违规类别 |
| is_violation | BOOLEAN | 是否违规 |
| confidence | REAL | AI 置信度 |
| ai_reason | TEXT | AI 判定理由 |

## 平台适配器

基于 `BaseAdapter` ABC 的注册模式：

```python
class BaseAdapter(ABC):
    @property
    def name(self) -> str: ...
    async def fetch_homepage(self) -> list[Video]: ...
    async def search(self, keyword: str) -> list[Video]: ...
    async def fetch_comments(self, video_id: str) -> list[Comment]: ...
```

新增平台只需：
1. 实现 `BaseAdapter`
2. 调用 `register(adapter)` 注册
3. 前端 SearchBar 添加平台选项

### Bilibili 适配器

- 首页: `x/web-interface/ranking/v2` 排行榜 API
- 搜索: `x/web-interface/search/all/v2`
- 评论: `x/v2/reply` (需要 SESSDATA Cookie)
- Cookie: 从 `AIConfig.extra.bilibili_sessdata` 读取

## AI 引擎

### 云端模式 (cloud.py)

- 使用 OpenAI SDK (`AsyncOpenAI`)
- 支持 OpenAI 兼容的第三方 API (通过 `api_base` 配置)
- `response_format: json_object` 强制 JSON 输出
- 逐条分析，单条失败不阻断整体

### 本地模式 (local.py)

- 调用 Ollama REST API
- 默认 `http://localhost:11434`
- 相同的 JSON 输出格式

### 审核 Prompt

```
你是一个内容审核助手。分析以下评论，判断是否违规。
违规类别：涉政、涉黄、暴力、诈骗、仇恨言论、骚扰。
返回JSON格式：{"category": "类别或null", "is_violation": true/false, "confidence": 0.0-1.0, "reason": "判定理由"}
```

支持自定义规则覆盖默认 Prompt。

## 错误处理

| 场景 | 处理 |
|------|------|
| B站无 SESSDATA | 评论返回空，前端提示配置 Cookie |
| AI 无 API Key | `/analyze` 返回 400，前端提示配置 Key |
| Python 进程未启动 | `pythonFetch` 连接失败，前端显示错误 |
| AI 单条分析失败 | 标记 `ai_reason="AI分析失败: ..."`，不阻断 |
| 视频无评论 | 返回空列表，前端提示无评论数据 |
