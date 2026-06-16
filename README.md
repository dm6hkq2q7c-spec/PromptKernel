# PromptKernel IDE

一款面向个人AI开发者的**轻量化Prompt工程调试工具**，基于Reddit技术负责人1000小时实践总结的KERNEL六维评估框架，实现Prompt质量的标准化评测、智能优化与效果对比。

## 核心价值

解决当前Prompt工程四大痛点：
- **调优依赖经验** → 量化评分体系，优化效果有据可依
- **缺少统一标准** → KERNEL六维框架，质量评估客观可量化
- **迭代不可追踪** → 版本历史管理，优化过程可沉淀、可追溯
- **变量测试成本高** → 固定用例管理，一键填充、快速切换

## 核心功能

| 功能 | 说明 |
|------|------|
| **变量解析与用例管理** | 自动识别`{{variable}}`格式变量，生成测试用例面板，支持多场景批量测试 |
| **KERNEL六维诊断评分** | 基于1000+真实Prompt实践总结的评估框架，六维度量化评分与风险识别 |
| **Prompt智能优化** | 基于诊断结果自动生成结构化优化版本，保留原意，针对性增强薄弱维度 |
| **Diff对比系统** | 原Prompt与优化版并行执行，输出内容并排Diff对比，直观展示优化效果 |
| **BYOK模型接入** | 支持用户自带API Key，密钥仅存本地，所有请求前端直连模型服务 |

## KERNEL评估框架

| 维度 | 评判标准 |
|------|----------|
| **K** - Keep it simple | 一个清晰目标，不堆砌无关上下文 |
| **E** - Easy to verify | 有明确成功标准，可判断是否达标 |
| **R** - Reproducible | 避免模糊、时间敏感描述，保证结果稳定 |
| **N** - Narrow scope | 一个Prompt = 一个目标，不做多任务混杂 |
| **E** - Explicit constraints | 明确限制、格式、禁止项，减少无效输出 |
| **L** - Logical structure | 按「背景→任务→约束→输出」组织逻辑 |

## 技术栈

- [Next.js 14](https://nextjs.org/) App Router
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) 状态管理
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) 编辑器
- [react-diff-viewer-continued](https://github.com/praneshr/react-diff-viewer) 差异对比
- [lucide-react](https://lucide.dev/) 图标

## 项目结构

```text
.
├── public/                 # 静态资源
├── src/
│   ├── app/                # Next.js 页面
│   │   ├── page.tsx        # 首页
│   │   └── ide/page.tsx    # IDE 主界面
│   ├── components/         # 页面组件
│   │   ├── DebuggerPanel.tsx
│   │   ├── PromptEditor.tsx
│   │   └── SettingsModal.tsx
│   ├── lib/                # API 调用、评分、Prompt 工具函数
│   └── store/              # Zustand 状态管理
├── next.config.mjs         # Next.js 配置
├── package.json
└── PRD.md
```

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

然后访问：

```text
http://localhost:3000
```

首页点击 `Open IDE` 进入调试界面，也可以直接访问：

```text
http://localhost:3000/ide
```

## API 配置

首次进入 IDE 时会打开 API 设置弹窗，也可以点击右上角的 `API 设置` 按钮重新配置。

需要填写：

- **Base URL**：兼容 OpenAI Chat Completions 的接口地址，例如 `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **API Key**：模型服务的访问密钥
- **Model Name**：模型名称，例如 `qwen-plus`

配置会保存在浏览器 `localStorage` 中，**不上传任何服务器**。

## 安全特性

- **本地优先**：所有数据仅存储在浏览器本地，不上传云端
- **BYOK模式**：用户自带API密钥，密钥仅在前端使用
- **直连模型**：所有模型请求由前端直接发送至模型服务
- **无用户追踪**：无需登录，不收集任何用户数据

## 产品亮点

- **专业评测体系**：基于1000+真实Prompt实践的KERNEL六维框架
- **全流程闭环**：编写→分析→优化→对比→迭代，一步一清
- **轻量化设计**：免部署、低学习门槛，专注核心调试场景
- **数据安全**：本地运行架构，彻底解决隐私顾虑

## 使用流程

1. 在左侧编辑器编写 Prompt，并使用 `{{变量名}}` 声明变量。
2. 在调试面板中填写测试变量值。
3. 点击运行、诊断或优化相关按钮。
4. 查看模型输出、KERNEL 评分和风险提示。
5. 生成优化版 Prompt 后，对比原始版本与优化版本的输出差异。
6. 根据评分和差异继续迭代 Prompt。

## 构建

```bash
npm run build
```

生产构建使用静态导出配置，输出目录为 `out/`。

## 部署

项目已配置 GitHub Pages 部署脚本：

```bash
npm run deploy
```

生产环境的 `basePath` 和 `assetPrefix` 配置为：

```text
/PromptKernel
```

如果部署到其他路径，需要同步修改 `next.config.mjs` 中的 `basePath` 和 `assetPrefix`。

## 可用脚本

```bash
npm run dev       # 启动开发服务
npm run build     # 构建静态产物
npm run start     # 启动 Next.js 生产服务
npm run lint      # 运行 ESLint
npm run deploy    # 构建并发布到 gh-pages
```

## 竞品差异化优势

| 竞品类型 | 优势 | 不足 | PromptKernel亮点 |
|----------|------|------|-----------------|
| 轻量化工具（如PromptOptimizer） | 操作简单 | 无量化评测体系 | 六维量化评分 + 全流程闭环 |
| 企业级平台（如PromptPilot） | 功能完善 | 复杂笨重 | 轻量化设计，专注个人开发者 |
| OpenAI Playground | 原生兼容 | 生态局限 | 跨平台支持 + 专业优化能力 |
| 运维平台（如LangSmith） | 链路追踪强 | 学习门槛高 | 低门槛 + 本地隐私架构 |

---

**提示**：本工具依赖兼容OpenAI Chat Completions格式的模型服务，支持阿里通义千问、OpenAI等平台。
