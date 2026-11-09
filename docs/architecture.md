# 架构设计

## 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                     Electron 主进程 (main.ts)                 │
│                                                              │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │ IPC Handler │  │ SQLite DB     │  │ Backend Manager     │ │
│  │ (自动生成)   │  │ (better-      │  │ (HttpBackend +      │ │
│  │             │  │  sqlite3)     │  │  PythonProcessBridge)│ │
│  └──────┬──────┘  └───────────────┘  └─────────┬──────────┘ │
│         │                                      │            │
│         │ contextBridge.exposeInMainWorld       │ HTTP       │
│         │ (preload.ts)                         │ :8765      │
│         │                                      │ spawn/kill │
└─────────┼──────────────────────────────────────┼────────────┘
          │                                      │
┌─────────┼──────────────────────┐  ┌───────────┼────────────┐
│         ▼                      │  │           ▼            │
│  React Renderer (Chromium)     │  │  Python FastAPI         │
│                                │  │                         │
│  Pages:                        │  │  Endpoints:             │
│  - SearchPage (搜索+分析)       │  │  - GET  /health         │
│  - ReportPage (报告列表)        │  │  - POST /homepage       │
│  - ReportDetailPage (评论详情)  │  │  - POST /search         │
│  - SettingsPage (配置)          │  │  - POST /analyze        │
│                                │  │  - POST /config         │
│  UI: Ant Design 5              │  │                         │
│  Router: HashRouter            │  │  Adapters:              │
│                                │  │  - BilibiliAdapter      │
│  API Layer:                    │  │  - YouTubeAdapter       │
│  - Proxy 自动映射 IPC channel   │  │                         │
│  - camelCase→kebab-case 转换   │  │  AI Moderation:         │
│  - 零手写 wrapper              │  │  - cloud.py (OpenAI)    │
│                                │  │  - local.py (Ollama)    │
└────────────────────────────────┘  └─────────────────────────┘
```

## 目录结构

```
app/
├── shared/                    # 跨层共享 — 单一定义源
│   ├── ipc.ts                 #   IPC 契约 (channel 列表 + 类型映射)
│   └── types.ts               #   共享类型 (Video, Comment, Report, Settings)
│
├── electron/                  # Electron 主进程
│   ├── main.ts                #   入口：窗口创建、后端启停、IPC 注册
│   ├── preload.ts             #   preload：contextBridge 暴露 electronAPI
│   ├── ipc/
│   │   ├── index.ts           #   IPC 注册器（遍历 handlers 注册 ipcMain.handle）
│   │   └── handlers.ts        #   ⚙ 自动生成 — 通道→service 方法映射
│   ├── database/
│   │   ├── index.ts           #   SQLite 操作 (CRUD + settings)
│   │   └── migrations.ts      #   建表语句
│   ├── services/
│   │   └── report.ts          #   业务逻辑层（调用 backend API + DB）
│   └── backend/
│       ├── index.ts           #   BackendInstance 管理（init/get/start/stop）
│       ├── types.ts           #   IBackendAPI / IProcessBridge 接口
│       ├── http-backend.ts    #   HTTP 客户端实现 IBackendAPI
│       └── process-bridge.ts  #   Python 子进程管理（spawn/健康检查/超时清理）
│
├── frontend/                  # React 渲染进程
│   ├── index.html
│   └── src/
│       ├── main.tsx           #   React 入口
│       ├── App.tsx            #   路由定义
│       ├── services/
│       │   └── api.ts         #   Proxy API 层（自动映射 IPC channel）
│       ├── components/        #   UI 组件
│       │   ├── Layout.tsx
│       │   ├── SearchBar.tsx
│       │   └── CommentCard.tsx
│       └── pages/             #   页面
│           ├── SearchPage.tsx
│           ├── ReportPage.tsx
│           ├── ReportDetailPage.tsx
│           └── SettingsPage.tsx
│
├── backend/                   # Python FastAPI 后端
│   ├── main.py                #   FastAPI 入口 + 路由
│   ├── config.py              #   配置管理（camelCase→snake_case 转换）
│   ├── models.py              #   Pydantic 数据模型
│   ├── adapters/              #   平台适配器
│   │   ├── base.py            #     BaseAdapter ABC
│   │   ├── registry.py        #     注册/获取适配器
│   │   ├── bilibili.py        #     B站适配器
│   │   └── youtube.py         #     YouTube 适配器（占位）
│   └── moderation/            #   AI 内容审核
│       ├── gateway.py         #     路由（cloud/local）
│       ├── cloud.py           #     OpenAI API
│       └── local.py           #     Ollama API
│
├── scripts/
│   └── gen-ipc.ts             # 代码生成：从 shared/ipc.ts 生成 handlers.ts
│
├── tsconfig.json              # 前端 TS 配置（noEmit, type check only）
├── tsconfig.electron.json     # Electron TS 配置（commonjs, outDir: dist-electron）
├── vite.config.ts             # Vite 构建配置
├── electron-builder.yml       # 打包配置
└── package.json
```

## IPC 契约 — 单一定义源

整个 IPC 链路从 `shared/ipc.ts` 一处定义派生，任何新增通道只需修改此文件：

```
shared/ipc.ts (唯一定义源)
       │
       ├──→ gen-ipc.ts 读取 → 生成 electron/ipc/handlers.ts (运行时实现)
       ├──→ preload.ts 读取 → 运行时暴露 electronAPI (IPC_CHANNELS 遍历)
       └──→ api.ts 读取类型 → Proxy 自动映射方法名 (IpcService 映射类型)
```

### 通道定义

| Channel (kebab-case) | 前端方法 (camelCase) | 参数 | 返回值 | Handler |
|---|---|---|---|---|
| `fetch-homepage` | `fetchHomepage` | `platform: string` | `Video[]` | `reportService.fetchHomepage` |
| `search-videos` | `searchVideos` | `{ platform, keyword, url? }` | `Video[]` | `reportService.searchVideos` |
| `analyze-video` | `analyzeVideo` | `{ platform, videoId, aiMode, modelName?, customRules? }` | `{ reportId } & AnalyzeResult` | `reportService.analyzeAndSaveReport` |
| `get-reports` | `getReports` | — | `Report[]` | `reportService.getReports` |
| `get-report-detail` | `getReportDetail` | `reportId: string` | `ReportDetail` | `reportService.getReportDetail` |
| `update-comment-status` | `updateCommentStatus` | `commentId, isViolation` | `void` | `reportService.updateCommentStatus` |
| `get-settings` | `getSettings` | — | `Settings` | `reportService.getSettingsData` |
| `save-settings` | `saveSettings` | `settings: Settings` | `void` | `reportService.saveSettingsData` |

### 工作流：新增 IPC 通道

1. 在 `shared/ipc.ts` 的 `IPC_CHANNELS` 数组添加 channel 名
2. 在 `IpcChannels` 接口添加参数/返回值/handler 定义
3. 在 `scripts/gen-ipc.ts` 的 `channelMap` 添加参数签名
4. 在 `electron/services/report.ts` 实现 handler 方法
5. 运行 `npm run gen-ipc` → 自动重新生成 `handlers.ts`
6. 前端直接 `api.methodName(...)` 调用，无需手写 wrapper

### 构建链路

```
npm run build
  = tsx scripts/gen-ipc.ts          # 1. 生成 handlers.ts
  → tsc --project tsconfig.electron.json  # 2. 编译 electron + shared → dist-electron/
  → tsc-alias -p tsconfig.electron.json   # 3. 替换 @shared/* → 相对路径
  → vite build                       # 4. 打包前端 → dist/
```

## 通信机制

### Renderer ↔ Main (IPC)

```
前端调用                         Preload                      Main
api.fetchHomepage("bilibili")
  │
  ├─ Proxy.get("fetchHomepage")
  │    └─ camelToKebab → "fetch-homepage"
  │    └─ window.electronAPI["fetch-homepage"]("bilibili")
  │
  └─ ipcRenderer.invoke("fetch-homepage", "bilibili")
       │
       └─ ipcMain.handle("fetch-homepage", handler)
            └─ reportService.fetchHomepage("bilibili")
                 └─ getBackend().api.fetchHomepage("bilibili")
                      └─ HTTP POST http://127.0.0.1:8765/homepage
```

- `contextBridge.exposeInMainWorld('electronAPI', bridge)` — preload 遍历 `IPC_CHANNELS` 暴露所有通道
- `sandbox: false` — 允许 preload 使用 `require()` 加载 `@shared/ipc` 模块
- Proxy 自动将 camelCase 方法名转为 kebab-case channel 名

### Main ↔ Python (HTTP + 进程管理)

```
Electron 启动
  │
  ├─ createLocalPythonBackend()
  │    ├─ createPythonBridge() → spawn python -m uvicorn
  │    └─ new HttpBackend("http://127.0.0.1:8765")
  │
  ├─ backend.start()
  │    └─ processBridge.start()
  │         ├─ 监听 stdout/stderr 等待 readyPattern ("Application startup complete")
  │         ├─ 5 秒超时 → kill 进程 + reject
  │         └─ ready → resolve(port)
  │
  ├─ backend.api.checkHealth()     ← HTTP 确认服务可用
  │
  └─ getBackend().api.fetchHomepage / search / analyze / updateConfig
       └─ fetch(`${baseUrl}${path}`, { method, body })
```

- Python 作为子进程由 Electron 启停管理
- `HttpBackend` 实现 `IBackendAPI` 接口，通过 `fetch` 调用 FastAPI 端点
- `PythonProcessBridge` 管理 spawn/健康检查/超时清理/退出处理

## 数据流

### 搜索流程

```
用户输入关键词 → 点击搜索
  → api.searchVideos({ platform, keyword })
  → IPC: search-videos
  → reportService.searchVideos()
  → HttpBackend.search() → POST /search
  → Python: adapter.search(keyword)
  → 返回 Video[]
  → 前端展示视频列表
```

### 分析流程

```
用户点击"AI 分析"
  → api.analyzeVideo({ platform, videoId, aiMode })
  → IPC: analyze-video
  → reportService.analyzeAndSaveReport()
  → HttpBackend.analyze() → POST /analyze
  → Python:
      ├─ adapter.fetch_comments(video_id)
      ├─ analyze_comments(comments, config)
      │    ├─ cloud: OpenAI API (逐条分析, JSON 输出)
      │    └─ local: Ollama API
      └─ 返回 AnalysisResponse { video, comments, total, flagged }
  → Main: 写入 SQLite (report + comments)
  → 返回 { reportId, ...analyzeResp }
  → 前端跳转 /reports/{reportId}
```

### 人工复核流程

```
用户在报告详情页切换违规标记
  → api.updateCommentStatus(commentId, isViolation)
  → IPC: update-comment-status
  → reportService.updateCommentStatus()
  → updateCommentViolation() → UPDATE comments SET is_violation = ?
  → 前端刷新报告详情
```

### 设置同步流程

```
用户保存设置
  → api.saveSettings({ aiMode, apiKey, ... })
  → IPC: save-settings
  → reportService.saveSettingsData()
      ├─ saveSettings() → SQLite settings 表 (INSERT OR REPLACE)
      └─ getBackend().api.updateConfig() → POST /config
          → Python: config.py update_config()
              ├─ CAMEL_TO_SNAKE 映射 (apiKey→api_key, ...)
              ├─ bilibiliSessdata → extra.bilibili_sessdata
              └─ AIConfig(**mapped_data)
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
| category | TEXT | 违规类别 (涉政/涉黄/暴力/诈骗/仇恨言论/骚扰) |
| is_violation | BOOLEAN | 是否违规 |
| confidence | REAL | AI 置信度 (0.0-1.0) |
| ai_reason | TEXT | AI 判定理由 |
| created_at | DATETIME | 创建时间 |

### report_actions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 操作 ID |
| comment_id | TEXT FK | 关联评论 |
| action_type | TEXT | 操作类型 |
| status | TEXT | 状态 (pending) |
| result | TEXT | 结果 |
| created_at | DATETIME | 创建时间 |

### settings 表

| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT PK | 设置键名 |
| value | TEXT | 设置值 |

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
3. 前端 `SearchBar` 添加平台选项

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

- 调用 Ollama REST API (`/api/generate`)
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
| Python 进程未启动 | `HttpBackend` fetch 连接失败，前端显示错误 |
| Python 启动超时 | `process-bridge` 5 秒超时 → kill 进程 + reject |
| AI 单条分析失败 | 标记 `ai_reason="AI分析失败: ..."`，不阻断 |
| 视频无评论 | 返回空列表，前端提示无评论数据 |
| 设置 camelCase 不匹配 | `config.py` 的 `CAMEL_TO_SNAKE` 映射表自动转换 |
