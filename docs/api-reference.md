# API 参考

## Python FastAPI 后端

Base URL: `http://127.0.0.1:8765`

### GET /health

健康检查。

**Response:**
```json
{
  "status": "ok",
  "adapters": ["bilibili", "youtube"]
}
```

### POST /homepage

获取平台首页推荐视频。

**Request:**
```json
{
  "platform": "bilibili",
  "keyword": ""
}
```

**Response:**
```json
{
  "videos": [
    {
      "id": "117109229094045",
      "title": "视频标题",
      "url": "https://www.bilibili.com/video/av117109229094045",
      "author": "作者",
      "thumbnail": "https://i0.hdslb.com/..."
    }
  ]
}
```

### POST /search

搜索视频。

**Request:**
```json
{
  "platform": "bilibili",
  "keyword": "原神",
  "url": null
}
```

**Response:** 同 `/homepage`

### POST /analyze

AI 分析视频评论。

**Request:**
```json
{
  "platform": "bilibili",
  "video_id": "117109229094045",
  "ai_mode": "cloud",
  "model_name": null,
  "custom_rules": null
}
```

**Response (成功):**
```json
{
  "video": {
    "id": "117109229094045",
    "title": "",
    "url": ""
  },
  "comments": [
    {
      "id": "12345",
      "author": "用户A",
      "content": "评论内容",
      "original_url": null,
      "category": "涉黄",
      "is_violation": true,
      "confidence": 0.95,
      "ai_reason": "包含色情暗示内容"
    }
  ],
  "total": 50,
  "flagged": 3
}
```

**Response (无评论):**
```json
{
  "video": { "id": "...", "title": "", "url": "" },
  "comments": [],
  "total": 0,
  "flagged": 0
}
```

**Response (无 API Key):** `400 Bad Request`
```json
{
  "detail": "未配置 AI API Key，请在设置页配置后重试"
}
```

### POST /config

更新运行时配置。

**Request:**
```json
{
  "mode": "cloud",
  "api_key": "sk-...",
  "api_base": "https://api.openai.com/v1",
  "model_name": "gpt-4o-mini",
  "ollama_url": "http://localhost:11434",
  "bilibiliSessdata": "abc123..."
}
```

> `bilibiliSessdata` 会自动映射到 `extra.bilibili_sessdata`。

**Response:** 完整的 `AIConfig` 对象。

---

## Electron IPC API

通过 `window.electronAPI` 在 Renderer 进程调用。

### fetchHomepage(platform: string): Promise<Video[]>

获取平台首页视频列表。

### searchAndAnalyze(params): Promise<Video[]>

| 参数 | 类型 | 说明 |
|------|------|------|
| params.platform | string | 平台标识 |
| params.keyword | string | 搜索关键词 |
| params.url | string? | 可选 URL |

### analyzeVideo(params): Promise<AnalyzeResult>

| 参数 | 类型 | 说明 |
|------|------|------|
| params.platform | string | 平台标识 |
| params.videoId | string | 视频 ID |
| params.aiMode | string | "cloud" / "local" |
| params.modelName | string? | 覆盖模型名 |
| params.customRules | string? | 自定义审核规则 |

**返回值:**
```typescript
{
  reportId: string;
  total: number;
  flagged: number;
  comments: AnalyzedComment[];
}
```

### getReports(): Promise<Report[]>

获取所有报告列表。

### getReportDetail(reportId: string): Promise<ReportDetail>

获取报告详情（含评论列表）。

### updateCommentStatus(commentId: string, isViolation: boolean): Promise<void>

人工确认/修改评论违规标记。

### getSettings(): Promise<Settings>

获取当前设置。

### saveSettings(settings: Record<string, unknown>): Promise<void>

保存设置（同时更新 Python 后端配置）。

---

## 数据模型

### Video

```typescript
interface Video {
  id: string;
  title: string;
  url: string;
  author?: string;
  thumbnail?: string;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  author?: string;
  content: string;
  original_url?: string;
}
```

### AnalyzedComment extends Comment

```typescript
interface AnalyzedComment extends Comment {
  category?: string;      // 违规类别
  is_violation: boolean;  // 是否违规
  confidence: number;     // AI 置信度 0.0-1.0
  ai_reason?: string;     // AI 判定理由
}
```

### AIConfig

```typescript
interface AIConfig {
  mode: string;           // "cloud" | "local"
  api_key?: string;
  api_base?: string;
  model_name: string;
  ollama_url: string;
  extra?: Record<string, string>;  // 平台特有配置
}
```

### 违规类别

| 类别 | 说明 |
|------|------|
| 涉政 | 政治敏感内容 |
| 涉黄 | 色情/低俗内容 |
| 暴力 | 暴力/血腥内容 |
| 诈骗 | 诈骗/欺诈内容 |
| 仇恨言论 | 歧视/仇恨言论 |
| 骚扰 | 骚扰/人身攻击 |
