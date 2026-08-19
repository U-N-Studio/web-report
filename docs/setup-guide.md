# 安装与配置指南

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 20+ | 推荐 20.11.0 |
| Python | 3.10+ | 推荐 3.11+ |
| Electron | 28 | 自动安装 |
| Ollama | (可选) | 本地 AI 模式 |

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/U-N-Studio/web-report.git
cd web-report
```

### 2. 安装前端依赖

```bash
npm install
```

> **代理环境**: 如果使用代理（如 `skyproxy.vivo.xyz:80`），npm 可能报 E407 错误。
> 临时移除代理：`npm config delete proxy && npm config delete https-proxy`
> 安装完成后恢复代理。

> **Electron 下载**: 国内网络需设置镜像：
> ```bash
> set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> npm install
> ```

### 3. 重建原生模块

```bash
npx electron-rebuild
```

> better-sqlite3 是原生模块，必须重建以匹配 Electron 的 Node 版本。

### 4. 安装 Python 依赖

```bash
pip install fastapi uvicorn httpx beautifulsoup4 openai pydantic
```

### 5. (可选) 安装 Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3
```

## 运行

### 开发模式

```bash
npm run electron:start
```

此命令会：
1. 编译 Electron 主进程 TypeScript → `dist-electron/`
2. 构建 React 前端 → `dist/`
3. 启动 Electron，自动拉起 Python 子进程

### 手动启动（调试用）

```bash
# 终端 1: 启动 Python 后端
python -m uvicorn python.main:app --port 8765 --host 127.0.0.1

# 终端 2: 启动 Electron
npm run electron:start
```

> 注意: Python 必须从项目根目录启动，使用 `python.main:app` 模块路径。

## 配置

启动应用后，在 **设置页** 进行配置。

### B站 SESSDATA 配置

B站评论 API 需要登录态，步骤：

1. 在浏览器登录 B站 (bilibili.com)
2. 打开开发者工具 → Application → Cookies
3. 找到 `SESSDATA` 的值并复制
4. 粘贴到设置页的 "B站 SESSDATA" 输入框
5. 点击保存

> SESSDATA 有效期约 30 天，过期后需重新获取。

### AI 云端模式配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| API Key | OpenAI 或兼容 API 的密钥 | `sk-...` |
| API Base URL | API 端点，支持第三方 | `https://api.openai.com/v1` |
| 模型名称 | 使用的模型 | `gpt-4o-mini` |

支持的第三方 API：
- Azure OpenAI
- Anthropic Claude (OpenAI 兼容网关)
- 国内中转 API (如 one-api, new-api)

### AI 本地模式配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Ollama URL | Ollama 服务地址 | `http://localhost:11434` |
| 模型名称 | 已下载的模型 | `llama3`, `qwen2` |

## 打包发布

```bash
npm run electron:build
```

输出目录 `dist-out/`，包含：
- Windows: NSIS 安装程序 (.exe)
- macOS: DMG 镜像
- Linux: AppImage

打包配置见 `electron-builder.yml`。

## 常见问题

### Q: npm install 报 E407 错误

代理服务器不支持 npm 的认证方式。临时移除代理后安装：

```bash
npm config delete proxy
npm config delete https-proxy
npm install
npm config set proxy http://skyproxy.vivo.xyz:80
npm config set https-proxy http://skyproxy.vivo.xyz:80
```

### Q: Electron 下载超时

设置国内镜像：

```bash
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
```

### Q: better-sqlite3 报原生模块错误

```bash
npx electron-rebuild
```

### Q: Python 后端启动失败

确保从项目根目录启动，使用完整模块路径：

```bash
cd D:\project\web-report
python -m uvicorn python.main:app --port 8765 --host 127.0.0.1
```

### Q: B站评论为空

未配置 SESSDATA 时，B站评论 API 不返回数据。请在设置页配置 B站 SESSDATA。

### Q: 分析报 "未配置 AI API Key"

云端 AI 模式需要 API Key。请在设置页配置，或切换到本地 Ollama 模式。

### Q: Electron 版本不兼容

本项目锁定 `electron@28`。Electron 43+ 需要 Node.js 22+，当前环境 Node 20 不兼容。
