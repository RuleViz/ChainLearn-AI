<div align="center">
  <img src="public/logo.png" width="120" height="120" alt="ChainLearn AI Logo" />
  <h1>ChainLearn AI</h1>
  <p>
    <b>下一代交互式 AI 学习平台</b>
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" />
  </p>
  <p>
    <a href="README.md">🇺🇸 English Documentation</a> •
    <a href="#-核心功能">核心功能</a> •
    <a href="#-快速开始">快速开始</a> •
    <a href="#-项目结构">项目结构</a> •
    <a href="#-开源协议">开源协议</a>
  </p>
</div>

---

## 📖 简介

**ChainLearn AI** 是一个基于人工智能的交互式学习平台，致力于通过**节点式对话系统**和**实时可视化工具**，帮助用户高效、系统地掌握复杂知识。

与传统学习工具不同，ChainLearn 不仅提供信息，更通过智能专家路由和自研图表引擎，将抽象概念具象化，让学习过程如同探索知识地图般清晰有趣。

## 🌟 创新特性

### 🧠 内置专家路由 (Built-in Expert Router)
- **智能角色切换**：系统自动分析您的输入主题，并将其路由到最合适的 AI 专家角色（例如"编程专家"、"历史教授"、"科学导师"）。
- **上下文感知响应**：专门的提示词工程确保解释针对特定领域量身定制，提供更深入、更准确的见解。

### 🎨 自研图表渲染引擎 (Self-developed Diagram Rendering Engine)
- **无缝集成**：定制开发的渲染引擎，可解释 AI 生成的数据，直接在聊天界面中渲染复杂的图表。
- **动态可视化**：支持实时渲染流程图、时序图、类图和思维导图，无需依赖外部工具。

## ✨ 核心功能

### 🎯 节点式学习链
- AI 自动将学习主题分解为多个逻辑节点
- 每个节点包含结构化的学习目标（Micro-steps）
- 上下文累积：前一节点的知识自动传递到下一节点

### 📊 可视化知识图谱
- **自动生成 Mermaid 图表**：AI 在讲解复杂概念时自动输出可视化图表
- **支持多种图表类型**：
  - 流程图 (Flowchart) - 展示流程、算法
  - 时序图 (Sequence Diagram) - 展示交互过程
  - 类图 (Class Diagram) - 展示对象关系
  - 思维导图 (Mindmap) - 展示概念层次
- **暗黑主题适配**：图表颜色完美适配应用主题
- **全屏查看**：支持大图全屏浏览

### 🎓 智能实战测验
- **自动生成测验**：基于对话内容生成 3-5 道选择题
- **即时反馈**：选择答案后立即显示对错和详细解析
- **游戏化体验**：
  - 实时得分显示
  - 完美掌握动效
  - 鼓励性反馈
- **可重复测试**：巩固知识，直到完全掌握

### 📚 学习管理
- **学习历史**：记录所有学习会话
- **学习日历**：可视化学习进度和热力图
- **继续学习**：随时恢复之前的学习状态

### 🤖 多 AI 提供商支持
- Google Gemini (默认)
- OpenAI 兼容 API
- 自定义 API 端点

## 🚀 快速开始

**前置要求:** Node.js 18+

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/chainlearn-ai.git
   cd chainlearn-ai
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   复制 `.env.example` 到 `.env.local` 并配置您的 API Key:
   ```bash
   # .env.local
   GEMINI_API_KEY=your_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📁 项目结构

```bash
chainlearn-ai/
├── 📂 components/          # React 组件库
│   ├── Calendar.tsx      # 学习日历
│   ├── LearningHistory.tsx # 学习历史
│   ├── MermaidBlock.tsx  # 自研图表渲染组件
│   ├── QuizModal.tsx     # 测验交互界面
│   └── ...
├── 📂 services/           # 核心业务逻辑
│   ├── geminiService.ts  # AI 服务集成
│   ├── learningStats.ts  # 学习数据分析
│   └── expertService.ts  # 专家路由系统
├── 📂 docs/               # 开发文档
├── App.tsx               # 应用入口
└── types.ts              # TypeScript 类型定义
```

## 🗺️ 路线图 (Roadmap)

- [x] 基础对话与学习链生成
- [x] AI 专家路由系统
- [x] Mermaid 图表渲染引擎
- [x] 学习历史与日历
- [ ] 导出学习笔记 (PDF/Markdown)
- [ ] 社区分享功能
- [ ] 移动端原生适配

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！详细贡献指南请参考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 开源协议 (License)

本项目采用 **Apache License 2.0** 许可证。

这是一个对开发者非常友好且广泛使用的协议，旨在鼓励代码的分享和推广，同时保护作者的署名权。

- ✅ **自由使用**：您可以免费使用、修改、分发本软件，包括商业用途。
- ✅ **广泛兼容**：易于与其他开源项目集成。
- ⚠️ **必须署名**：如果您分发本软件或其衍生作品，**必须**保留原作者的版权声明和许可证声明（不能删除出处）。
- 🛡️ **免责声明**：作者不承担使用本软件产生的任何法律责任。

简而言之，您可以放心使用和魔改，只需要在说明中保留 "ChainLearn AI" 的版权声明即可。

详细条款请参阅 [LICENSE](LICENSE) 文件。
