<img width="180" height="180" alt="ChainLearn AI Logo" src="logo_v2.png" />
</div>

# ChainLearn AI - Intelligent Learning Platform

🇨🇳 [中文文档](README_zh-CN.md)

An AI-powered interactive learning platform that helps users efficiently master knowledge through node-based dialogue systems and visualization tools.

View your app in AI Studio: https://ai.studio/apps/drive/1Q3SKXH21XXO0Dp9thuukmGxSfMO1Qyia

## ✨ Key Features

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

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API Key:
   - Set `GEMINI_API_KEY` in [.env.local](.env.local)
   - Or configure a custom AI provider in the application settings

3. Start the application:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📖 User Guide

### Start Learning
1. Enter the topic you want to learn on the homepage (e.g., "React Hooks", "Quantum Physics")
2. AI will automatically generate a learning path, broken down into multiple nodes
3. Engage in interactive learning node by node

### Trigger Visualizations
Ask questions that require visualization, such as:
- "Explain the TCP 3-way handshake process"
- "What is the React rendering mechanism?"
- "Steps of the Quick Sort algorithm"

AI will automatically generate corresponding charts to aid understanding.

### Take Quizzes
1. Chat with the AI in a learning node (at least 2 turns)
2. Click the "Test Knowledge" button
3. Complete the quiz and view your score
4. Decide whether to review or proceed to the next node based on feedback

## 📁 Project Structure

```
chainlearn-ai/
├── components/          # React Components
│   ├── Calendar.tsx     # Learning Calendar
│   ├── LearningHistory.tsx  # Learning History
│   ├── MermaidBlock.tsx     # Mermaid Chart Rendering
│   ├── QuizModal.tsx        # Quiz Interface
│   ├── SimpleMarkdown.tsx   # Markdown Rendering
│   └── ...
├── services/           # Business Logic
│   ├── geminiService.ts     # AI Service
│   ├── learningStats.ts     # Learning Stats
│   └── expertService.ts     # Expert Routing
├── docs/              # Documentation
│   ├── new-features.md      # New Features Guide
│   ├── testing-guide.md     # Testing Guide
│   └── ...
├── App.tsx            # Main Application
├── types.ts           # TypeScript Type Definitions
└── ...
```

## 🎨 Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **AI Service**: Google Gemini API / OpenAI Compatible API
- **Visualization**: Mermaid.js
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## 📚 Documentation

- [New Features](docs/new-features.md) - Detailed feature introduction
- [Testing Guide](docs/testing-guide.md) - How to test new functions
- [Changelog](CHANGELOG.md) - Version update records
- [System Architecture](docs/systemArchitecture.md) - Technical architecture description

## 🤝 Contribution

Issues and Pull Requests are welcome!

## 📄 License

MIT License
