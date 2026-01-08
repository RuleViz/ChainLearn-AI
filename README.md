<div align="center">
  <img src="public/logo.png" width="120" height="120" alt="ChainLearn AI Logo" />
  <h1>ChainLearn AI</h1>
  <p>
    <b>Next-Gen Interactive AI Learning Platform</b>
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" />
  </p>
  <p>
    <a href="README_zh-CN.md">🇨🇳 中文文档</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-project-structure">Structure</a> •
    <a href="#-license">License</a>
  </p>
</div>

---

## 📖 Introduction

**ChainLearn AI** is an AI-powered interactive learning platform designed to help users master complex knowledge efficiently through a **node-based dialogue system** and **real-time visualization tools**.

Unlike traditional learning tools, ChainLearn goes beyond simple text. It uses an intelligent expert router and a custom-built diagram engine to visualize abstract concepts, making the learning process as clear and engaging as exploring a knowledge map.

## 🌟 Innovative Features

### 🧠 Built-in Expert Router
- **Intelligent Persona Switching**: The system automatically analyzes your entered topic and routes it to the most suitable AI expert persona (e.g., "Coding Expert", "History Professor", "Science Tutor").
- **Context-Aware Responses**: Specialized prompts ensure that explanations are tailored to the domain, providing deeper and more accurate insights.

### 🎨 Self-developed Diagram Rendering Engine
- **Seamless Integration**: A custom-built rendering engine that interprets AI-generated data to render complex diagrams directly within the chat interface.
- **Dynamic Visualization**: Supports real-time rendering of Flowcharts, Sequence Diagrams, Class Diagrams, and Mindmaps without external dependencies.

## ✨ Core Features

### 🎯 Node-Based Learning Chain
- Automatically breaks down learning topics into multiple logical nodes
- Each node contains structured learning objectives (Micro-steps)
- Context accumulation: Knowledge from previous nodes is automatically passed to the next

### 📊 Visual Knowledge Graph
- **Auto-generated Mermaid Charts**: AI automatically outputs visual charts when explaining complex concepts
- **Supported Chart Types**:
  - Flowchart - Demonstrate processes and algorithms
  - Sequence Diagram - Show interaction processes
  - Class Diagram - Display object relationships
  - Mindmap - Visualize concept hierarchies
- **Dark Mode Adapted**: Chart colors perfectly match the application theme
- **Fullscreen View**: Support for viewing large charts in fullscreen

### 🎓 Smart Practice Quizzes
- **Auto-generated Quizzes**: Generates 3-5 multiple-choice questions based on node content
- **Instant Feedback**: Immediate indication of correctness with detailed explanations after selection
- **Gamified Experience**:
  - Real-time score display
  - "Perfect Mastery" animations
  - Encouraging feedback
- **Repeatable**: Reinforce knowledge until fully mastered

### 📚 Learning Management
- **Learning History**: Record all learning sessions
- **Learning Calendar**: Visualize learning progress and heatmaps
- **Resume Learning**: Pick up right where you left off at any time

### 🤖 Multi-Provider AI Support
- Google Gemini (Default)
- OpenAI Compatible API
- Custom API Endpoints

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chainlearn-ai.git
   cd chainlearn-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env.local` and set your API Key:
   ```bash
   # .env.local
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```bash
chainlearn-ai/
├── 📂 components/          # React Components
│   ├── Calendar.tsx      # Learning Calendar
│   ├── LearningHistory.tsx # Learning History
│   ├── MermaidBlock.tsx  # Custom Chart Renderer
│   ├── QuizModal.tsx     # Quiz Interface
│   └── ...
├── 📂 services/           # Core Business Logic
│   ├── geminiService.ts  # AI Integration
│   ├── learningStats.ts  # Data Analytics
│   └── expertService.ts  # Expert Routing System
├── 📂 docs/               # Documentation
├── App.tsx               # Main Application
└── types.ts              # TypeScript Types
```

## 🗺️ Roadmap

- [x] Basic Dialogue & Chain Generation
- [x] AI Expert Router System
- [x] Mermaid Diagram Rendering Engine
- [x] Learning History & Calendar
- [ ] Export Notes (PDF/Markdown)
- [ ] Community Sharing
- [ ] Mobile App Adaptation

## 🤝 Contributing

Issues and Pull Requests are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the **Apache License 2.0**.

This is a permissive license widely used in the open-source community, designed to encourage adoption and innovation while ensuring proper attribution.

- ✅ **Free Use**: You may freely use, modify, and distribute this software, including for commercial purposes.
- ✅ **Compatible**: Easy to integrate with other open-source projects.
- ⚠️ **Attribution Required**: You **must** retain the original copyright and license notice when distributing this software or derivative works.

In short, you are free to use and modify this project as long as you keep the "ChainLearn AI" copyright notice.

See the [LICENSE](LICENSE) file for details.
