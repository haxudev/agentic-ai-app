# 🤖 Agentic AI Application

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Edge_Runtime-Enabled-FF6B6B" alt="Edge Runtime" />
</p>

<p align="center">
  由 <a href="https://github.com/xuhaoruins">@xuhaoruins</a> 与 GitHub Copilot AI 共同打造的现代 AI Agent 平台
</p>

<p align="center">
  🔗 <strong>演示</strong>: <a href="https://agent.haxu.dev">agent.haxu.dev</a>
</p>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🤖 **多模型支持** | GPT-5、GPT-4.1、GPT-4o 等主流模型 |
| 📄 **文档感知** | 上传 PDF/TXT/DOCX/MD 作为对话上下文 |
| 🖼️ **图片理解** | 支持图片附件的多模态视觉理解 |
| 🔧 **动态工具** | 通过 GitHub Gist 管理系统提示词 |
| 🔌 **MCP 集成** | 支持 Model Context Protocol 扩展工具 |
| 📚 **arXiv 搜索** | 内置学术论文搜索和获取功能 |
| ⚡ **流式响应** | SSE 实时流式输出，低延迟体验 |
| 📊 **Mermaid 图表** | 自动渲染流程图、序列图等 |
| 🎨 **代码高亮** | 智能检测语言并语法高亮显示 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  React 18   │  │ Tailwind CSS│  │ React Markdown      │  │
│  │  + Hooks    │  │ + Typography│  │ + Syntax Highlighter│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API Routes (Edge Runtime)               │    │
│  │  • /api/instruct-agent  - 主对话 API                 │    │
│  │  • /api/mcp/*           - MCP 工具调用               │    │
│  │  • /api/tools           - 工具管理                   │    │
│  │  • /api/system-prompts  - 提示词加载                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │GitHub Models │  │  GitHub API  │  │   MCP Servers    │   │
│  │  (GPT-5...)  │  │   (Gists)    │  │ (arXiv, Web...)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 前置要求

- **Node.js** 20+ (推荐 22 LTS)
- **npm** 或 **pnpm**
- **GitHub Token** (用于 GitHub Models API)

### 获取 GitHub Token

1. 访问 [GitHub Models Marketplace](https://github.com/marketplace/models)
2. 选择一个模型 (如 GPT-4o)
3. 点击 "Get started" 获取 API 访问权限
4. 在 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) 创建 Token

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/xuhaoruins/agentic-ai-app.git
cd agentic-ai-app

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 GITHUB_TOKEN

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用！

---

## 🔐 环境变量配置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `GITHUB_TOKEN` | ✅ | - | GitHub Personal Access Token |
| `GITHUB_MODEL_ENDPOINT` | ❌ | `https://models.github.ai/inference` | GitHub Models API 端点 |
| `GITHUB_TOOLS_GIST_ID` | ❌ | 公共 Gist | 工具/提示词配置 Gist ID |
| `SYSTEM_PROMPT_CACHE_TTL_MS` | ❌ | `300000` | 系统提示词缓存时间 (毫秒) |
| `GITHUB_TOOLS_CACHE_TTL_MS` | ❌ | `300000` | 工具配置缓存时间 (毫秒) |

---

## 📦 部署指南

### ✅ Vercel (推荐)

本项目完全兼容 Vercel 部署：

1. **Fork 或导入仓库到 Vercel**
2. **配置环境变量**:
   - `GITHUB_TOKEN`: 你的 GitHub Token
3. **部署** - Vercel 会自动检测 Next.js 并配置构建

```bash
# 或使用 Vercel CLI
npm i -g vercel
vercel
```

**Vercel 特性支持**:
- ✅ Edge Runtime API Routes
- ✅ 流式响应 (SSE)
- ✅ 自动 HTTPS
- ✅ 全球 CDN

---

### ✅ Azure Static Web Apps

> ⚠️ **注意**: Azure SWA 对 Next.js App Router + Edge Runtime 的支持有限。推荐使用 Azure Container Apps 或 Azure Web App。

**方案 A: 使用 Azure SWA (实验性)**

1. 在 Azure Portal 创建 Static Web App
2. 连接 GitHub 仓库
3. 配置环境变量 (`GITHUB_TOKEN`)
4. 使用 `staticwebapp.config.json` (已包含)

**方案 B: 使用 Azure Container Apps (推荐)**

```bash
# 构建 Docker 镜像
docker build -t agentic-ai-app .

# 推送到 Azure Container Registry
az acr login --name <your-acr>
docker tag agentic-ai-app <your-acr>.azurecr.io/agentic-ai-app:latest
docker push <your-acr>.azurecr.io/agentic-ai-app:latest

# 部署到 Container Apps
az containerapp create \
  --name agentic-ai-app \
  --resource-group <your-rg> \
  --environment <your-env> \
  --image <your-acr>.azurecr.io/agentic-ai-app:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars GITHUB_TOKEN=<your-token>
```

---

### ✅ Docker 部署

```bash
# 构建镜像
docker build -t agentic-ai-app .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e GITHUB_TOKEN=your_token \
  -e GITHUB_MODEL_ENDPOINT=https://models.github.ai/inference \
  agentic-ai-app
```

---

### ✅ 其他平台

| 平台 | 兼容性 | 说明 |
|------|--------|------|
| **Netlify** | ✅ | 支持 Next.js，需配置 `netlify.toml` |
| **Railway** | ✅ | 一键部署，支持 Docker |
| **Fly.io** | ✅ | 使用 Dockerfile 部署 |
| **Render** | ✅ | 支持 Node.js 和 Docker |
| **AWS Amplify** | ⚠️ | 部分支持，Edge Runtime 可能受限 |

---

## 🛠️ 项目结构

```
agentic-ai-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes (Edge Runtime)
│   │   │   ├── instruct-agent/   # 主对话 API
│   │   │   ├── mcp/              # MCP 工具 API
│   │   │   ├── tools/            # 工具管理 API
│   │   │   └── system-prompts/   # 提示词 API
│   │   ├── instruct-agent/       # 主页面
│   │   ├── layout.tsx            # 根布局
│   │   └── page.tsx              # 首页
│   ├── components/               # React 组件
│   │   ├── CustomSelect.tsx      # 自定义下拉框
│   │   ├── MermaidDiagram.tsx    # Mermaid 图表渲染
│   │   ├── Sidebar.tsx           # 侧边栏
│   │   └── SidebarContext.tsx    # 侧边栏状态管理
│   ├── lib/                      # 工具库
│   │   ├── instruct-agent/       # Agent 核心逻辑
│   │   │   ├── azure-client.ts   # OpenAI 客户端
│   │   │   ├── file-parser.ts    # 文件解析
│   │   │   ├── models.ts         # 模型定义
│   │   │   ├── prompt-loader.ts  # 提示词加载
│   │   │   └── tools-service.ts  # 工具服务
│   │   └── mcp/                  # MCP 协议
│   │       ├── client.ts         # MCP 客户端
│   │       ├── arxiv-client.ts   # arXiv 本地客户端
│   │       ├── servers.ts        # 服务器配置
│   │       └── types.ts          # 类型定义
│   └── types/                    # TypeScript 类型
├── public/                       # 静态资源
├── .env.example                  # 环境变量示例
├── Dockerfile                    # Docker 配置
├── next.config.js                # Next.js 配置
├── staticwebapp.config.json      # Azure SWA 配置
├── vercel.json                   # Vercel 配置
└── tailwind.config.js            # Tailwind 配置
```

---

## 🔌 MCP 工具扩展

本项目支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 扩展工具：

### 内置工具

| 工具 | 描述 | 状态 |
|------|------|------|
| **arXiv** | 学术论文搜索和获取 | ✅ 本地实现 |
| **Microsoft Learn** | Microsoft 官方文档 | ⏳ HTTP MCP |
| **Web Fetch** | 网页内容获取 | ⏳ HTTP MCP |
| **DeepWiki** | 深度知识库搜索 | ⏳ HTTP MCP |

### 添加自定义 MCP 服务器

编辑 `src/lib/mcp/servers.ts`:

```typescript
export const MCP_SERVERS: MCPServerConfig[] = [
  // ... 现有服务器
  {
    id: 'your-server',
    name: 'Your Server',
    description: '你的 MCP 服务器描述',
    endpoint: 'https://your-mcp-server.com/mcp',
    icon: '🔧',
    enabled: false,
    auth: { type: 'none' },
  },
];
```

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [GitHub Models](https://github.com/marketplace/models) - AI 模型 API
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [OpenAI SDK](https://github.com/openai/openai-node) - OpenAI 客户端

---

<p align="center">
  <strong>Vibe Coding</strong> — 人机协作，迭代交付 🚀
</p>
