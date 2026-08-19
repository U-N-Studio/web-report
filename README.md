# Web Report - 评论审核系统

跨平台桌面应用，用于搜索视频/博客站点、AI 过滤评论、分类违规内容并生成本地报告。

## 功能

- **多平台搜索**: 支持 B站、YouTube（扩展中），首页推荐 + 关键词搜索
- **AI 评论审核**: 云端 API（OpenAI/Claude）或本地 Ollama 双模式
- **违规分类**: 涉政、涉黄、暴力、诈骗、仇恨言论、骚扰
- **人工复核**: AI 自动分类 → 人工确认 → 报告归档
- **本地存储**: SQLite 持久化，报告数据不离开本机
- **预留提交**: 报告提交接口预留，可对接内部审核平台

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 28 |
| 前端 | React 18 + TypeScript + Ant Design 5 + Zustand |
| 后端引擎 | Python FastAPI + Uvicorn |
| 数据库 | better-sqlite3 (本地) |
| AI | OpenAI SDK (云端) / Ollama (本地) |
| 构建 | Vite 5 + electron-builder |

## 快速开始

### 前置条件

- Node.js 20+
- Python 3.10+
- (可选) Ollama 本地运行

### 安装

```bash
git clone https://github.com/U-N-Studio/web-report.git
cd web-report

# 安装前端依赖
npm install
npx electron-rebuild   # 重建 better-sqlite3

# 安装 Python 依赖
pip install fastapi uvicorn httpx beautifulsoup4 openai pydantic
```

### 运行

```bash
# 开发模式（自动编译 + 启动 Electron）
npm run electron:start
```

Electron 会自动启动 Python 后端子进程（端口 8765）。

### 配置

启动后在 **设置页** 配置：

1. **B站 SESSDATA**: 从浏览器 Cookie 中复制，用于获取评论数据
2. **AI 模式**: 云端 API 或本地 Ollama
3. **API Key**: 云端模式需配置 OpenAI/Claude API Key
4. **API Base URL**: 支持 OpenAI 兼容的第三方 API
5. **模型名称**: gpt-4o-mini / claude-3-haiku / llama3 等

## 项目结构

```
web-report/
├── electron/           # Electron 主进程
│   ├── main.ts         # 入口：窗口 + DB + IPC + Python 桥接
│   ├── python-bridge.ts# Python 子进程管理 + HTTP 代理
│   ├── database/       # SQLite CRUD + 迁移
│   └── ipc/            # IPC 处理器 (report + settings)
├── python/             # Python 后端引擎
│   ├── main.py         # FastAPI 路由
│   ├── models.py       # Pydantic 数据模型
│   ├── config.py       # 运行时配置
│   ├── adapters/       # 平台适配器
│   │   ├── base.py     # BaseAdapter ABC
│   │   ├── bilibili.py # B站适配器
│   │   └── youtube.py  # YouTube 适配器 (stub)
│   └── ai/             # AI 引擎
│       ├── cloud.py    # 云端 API 分析
│       ├── local.py    # Ollama 本地分析
│       └── gateway.py  # 模式路由
├── src/                # React 前端
│   ├── pages/          # SearchPage / ReportPage / SettingsPage
│   ├── components/     # SearchBar 等通用组件
│   └── services/       # Electron IPC API 封装
├── dist/               # Vite 构建输出 (renderer)
├── dist-electron/      # TSC 构建输出 (main process)
└── electron-builder.yml# 打包配置
```

## 打包发布

```bash
npm run electron:build
```

输出到 `dist-out/`：Windows (nsis)、macOS (dmg)、Linux (AppImage)。

## 文档

- [架构设计](docs/architecture.md)
- [安装与配置指南](docs/setup-guide.md)
- [API 参考](docs/api-reference.md)

## License

ISC
