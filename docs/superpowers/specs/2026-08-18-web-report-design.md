# Web Report - 视频/博客评论 AI 审核与举报系统

## 概述

跨平台桌面应用，用于搜索视频/博客网站、爬取评论、AI 智能筛选分类、标记违规内容并生成本地报告，预留举报接口供后续对接。

## 架构

**方案 A：Electron + React + Python 后端**

```
┌─────────────────────────────────────────┐
│            Electron 主进程               │
│  - 窗口管理 / 托盘 / IPC 路由            │
│  - spawn Python 子进程 (FastAPI)         │
│  - 本地 SQLite (报告存储)                │
└──────────────┬──────────────────────────┘
               │ IPC / HTTP
┌──────────────┴──────────────────────────┐
│         React 渲染进程 (UI)              │
│  - 搜索/浏览页 / 评论分析 / 报告查看      │
│  - Ant Design 组件库                     │
└─────────────────────────────────────────┘
               │ HTTP (localhost)
┌──────────────┴──────────────────────────┐
│        Python 后端 (FastAPI)             │
│  - 平台爬取适配器 (可扩展接口)            │
│  - AI 分析引擎 (云端 API / 本地 Ollama)  │
│  - 评论分类 / 违规判定                   │
│  - 举报接口预留                          │
└─────────────────────────────────────────┘
```

## 核心模块

| 模块 | 职责 | 技术 |
|------|------|------|
| Electron Shell | 窗口、托盘、菜单、IPC | Electron 28+ |
| React UI | 所有界面交互 | React 18 + Ant Design 5 + TypeScript |
| Python Engine | 爬取、AI分析、分类 | FastAPI + httpx + BeautifulSoup |
| AI Gateway | 统一调度云端/本地模型 | OpenAI SDK + Ollama client |
| Report Store | 本地报告CRUD | better-sqlite3 (主进程) |
| Platform Adapters | 各平台爬取适配 | 抽象基类 + 插件注册 |

## 数据流

1. 用户输入 URL/关键词 → React → IPC → 主进程 → HTTP → Python
2. Python 爬取评论 → AI 分析分类 → 返回结果
3. 结果存 SQLite → React 展示报告
4. 用户确认违规 → 调用预留举报接口

## 平台适配器设计（可扩展）

```python
class BaseAdapter(ABC):
    @abstractmethod
    async def search(self, keyword: str) -> list[Video]: ...

    @abstractmethod
    async def fetch_comments(self, video_id: str) -> list[Comment]: ...

class BilibiliAdapter(BaseAdapter): ...
class YouTubeAdapter(BaseAdapter): ...
# 后续新增只需继承 BaseAdapter 并注册
```

适配器通过注册表动态加载，用户可在设置中启用/禁用。

## AI 分析引擎

### 双模式支持

- **云端**：OpenAI / Claude API，通过统一接口调用
- **本地**：Ollama HTTP API（默认 localhost:11434）

### 配置

用户在设置页选择模式 + 填写 API Key / 模型名。配置存储在 Electron 的 `userData` 目录。

### Prompt 模板

可自定义违规判定规则，默认内置中文内容审核规则（涉政、涉黄、暴力、诈骗等分类）。

## 本地报告存储

SQLite 表结构：

```sql
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    keyword TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_comments INTEGER DEFAULT 0,
    flagged_comments INTEGER DEFAULT 0
);

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id),
    author TEXT,
    content TEXT NOT NULL,
    original_url TEXT,
    category TEXT,
    is_violation BOOLEAN DEFAULT FALSE,
    confidence REAL DEFAULT 0.0,
    ai_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_actions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES comments(id),
    action_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 举报流程

分步骤实行：
1. AI 自动分类 + 标记疑似违规
2. 人工审核确认
3. 举报接口预留（`report_actions` 表记录状态）
4. 报告保存在本地

## 项目结构

```
web-report/
├── electron/              # Electron 主进程
│   ├── main.ts            # 入口
│   ├── ipc/               # IPC 处理器
│   ├── database/          # SQLite 操作
│   └── python-bridge.ts   # Python 子进程管理
├── src/                   # React 前端
│   ├── pages/             # 页面组件
│   │   ├── SearchPage     # 搜索页
│   │   ├── ReportPage     # 报告页
│   │   └── SettingsPage   # 设置页
│   ├── components/        # 通用组件
│   ├── stores/            # 状态管理 (Zustand)
│   └── services/          # API 调用
├── python/                # Python 后端
│   ├── main.py            # FastAPI 入口
│   ├── adapters/          # 平台适配器
│   │   ├── base.py
│   │   ├── bilibili.py
│   │   └── youtube.py
│   ├── ai/                # AI 引擎
│   │   ├── gateway.py
│   │   ├── cloud.py
│   │   └── local.py
│   ├── models/            # 数据模型
│   └── config.py          # 配置
├── package.json
├── pyproject.toml
├── electron-builder.yml   # 打包配置
└── tsconfig.json
```

## 跨平台支持

- Windows / macOS / Linux
- 使用 electron-builder 打包
- Python 后端通过 PyInstaller 打包为独立可执行文件，随 Electron 一起分发

## 技术约束

- Electron >= 28 (支持最新 Chrome)
- Node.js >= 18
- Python >= 3.10
- React 18 + TypeScript
- 状态管理: Zustand (轻量)
- 前端构建: Vite
