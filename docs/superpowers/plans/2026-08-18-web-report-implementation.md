# Web Report 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建跨平台 Electron 桌面应用，搜索视频/博客、AI 筛选评论、分类标记违规、生成本地报告。

**Architecture:** Electron 主进程管理窗口 + SQLite + spawn Python 子进程；React 渲染进程做 UI；Python FastAPI 做爬取和 AI 分析。三层通过 IPC 和 HTTP 通信。

**Tech Stack:** Electron 28+, React 18, TypeScript, Ant Design 5, Zustand, Vite, better-sqlite3, Python 3.10+, FastAPI, httpx, BeautifulSoup, OpenAI SDK, Ollama

---

## 文件结构

```
web-report/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── electron-builder.yml
├── index.html
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/
│   │   ├── index.ts
│   │   ├── report.ts
│   │   └── settings.ts
│   ├── database/
│   │   ├── index.ts
│   │   └── migrations.ts
│   └── python-bridge.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── pages/
│   │   ├── SearchPage.tsx
│   │   ├── ReportPage.tsx
│   │   ├── ReportDetailPage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── CommentCard.tsx
│   │   └── SearchBar.tsx
│   ├── stores/
│   │   ├── reportStore.ts
│   │   └── settingsStore.ts
│   └── services/
│       └── api.ts
├── python/
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── registry.py
│   │   ├── bilibili.py
│   │   └── youtube.py
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── gateway.py
│   │   ├── cloud.py
│   │   └── local.py
│   └── requirements.txt
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

### Task 1: 项目脚手架 - Electron + React + Vite

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 初始化 package.json 并安装核心依赖**

```bash
cd D:\project\web-report
npm init -y
npm install electron@latest react@18 react-dom@18 antd@5 zustand@4 react-router-dom@6 better-sqlite3@11 uuid@9
npm install -D typescript@5 vite@5 @vitejs/plugin-react@4 electron-builder@24 ts-node@10 @types/react@18 @types/react-dom@18 @types/better-sqlite3@11 @types/uuid@9 vite-plugin-electron@0 vite-plugin-electron-renderer@0
```

- [ ] **Step 2: 创建 package.json 脚本配置**

在 `package.json` 中设置:

```json
{
  "name": "web-report",
  "version": "0.1.0",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "vite --mode electron",
    "electron:build": "vite build && electron-builder"
  }
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "electron"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "electron"]
}
```

- [ ] **Step 5: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 6: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Report - 评论审核系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Web Report',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

- [ ] **Step 8: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  searchAndAnalyze: (params: { platform: string; keyword: string; url?: string }) =>
    ipcRenderer.invoke('search-and-analyze', params),
  getReports: () => ipcRenderer.invoke('get-reports'),
  getReportDetail: (reportId: string) => ipcRenderer.invoke('get-report-detail', reportId),
  updateCommentStatus: (commentId: string, isViolation: boolean) =>
    ipcRenderer.invoke('update-comment-status', commentId, isViolation),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('save-settings', settings),
  onAnalysisProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('analysis-progress', (_event, data) => callback(data));
  },
});
```

- [ ] **Step 9: 创建 src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 10: 创建 src/App.tsx (基础路由骨架)**

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import ReportPage from './pages/ReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 11: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    searchAndAnalyze: (params: { platform: string; keyword: string; url?: string }) => Promise<unknown>;
    getReports: () => Promise<unknown[]>;
    getReportDetail: (reportId: string) => Promise<unknown>;
    updateCommentStatus: (commentId: string, isViolation: boolean) => Promise<void>;
    getSettings: () => Promise<Record<string, unknown>>;
    saveSettings: (settings: Record<string, unknown>) => Promise<void>;
    onAnalysisProgress: (callback: (progress: unknown) => void) => void;
  };
}
```

- [ ] **Step 12: 创建占位页面和布局组件**

`src/components/Layout.tsx`:
```tsx
import { Layout as AntLayout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, FileText, Setting } from '@ant-design/icons';

const { Header, Content } = AntLayout;

const menuItems = [
  { key: '/', label: '搜索分析', icon: <Search /> },
  { key: '/reports', label: '报告列表', icon: <FileText /> },
  { key: '/settings', label: '设置', icon: <Setting /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 40 }}>
          Web Report
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </AntLayout>
  );
}
```

`src/pages/SearchPage.tsx`:
```tsx
export default function SearchPage() {
  return <div>搜索分析页（待实现）</div>;
}
```

`src/pages/ReportPage.tsx`:
```tsx
export default function ReportPage() {
  return <div>报告列表页（待实现）</div>;
}
```

`src/pages/ReportDetailPage.tsx`:
```tsx
export default function ReportDetailPage() {
  return <div>报告详情页（待实现）</div>;
}
```

`src/pages/SettingsPage.tsx`:
```tsx
export default function SettingsPage() {
  return <div>设置页（待实现）</div>;
}
```

- [ ] **Step 13: 验证 Electron 启动**

```bash
cd D:\project\web-report
npm run dev
```

Expected: Electron 窗口打开，显示带导航的骨架页面。

- [ ] **Step 14: Commit**

```bash
cd D:\project\web-report
git init
git add -A
git commit -m "feat: scaffold Electron + React + Vite project"
```

---

### Task 2: SQLite 数据库层

**Files:**
- Create: `electron/database/index.ts`
- Create: `electron/database/migrations.ts`

- [ ] **Step 1: 创建 electron/database/migrations.ts**

```typescript
export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    keyword TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_comments INTEGER DEFAULT 0,
    flagged_comments INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
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
  )`,
  `CREATE TABLE IF NOT EXISTS report_actions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES comments(id),
    action_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];
```

- [ ] **Step 2: 创建 electron/database/index.ts**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { MIGRATIONS } from './migrations';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'web-report.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations();
  }
  return db;
}

function runMigrations() {
  if (!db) return;
  const run = db.transaction(() => {
    for (const sql of MIGRATIONS) {
      db!.exec(sql);
    }
  });
  run();
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export function createReport(report: {
  id: string;
  platform: string;
  url: string;
  title?: string;
  keyword?: string;
  totalComments: number;
  flaggedComments: number;
}) {
  const d = getDatabase();
  d.prepare(
    `INSERT INTO reports (id, platform, url, title, keyword, total_comments, flagged_comments)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(report.id, report.platform, report.url, report.title ?? null, report.keyword ?? null, report.totalComments, report.flaggedComments);
  return report.id;
}

export function insertComment(comment: {
  id: string;
  reportId: string;
  author?: string;
  content: string;
  originalUrl?: string;
  category?: string;
  isViolation: boolean;
  confidence: number;
  aiReason?: string;
}) {
  const d = getDatabase();
  d.prepare(
    `INSERT INTO comments (id, report_id, author, content, original_url, category, is_violation, confidence, ai_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(comment.id, comment.reportId, comment.author ?? null, comment.content, comment.originalUrl ?? null, comment.category ?? null, comment.isViolation ? 1 : 0, comment.confidence, comment.aiReason ?? null);
}

export function getAllReports() {
  const d = getDatabase();
  return d.prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all();
}

export function getReportById(id: string) {
  const d = getDatabase();
  const report = d.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
  const comments = d.prepare(`SELECT * FROM comments WHERE report_id = ?`).all(id);
  return { ...report, comments };
}

export function updateCommentViolation(id: string, isViolation: boolean) {
  const d = getDatabase();
  d.prepare(`UPDATE comments SET is_violation = ? WHERE id = ?`).run(isViolation ? 1 : 0, id);
}

export function getSettings() {
  const d = getDatabase();
  d.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  const rows = d.prepare(`SELECT key, value FROM settings`).all();
  const result: Record<string, string> = {};
  for (const row of rows as { key: string; value: string }[]) {
    result[row.key] = row.value;
  }
  return result;
}

export function saveSettings(settings: Record<string, unknown>) {
  const d = getDatabase();
  d.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  const upsert = d.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  const run = d.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, JSON.stringify(value));
    }
  });
  run();
}
```

- [ ] **Step 3: 在 electron/main.ts 中集成数据库**

在 `app.whenReady()` 后初始化数据库，在 `app.on('window-all-closed')` 中关闭：

```typescript
// 在 electron/main.ts 顶部添加 import
import { getDatabase, closeDatabase } from './database';

// 修改 app.whenReady
app.whenReady().then(() => {
  getDatabase();
  createWindow();
});

// 修改 window-all-closed
app.on('window-all-closed', () => {
  closeDatabase();
  app.quit();
});
```

- [ ] **Step 4: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: add SQLite database layer with migrations"
```

---

### Task 3: Python 后端 - FastAPI 基础 + 数据模型

**Files:**
- Create: `python/main.py`
- Create: `python/models.py`
- Create: `python/config.py`
- Create: `python/requirements.txt`
- Create: `python/adapters/__init__.py`
- Create: `python/adapters/base.py`
- Create: `python/adapters/registry.py`
- Create: `python/ai/__init__.py`
- Create: `python/ai/gateway.py`
- Create: `python/ai/cloud.py`
- Create: `python/ai/local.py`

- [ ] **Step 1: 创建 python/requirements.txt**

```
fastapi==0.111.0
uvicorn==0.30.1
httpx==0.27.0
beautifulsoup4==4.12.3
openai==1.35.0
pydantic==2.7.3
```

- [ ] **Step 2: 创建 python/models.py**

```python
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
    video: Video
    comments: list[AnalyzedComment]
    total: int
    flagged: int


class AIConfig(BaseModel):
    mode: str = "cloud"
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model_name: str = "gpt-4o-mini"
    ollama_url: str = "http://localhost:11434"
```

- [ ] **Step 3: 创建 python/config.py**

```python
import json
import os
from .models import AIConfig

_config: AIConfig | None = None

def get_config() -> AIConfig:
    global _config
    if _config is None:
        _config = AIConfig()
    return _config

def update_config(data: dict) -> AIConfig:
    global _config
    _config = AIConfig(**data)
    return _config
```

- [ ] **Step 4: 创建 python/adapters/base.py**

```python
from abc import ABC, abstractmethod
from ..models import Video, Comment


class BaseAdapter(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def search(self, keyword: str) -> list[Video]: ...

    @abstractmethod
    async def fetch_comments(self, video_id: str) -> list[Comment]: ...
```

- [ ] **Step 5: 创建 python/adapters/registry.py**

```python
from .base import BaseAdapter

_adapters: dict[str, BaseAdapter] = {}


def register(adapter: BaseAdapter) -> None:
    _adapters[adapter.name] = adapter


def get(name: str) -> BaseAdapter:
    if name not in _adapters:
        raise ValueError(f"Adapter '{name}' not found. Available: {list(_adapters.keys())}")
    return _adapters[name]


def list_available() -> list[str]:
    return list(_adapters.keys())
```

- [ ] **Step 6: 创建 python/adapters/__init__.py**

```python
from .base import BaseAdapter
from .registry import register, get, list_available
```

- [ ] **Step 7: 创建占位适配器 python/adapters/bilibili.py**

```python
import httpx
from .base import BaseAdapter
from .registry import register
from ..models import Video, Comment


class BilibiliAdapter(BaseAdapter):
    @property
    def name(self) -> str:
        return "bilibili"

    async def search(self, keyword: str) -> list[Video]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.bilibili.com/x/web-interface/search/all/v2",
                params={"keyword": keyword},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            data = resp.json()
            results = data.get("data", {}).get("result", [])
            videos = []
            for item in results:
                if item.get("result_type") == "video":
                    for v in item.get("data", [])[:20]:
                        videos.append(Video(
                            id=str(v.get("aid", "")),
                            title=v.get("title", "").replace("<em class=\"keyword\">", "").replace("</em>", ""),
                            url=f"https://www.bilibili.com/video/av{v.get('aid', '')}",
                            author=v.get("author"),
                        ))
            return videos

    async def fetch_comments(self, video_id: str) -> list[Comment]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.bilibili.com/x/v2/reply",
                params={"type": 1, "oid": int(video_id), "pn": 1, "ps": 50},
                headers={"User-Agent": "Mozilla/5.0"},
            )
            data = resp.json()
            replies = data.get("data", {}).get("replies", []) or []
            comments = []
            for r in replies:
                comments.append(Comment(
                    id=str(r.get("rpid", "")),
                    author=r.get("member", {}).get("uname"),
                    content=r.get("content", {}).get("message", ""),
                ))
            return comments


register(BilibiliAdapter())
```

- [ ] **Step 8: 创建占位适配器 python/adapters/youtube.py**

```python
from .base import BaseAdapter
from .registry import register
from ..models import Video, Comment


class YouTubeAdapter(BaseAdapter):
    @property
    def name(self) -> str:
        return "youtube"

    async def search(self, keyword: str) -> list[Video]:
        return []

    async def fetch_comments(self, video_id: str) -> list[Comment]:
        return []


register(YouTubeAdapter())
```

- [ ] **Step 9: 创建 python/ai/cloud.py**

```python
from openai import AsyncOpenAI
from ..models import AIConfig, AnalyzedComment, Comment

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
            import json
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
```

- [ ] **Step 10: 创建 python/ai/local.py**

```python
import httpx
from ..models import AIConfig, AnalyzedComment, Comment

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
                import json
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
```

- [ ] **Step 11: 创建 python/ai/gateway.py**

```python
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
```

- [ ] **Step 12: 创建 python/ai/__init__.py**

```python
from .gateway import analyze_comments
```

- [ ] **Step 13: 创建 python/main.py**

```python
import asyncio
from fastapi import FastAPI
from .models import SearchRequest, SearchResponse, AnalysisRequest, AnalysisResponse
from .adapters import get as get_adapter, list_available
from .ai import analyze_comments
from .config import get_config, update_config
from .adapters.bilibili import BilibiliAdapter  # noqa: F401 - triggers register
from .adapters.youtube import YouTubeAdapter  # noqa: F401 - triggers register

app = FastAPI(title="Web Report Engine")


@app.get("/health")
async def health():
    return {"status": "ok", "adapters": list_available()}


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

    videos = await adapter.search("")  # placeholder; video_id used directly
    video = videos[0] if videos else None
    comments = await adapter.fetch_comments(req.video_id)
    analyzed = await analyze_comments(comments, config, req.custom_rules)

    flagged = sum(1 for c in analyzed if c.is_violation)
    return AnalysisResponse(
        video=video,
        comments=analyzed,
        total=len(analyzed),
        flagged=flagged,
    )


@app.post("/config")
async def set_config(data: dict):
    cfg = update_config(data)
    return cfg.model_dump()
```

- [ ] **Step 14: 验证 Python 后端启动**

```bash
cd D:\project\web-report\python
pip install -r requirements.txt
python -m uvicorn main:app --port 8765 --reload
```

在另一终端:
```bash
curl http://localhost:8765/health
```

Expected: `{"status":"ok","adapters":["bilibili","youtube"]}`

- [ ] **Step 15: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: add Python FastAPI backend with adapters and AI engine"
```

---

### Task 4: Python Bridge - Electron 管理 Python 子进程

**Files:**
- Create: `electron/python-bridge.ts`

- [ ] **Step 1: 创建 electron/python-bridge.ts**

```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';
import httpx from 'httpx'; // 使用 Node 内置 fetch

let pythonProcess: ChildProcess | null = null;
let pythonPort = 8765;
let pythonReady = false;

function getPythonExecutable(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'web-report-engine');
  }
  return 'python';
}

function getPythonCwd(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python');
  }
  return path.join(app.getAppPath(), 'python');
}

export async function startPythonBackend(): Promise<number> {
  return new Promise((resolve, reject) => {
    const cwd = getPythonCwd();
    const isDev = !app.isPackaged;

    const args = isDev
      ? ['-m', 'uvicorn', 'main:app', '--port', String(pythonPort), '--host', '127.0.0.1']
      : [];

    pythonProcess = spawn(getPythonExecutable(), args, {
      cwd,
      env: { ...process.env, PYTHONPATH: cwd },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    pythonProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (!pythonReady && msg.includes('Uvicorn running')) {
        pythonReady = true;
        resolve(pythonPort);
      }
    });

    pythonProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (!pythonReady && msg.includes('Uvicorn running')) {
        pythonReady = true;
        resolve(pythonPort);
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      if (!pythonReady) {
        pythonReady = true;
        resolve(pythonPort);
      }
    }, 5000);
  });
}

export function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    pythonReady = false;
  }
}

export async function pythonFetch(endpoint: string, options?: RequestInit): Promise<unknown> {
  const url = `http://127.0.0.1:${pythonPort}${endpoint}`;
  const resp = await fetch(url, options);
  return resp.json();
}
```

- [ ] **Step 2: 集成 Python Bridge 到 electron/main.ts**

在 `app.whenReady()` 中启动 Python，退出时停止：

```typescript
// 添加 import
import { startPythonBackend, stopPythonBackend } from './python-bridge';

// 修改 app.whenReady
app.whenReady().then(async () => {
  getDatabase();
  await startPythonBackend();
  createWindow();
});

// 修改 window-all-closed
app.on('window-all-closed', () => {
  stopPythonBackend();
  closeDatabase();
  app.quit();
});
```

- [ ] **Step 3: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: add Python bridge for managing FastAPI subprocess"
```

---

### Task 5: IPC 处理器 - 连接主进程与数据库/Python

**Files:**
- Create: `electron/ipc/index.ts`
- Create: `electron/ipc/report.ts`
- Create: `electron/ipc/settings.ts`

- [ ] **Step 1: 创建 electron/ipc/report.ts**

```typescript
import { ipcMain } from 'electron';
import { v4 as uuid } from 'uuid';
import { createReport, insertComment, getAllReports, getReportById, updateCommentViolation } from '../database';
import { pythonFetch } from '../python-bridge';

export function registerReportIPC() {
  ipcMain.handle('search-and-analyze', async (_event, params: { platform: string; keyword: string; url?: string }) => {
    const searchResp = await pythonFetch('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }) as { videos: { id: string; title: string; url: string; author?: string }[] };

    return searchResp.videos;
  });

  ipcMain.handle('analyze-video', async (_event, params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) => {
    const analyzeResp = await pythonFetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: params.platform,
        video_id: params.videoId,
        ai_mode: params.aiMode,
        model_name: params.modelName,
        custom_rules: params.customRules,
      }),
    }) as {
      video: { id: string; title: string; url: string };
      comments: { id: string; author?: string; content: string; original_url?: string; category?: string; is_violation: boolean; confidence: number; ai_reason?: string }[];
      total: number;
      flagged: number;
    };

    const reportId = uuid();
    createReport({
      id: reportId,
      platform: params.platform,
      url: analyzeResp.video?.url ?? '',
      title: analyzeResp.video?.title,
      keyword: '',
      totalComments: analyzeResp.total,
      flaggedComments: analyzeResp.flagged,
    });

    for (const c of analyzeResp.comments) {
      insertComment({
        id: c.id || uuid(),
        reportId,
        author: c.author,
        content: c.content,
        originalUrl: c.original_url,
        category: c.category,
        isViolation: c.is_violation,
        confidence: c.confidence,
        aiReason: c.ai_reason,
      });
    }

    return { reportId, ...analyzeResp };
  });

  ipcMain.handle('get-reports', async () => {
    return getAllReports();
  });

  ipcMain.handle('get-report-detail', async (_event, reportId: string) => {
    return getReportById(reportId);
  });

  ipcMain.handle('update-comment-status', async (_event, commentId: string, isViolation: boolean) => {
    updateCommentViolation(commentId, isViolation);
  });
}
```

- [ ] **Step 2: 创建 electron/ipc/settings.ts**

```typescript
import { ipcMain } from 'electron';
import { getSettings, saveSettings } from '../database';
import { pythonFetch } from '../python-bridge';

export function registerSettingsIPC() {
  ipcMain.handle('get-settings', async () => {
    return getSettings();
  });

  ipcMain.handle('save-settings', async (_event, settings: Record<string, unknown>) => {
    saveSettings(settings);
    await pythonFetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  });
}
```

- [ ] **Step 3: 创建 electron/ipc/index.ts**

```typescript
import { registerReportIPC } from './report';
import { registerSettingsIPC } from './settings';

export function registerAllIPC() {
  registerReportIPC();
  registerSettingsIPC();
}
```

- [ ] **Step 4: 在 electron/main.ts 中注册 IPC**

```typescript
// 添加 import
import { registerAllIPC } from './ipc';

// 在 app.whenReady() 中，createWindow() 之前添加
registerAllIPC();
```

- [ ] **Step 5: 更新 electron/preload.ts 添加 analyze-video**

在 `electronAPI` 对象中添加:

```typescript
analyzeVideo: (params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) =>
  ipcRenderer.invoke('analyze-video', params),
```

同步更新 `src/vite-env.d.ts` 中 `electronAPI` 类型定义。

- [ ] **Step 6: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: add IPC handlers connecting main process to DB and Python"
```

---

### Task 6: React 前端 - 完整页面实现

**Files:**
- Modify: `src/pages/SearchPage.tsx`
- Modify: `src/pages/ReportPage.tsx`
- Modify: `src/pages/ReportDetailPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/CommentCard.tsx`
- Create: `src/stores/reportStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/services/api.ts`

- [ ] **Step 1: 创建 src/services/api.ts**

```typescript
const api = window.electronAPI;

export async function searchVideos(platform: string, keyword: string) {
  return api.searchAndAnalyze({ platform, keyword });
}

export async function analyzeVideo(params: { platform: string; videoId: string; aiMode: string; modelName?: string; customRules?: string }) {
  return api.analyzeVideo(params);
}

export async function getReports() {
  return api.getReports();
}

export async function getReportDetail(reportId: string) {
  return api.getReportDetail(reportId);
}

export async function updateCommentStatus(commentId: string, isViolation: boolean) {
  return api.updateCommentStatus(commentId, isViolation);
}

export async function getSettings() {
  return api.getSettings();
}

export async function saveSettings(settings: Record<string, unknown>) {
  return api.saveSettings(settings);
}
```

- [ ] **Step 2: 创建 src/stores/reportStore.ts**

```typescript
import { create } from 'zustand';

interface ReportStore {
  reports: unknown[];
  currentReport: unknown | null;
  loading: boolean;
  setReports: (reports: unknown[]) => void;
  setCurrentReport: (report: unknown | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  currentReport: null,
  loading: false,
  setReports: (reports) => set({ reports }),
  setCurrentReport: (currentReport) => set({ currentReport }),
  setLoading: (loading) => set({ loading }),
}));
```

- [ ] **Step 3: 创建 src/stores/settingsStore.ts**

```typescript
import { create } from 'zustand';

interface SettingsStore {
  settings: Record<string, unknown>;
  setSettings: (settings: Record<string, unknown>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {},
  setSettings: (settings) => set({ settings }),
}));
```

- [ ] **Step 4: 创建 src/components/SearchBar.tsx**

```tsx
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (platform: string, keyword: string) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [platform, setPlatform] = useState('bilibili');
  const [keyword, setKeyword] = useState('');

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <Select
        value={platform}
        onChange={setPlatform}
        style={{ width: 140 }}
        options={[
          { value: 'bilibili', label: 'B站' },
          { value: 'youtube', label: 'YouTube' },
        ]}
      />
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="输入关键词搜索"
        onPressEnter={() => onSearch(platform, keyword)}
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        icon={<SearchOutlined />}
        loading={loading}
        onClick={() => onSearch(platform, keyword)}
      >
        搜索
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: 创建 src/components/CommentCard.tsx**

```tsx
import { Card, Tag, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface CommentCardProps {
  id: string;
  author?: string;
  content: string;
  category?: string;
  isViolation: boolean;
  confidence: number;
  aiReason?: string;
  onToggleViolation?: (id: string, isViolation: boolean) => void;
}

const VIOLATION_COLORS: Record<string, string> = {
  '涉政': 'red',
  '涉黄': 'magenta',
  '暴力': 'volcano',
  '诈骗': 'orange',
  '仇恨言论': 'gold',
  '骚扰': 'lime',
};

export default function CommentCard({ id, author, content, category, isViolation, confidence, aiReason, onToggleViolation }: CommentCardProps) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8, borderLeft: isViolation ? '3px solid #ff4d4f' : '3px solid #52c41a' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{author || '匿名用户'}</Text>
          <Space>
            {category && <Tag color={VIOLATION_COLORS[category] || 'default'}>{category}</Tag>}
            <Tag color={isViolation ? 'error' : 'success'} icon={isViolation ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}>
              {isViolation ? '违规' : '合规'}
            </Tag>
            <Text type="secondary">置信度: {(confidence * 100).toFixed(0)}%</Text>
          </Space>
        </div>
        <Paragraph>{content}</Paragraph>
        {aiReason && <Text type="secondary" style={{ fontSize: 12 }}>AI 判定: {aiReason}</Text>}
        {onToggleViolation && (
          <Button size="small" type="link" onClick={() => onToggleViolation(id, !isViolation)}>
            {isViolation ? '标记为合规' : '标记为违规'}
          </Button>
        )}
      </Space>
    </Card>
  );
}
```

- [ ] **Step 6: 实现 src/pages/SearchPage.tsx**

```tsx
import { useState } from 'react';
import { Card, List, Button, Typography, message, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import * as api from '../services/api';

const { Text } = Typography;

export default function SearchPage() {
  const [videos, setVideos] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('bilibili');
  const navigate = useNavigate();

  const handleSearch = async (platform: string, keyword: string) => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSelectedPlatform(platform);
    try {
      const result = await api.searchVideos(platform, keyword);
      setVideos(result as unknown[]);
    } catch {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (videoId: string) => {
    setLoading(true);
    try {
      const result = await api.analyzeVideo({
        platform: selectedPlatform,
        videoId,
        aiMode: 'cloud',
      });
      message.success('分析完成');
      navigate(`/reports/${(result as { reportId: string }).reportId}`);
    } catch {
      message.error('分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} loading={loading} />
      <List
        loading={loading}
        dataSource={videos as { id: string; title: string; url: string; author?: string }[]}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="primary" size="small" onClick={() => handleAnalyze(item.id)} loading={loading}>
                AI 分析
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={<a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>}
              description={<Text type="secondary">{item.author}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 7: 实现 src/pages/ReportPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { List, Tag, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const { Text } = Typography;

export default function ReportPage() {
  const [reports, setReports] = useState<unknown[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReports().then((r) => setReports(r as unknown[]));
  }, []);

  if (reports.length === 0) return <Empty description="暂无报告" />;

  return (
    <List
      dataSource={reports as { id: string; platform: string; url: string; title?: string; keyword?: string; total_comments: number; flagged_comments: number; created_at: string }[]}
      renderItem={(item) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/reports/${item.id}`)}
        >
          <List.Item.Meta
            title={item.title || item.url}
            description={
              <div>
                <Tag>{item.platform}</Tag>
                <Text type="secondary">评论: {item.total_comments} | 违规: {item.flagged_comments}</Text>
                <br />
                <Text type="secondary">{item.created_at}</Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
}
```

- [ ] **Step 8: 实现 src/pages/ReportDetailPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Statistic, Row, Col, Card, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import CommentCard from '../components/CommentCard';
import * as api from '../services/api';

const { Title } = Typography;

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<unknown | null>(null);

  useEffect(() => {
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  }, [id]);

  if (!report) return <div>加载中...</div>;

  const r = report as {
    id: string; platform: string; url: string; title?: string;
    total_comments: number; flagged_comments: number;
    comments: { id: string; author?: string; content: string; category?: string; is_violation: boolean; confidence: number; ai_reason?: string }[];
  };

  const handleToggle = async (commentId: string, isViolation: boolean) => {
    await api.updateCommentStatus(commentId, isViolation);
    if (id) api.getReportDetail(id).then((r) => setReport(r));
  };

  const violations = r.comments.filter((c) => c.is_violation);

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Title level={4}>{r.title || r.url}</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="总评论" value={r.total_comments} /></Card></Col>
        <Col span={8}><Card><Statistic title="违规评论" value={r.flagged_comments} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="合规率" value={r.total_comments ? ((r.total_comments - r.flagged_comments) / r.total_comments * 100).toFixed(1) : 0} suffix="%" /></Card></Col>
      </Row>
      <Title level={5}>违规评论 ({violations.length})</Title>
      {violations.map((c) => (
        <CommentCard key={c.id} {...c} onToggleViolation={handleToggle} />
      ))}
      <Title level={5} style={{ marginTop: 16 }}>全部评论 ({r.comments.length})</Title>
      {r.comments.map((c) => (
        <CommentCard key={c.id} {...c} onToggleViolation={handleToggle} />
      ))}
    </div>
  );
}
```

- [ ] **Step 9: 实现 src/pages/SettingsPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Form, Select, Input, Button, Card, message, Switch, Divider } from 'antd';

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [aiMode, setAiMode] = useState('cloud');

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      const settings = s as Record<string, string>;
      form.setFieldsValue({
        aiMode: settings.aiMode || 'cloud',
        apiKey: settings.apiKey || '',
        apiBase: settings.apiBase || '',
        modelName: settings.modelName || 'gpt-4o-mini',
        ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
      });
      setAiMode(settings.aiMode || 'cloud');
    });
  }, [form]);

  const handleSave = async (values: Record<string, string>) => {
    await window.electronAPI.saveSettings(values);
    message.success('设置已保存');
  };

  return (
    <Card style={{ maxWidth: 600 }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Divider>AI 配置</Divider>
        <Form.Item name="aiMode" label="AI 模式">
          <Select onChange={(v) => setAiMode(v)} options={[{ value: 'cloud', label: '云端 API' }, { value: 'local', label: '本地 Ollama' }]} />
        </Form.Item>
        {aiMode === 'cloud' ? (
          <>
            <Form.Item name="apiKey" label="API Key"><Input.Password placeholder="sk-..." /></Form.Item>
            <Form.Item name="apiBase" label="API Base URL"><Input placeholder="https://api.openai.com/v1" /></Form.Item>
            <Form.Item name="modelName" label="模型名称"><Input placeholder="gpt-4o-mini" /></Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="ollamaUrl" label="Ollama URL"><Input placeholder="http://localhost:11434" /></Form.Item>
            <Form.Item name="modelName" label="模型名称"><Input placeholder="llama3" /></Form.Item>
          </>
        )}
        <Form.Item><Button type="primary" htmlType="submit">保存设置</Button></Form.Item>
      </Form>
    </Card>
  );
}
```

- [ ] **Step 10: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: implement all React pages with full UI"
```

---

### Task 7: Electron Builder 打包配置

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: 创建 electron-builder.yml**

```yaml
appId: com.webreport.app
productName: Web Report
directories:
  output: dist-electron
files:
  - dist/**/*
  - dist-electron/**/*
  - python/**/*
  - "!python/__pycache__"
extraResources:
  - from: python
    to: python
mac:
  target: dmg
  category: public.app-category.utilities
win:
  target: nsis
linux:
  target: AppImage
```

- [ ] **Step 2: Commit**

```bash
cd D:\project\web-report
git add -A
git commit -m "feat: add electron-builder packaging config"
```

---

### Task 8: 端到端验证

- [ ] **Step 1: 启动开发模式**

```bash
cd D:\project\web-report
npm run dev
```

Expected: Electron 窗口启动，显示搜索页，导航可切换。

- [ ] **Step 2: 验证搜索功能**

在搜索页选择 B站，输入关键词，点击搜索。Expected: 显示视频列表。

- [ ] **Step 3: 验证 AI 分析**

点击视频的「AI 分析」按钮（需配置 API Key）。Expected: 跳转到报告详情页，显示分类结果。

- [ ] **Step 4: 验证报告列表**

导航到报告列表页。Expected: 显示刚生成的报告。

- [ ] **Step 5: 验证设置页**

导航到设置页，切换 AI 模式、填入配置、保存。Expected: 保存成功提示。
