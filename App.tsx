import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Play, Send, Sparkles, BookOpen, ChevronRight, CheckCircle2, Loader2, Settings, Calendar as CalendarIcon, ClipboardCheck, ArrowLeft, BookMarked, Bookmark } from 'lucide-react';
import { generateLearningPlan, initializeNodeChat, sendChatMessage, summarizeNodeChat, generateNodeQuiz } from './services/geminiService';
import { LearningNode, NodeStatus, WorkflowState, ChatMessage, AIConfig, Expert } from './types';
import { NodeList } from './components/NodeList';
import { SimpleMarkdown } from './components/SimpleMarkdown';
import { SettingsModal } from './components/SettingsModal';
import { Calendar } from './components/Calendar';
import { LearningHistory } from './components/LearningHistory';
import { QuizModal } from './components/QuizModal';
import { Notebook } from './components/Notebook';
import { startSession, endSession, updateSessionMessageCount, accumulateSessionTime, saveWorkflowState } from './services/learningStats';
import { addNote, findNoteByContent, deleteNoteByContent } from './services/notebookService';
import { ExpertRouterService } from './services/expertService';
import { useTranslation } from './contexts/LanguageContext';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'OPENAI',
  baseUrl: '',
  apiKey: '',
  modelId: '',
  granularity: 'standard',
  providers: [],
  activeProviderId: '',
  activeModelId: '',
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<WorkflowState>({
    topic: '',
    nodes: [],
    activeNodeIndex: -1,
    contextSummary: '',
    isGeneratingPlan: false,
    error: null,
  });

  // Load config from localStorage or use default
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('chainlearn_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });


  const [expertRouter] = useState(() => {
    return new ExpertRouterService(aiConfig);
  });

  // 当 aiConfig 更新时，更新 expertRouter 的配置
  useEffect(() => {
    expertRouter.updateConfig(aiConfig);
  }, [aiConfig, expertRouter]);





  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notebookVersion, setNotebookVersion] = useState(0); // 用于触发重新检查笔记状态
  const [currentExpert, setCurrentExpert] = useState<Expert | undefined>(undefined); // 当前选中的专家
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // 检查消息是否已保存到笔记本
  const isMessageSaved = (msg: ChatMessage): boolean => {
    if (!activeNode) return false;
    return !!findNoteByContent(msg.text, state.topic, activeNode.title);
  };

  // 切换消息的笔记本保存状态
  const handleToggleNotebook = (msg: ChatMessage) => {
    if (!activeNode) return;
    const existingNote = findNoteByContent(msg.text, state.topic, activeNode.title);
    if (existingNote) {
      // 已保存，删除笔记
      deleteNoteByContent(msg.text, state.topic, activeNode.title);
    } else {
      // 未保存，添加笔记
      addNote(msg.text, state.topic, activeNode.title, msg.role);
    }
    // 触发重新渲染
    setNotebookVersion(v => v + 1);
  };

  // 页面加载时恢复状态
  useEffect(() => {
    const savedState = localStorage.getItem('chainlearn_current_state');
    const savedSessionId = localStorage.getItem('chainlearn_current_session');

    if (savedState && savedSessionId) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
        currentSessionIdRef.current = savedSessionId;
        console.log('恢复学习状态:', savedSessionId);
      } catch (err) {
        console.error('恢复状态失败:', err);
      }
    }
  }, []);

  // 定期保存工作流状态到 localStorage
  useEffect(() => {
    if (currentSessionIdRef.current && state.nodes.length > 0) {
      console.log('保存工作流状态，会话ID:', currentSessionIdRef.current);
      saveWorkflowState(currentSessionIdRef.current, state);

      // 同时保存到 localStorage 用于页面刷新恢复
      localStorage.setItem('chainlearn_current_state', JSON.stringify(state));
      localStorage.setItem('chainlearn_current_session', currentSessionIdRef.current);
    }
  }, [state]);

  // 学习时间计时器 - 只在学习界面时累计时间
  useEffect(() => {
    const activeNode = state.activeNodeIndex >= 0 && state.activeNodeIndex < state.nodes.length
      ? state.nodes[state.activeNodeIndex]
      : null;

    // 只有在学习界面（有活跃节点且状态为 ACTIVE）时才计时
    const isInLearningView = activeNode && activeNode.status === NodeStatus.ACTIVE;

    if (!isInLearningView || !currentSessionIdRef.current) {
      return;
    }

    // 每10秒累计一次学习时间
    const timer = setInterval(() => {
      if (currentSessionIdRef.current && document.visibilityState === 'visible') {
        accumulateSessionTime(currentSessionIdRef.current);
      }
    }, 10000);

    // 页面可见性变化时的处理
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentSessionIdRef.current) {
        // 页面重新可见时，重置 lastActiveTime 避免累计离开时间
        accumulateSessionTime(currentSessionIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.activeNodeIndex, state.nodes]);

  // Helper to update specific node data
  const updateNode = (index: number, updates: Partial<LearningNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) => i === index ? { ...node, ...updates } : node)
    }));
  };

  const scrollToBottom = () => {
    // 使用 setTimeout 确保 DOM 已经渲染完成
    setTimeout(() => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    // 只在有消息时才滚动
    const activeNode = state.activeNodeIndex >= 0 && state.activeNodeIndex < state.nodes.length
      ? state.nodes[state.activeNodeIndex]
      : null;
    if (activeNode && activeNode.messages.length > 0) {
      scrollToBottom();
    }
  }, [state.nodes, state.activeNodeIndex]);

  // Auto-focus input when it becomes available or after sending
  useEffect(() => {
    if (!isSending && state.activeNodeIndex !== -1 && !state.isGeneratingPlan) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isSending, state.activeNodeIndex, state.isGeneratingPlan]);

  const handleSaveConfig = (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('chainlearn_config', JSON.stringify(newConfig));
  };

  // 继续学习
  const handleContinueLearning = (loadedState: WorkflowState, sessionId: string) => {
    console.log('继续学习，加载状态:', loadedState);
    setState(loadedState);
    currentSessionIdRef.current = sessionId;
    setIsHistoryOpen(false);
  };

  // Phase 1: Generate Plan
  const handleStartLearning = async () => {
    if (!state.topic.trim()) return;

    setState(prev => ({ ...prev, isGeneratingPlan: true, error: null, nodes: [], activeNodeIndex: -1, contextSummary: '' }));

    try {

      let selectedExpert: Expert | undefined = undefined;
      try {
        const expertId = await expertRouter.routerToExpert(state.topic);
        selectedExpert = expertRouter.getExpertById(expertId);
        console.log(`Expert Router: Selected expert for topic "${state.topic}" with ID ${expertId}`);

      } catch (err) {
        console.error(`Expert Router: Failed to route expert for topic "${state.topic}"`);
      }

      // 保存当前专家，供后续对话使用
      setCurrentExpert(selectedExpert);

      const { plan } = await generateLearningPlan(state.topic, aiConfig, selectedExpert);
      const newNodes: LearningNode[] = plan.map((item, idx) => ({
        id: `node-${idx}`,
        title: item.title,
        description: item.description,
        status: NodeStatus.PENDING,
        messages: []
      }));

      // 立即创建学习会话
      const nodeIds = newNodes.map(n => n.id);
      const nodeTitles = newNodes.map(n => n.title);
      currentSessionIdRef.current = startSession(nodeIds, state.topic, nodeTitles);
      console.log('创建学习会话:', currentSessionIdRef.current);

      setState(prev => ({
        ...prev,
        nodes: newNodes,
        activeNodeIndex: 0,
        isGeneratingPlan: false
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        error: `Failed to generate plan. ${err.message || 'Check your AI provider settings.'}`,
        isGeneratingPlan: false
      }));
    }
  };

  // Phase 2: Initialize Node (Generate Context & First Message)
  useEffect(() => {

    const initNode = async () => {
      let selectedExpert = undefined;
      try {
        const expertId = await expertRouter.routerToExpert(state.topic);
        selectedExpert = expertRouter.getExpertById(expertId);
        console.log(`Expert Router: Selected expert for topic "${state.topic}" with ID ${expertId}`);

      } catch (err) {
        console.error(`Expert Router: Failed to route expert for topic "${state.topic}"`);
      }
      const { activeNodeIndex, nodes, contextSummary } = state;
      if (activeNodeIndex === -1 || activeNodeIndex >= nodes.length) return;

      const currentNode = nodes[activeNodeIndex];
      if (currentNode.status !== NodeStatus.PENDING) return;

      updateNode(activeNodeIndex, { status: NodeStatus.INITIALIZING });

      try {
        const { initialMessage, microSteps } = await initializeNodeChat(
          currentNode.title,
          currentNode.description,
          contextSummary,
          aiConfig,
          selectedExpert
        );

        const firstMsg: ChatMessage = {
          role: 'model',
          text: initialMessage,
          timestamp: Date.now()
        };

        updateNode(activeNodeIndex, {
          status: NodeStatus.ACTIVE,
          messages: [firstMsg],
          microSteps
        });

      } catch (error) {
        console.error(error);
        updateNode(activeNodeIndex, { status: NodeStatus.PENDING });
        setState(prev => ({ ...prev, error: "Error initializing node chat. Check AI settings." }));
      }
    };

    initNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeNodeIndex, state.nodes.length]);

  // Phase 2b: Handle User Chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || state.activeNodeIndex === -1) return;

    const currentIdx = state.activeNodeIndex;
    const currentNode = state.nodes[currentIdx];

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputMessage,
      timestamp: Date.now()
    };

    const updatedMessages = [...currentNode.messages, userMsg];
    updateNode(currentIdx, { messages: updatedMessages });
    setInputMessage('');
    setIsSending(true);

    // Immediately refocus input (user can continue typing if they want, though we block send)
    inputRef.current?.focus();

    try {
      const aiResponseText = await sendChatMessage(
        currentNode.title,
        currentNode.microSteps || [],
        updatedMessages,
        aiConfig,
        currentExpert // 传入当前专家
      );

      const aiMsg: ChatMessage = {
        role: 'model',
        text: aiResponseText,
        timestamp: Date.now()
      };

      updateNode(currentIdx, { messages: [...updatedMessages, aiMsg] });

      // 更新会话消息数
      if (currentSessionIdRef.current) {
        updateSessionMessageCount(currentSessionIdRef.current, updatedMessages.length + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Generate Quiz for current node
  const handleGenerateQuiz = async () => {
    const { activeNodeIndex, nodes } = state;
    const currentNode = nodes[activeNodeIndex];

    if (currentNode.messages.length === 0) return;

    setIsGeneratingQuiz(true);

    try {
      const questions = await generateNodeQuiz(currentNode.title, currentNode.messages, aiConfig);
      updateNode(activeNodeIndex, { quiz: questions });
      setIsQuizOpen(true);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      setState(prev => ({ ...prev, error: "Failed to generate quiz." }));
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Phase 3: Complete & Summarize
  const handleCompleteNode = async () => {
    const { activeNodeIndex, nodes } = state;
    const currentNode = nodes[activeNodeIndex];

    if (currentNode.messages.length === 0) return;

    updateNode(activeNodeIndex, { status: NodeStatus.SUMMARIZING });

    try {
      const summary = await summarizeNodeChat(currentNode.title, currentNode.messages, aiConfig);

      updateNode(activeNodeIndex, {
        status: NodeStatus.COMPLETED,
        summary
      });

      // 检查是否是最后一个节点，如果是则结束会话
      const isLastNode = activeNodeIndex === nodes.length - 1;
      if (isLastNode && currentSessionIdRef.current) {
        const totalMessages = nodes.reduce((sum, n) => sum + n.messages.length, 0);
        endSession(currentSessionIdRef.current, summary, totalMessages);
        currentSessionIdRef.current = null;
      }

      setState(prev => ({
        ...prev,
        contextSummary: prev.contextSummary + `\n\n[Finished ${currentNode.title}]: ${summary}`,
        activeNodeIndex: prev.activeNodeIndex + 1 // Move to next node
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, error: "Failed to summarize node." }));
    }
  };

  // 返回首页
  const handleBackToHome = () => {
    // 清除当前状态
    localStorage.removeItem('chainlearn_current_state');
    localStorage.removeItem('chainlearn_current_session');

    // 如果有活跃会话，结束它
    if (currentSessionIdRef.current) {
      const totalMessages = state.nodes.reduce((sum, n) => sum + n.messages.length, 0);
      endSession(currentSessionIdRef.current, '用户返回首页', totalMessages);
      currentSessionIdRef.current = null;
    }

    // 重置状态
    setState({
      topic: '',
      nodes: [],
      activeNodeIndex: -1,
      contextSummary: '',
      isGeneratingPlan: false,
      error: null
    });

    // 清除专家状态
    setCurrentExpert(undefined);
  };

  const activeNode = state.activeNodeIndex >= 0 && state.activeNodeIndex < state.nodes.length
    ? state.nodes[state.activeNodeIndex]
    : null;

  const isFinished = state.activeNodeIndex === state.nodes.length && state.nodes.length > 0;

  return (
    <div className="flex h-screen bg-white text-neutral-900 font-sans overflow-hidden">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSave={handleSaveConfig}
      />
      <Calendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
      <LearningHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onContinueLearning={handleContinueLearning}
      />
      {activeNode && activeNode.quiz && (
        <QuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          questions={activeNode.quiz}
          nodeTitle={activeNode.title}
        />
      )}
      <Notebook
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />

      {/* --- Sidebar (Roadmap) --- */}
      {state.nodes.length > 0 && (
        <NodeList nodes={state.nodes} activeNodeIndex={state.activeNodeIndex} />
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header - 极简风格 */}
        <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-6 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            {state.nodes.length > 0 && (
              <button
                onClick={handleBackToHome}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="返回首页"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="ChainLearn Logo" className="w-8 h-8 rounded-lg object-contain" />
              </div>
              <h1 className="font-semibold text-lg tracking-tight text-neutral-900">
                ChainLearn <span className="ai-gradient-text">AI</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.topic && (
              <div className="text-sm text-neutral-500 hidden md:block mr-4">
                {state.topic}
              </div>
            )}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="学习管理"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsNotebookOpen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="笔记本"
            >
              <BookMarked className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="学习日历"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-neutral-50">

          {/* Initial State: Input - OpenAI 风格 */}
          {state.nodes.length === 0 && !state.isGeneratingPlan && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="max-w-xl w-full text-center space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                    {t('home_title')}
                  </h2>
                  <p className="text-neutral-500 text-base">
                    {t('home_subtitle')}
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-white rounded-xl p-1 flex items-center border border-neutral-200 shadow-sm hover:border-neutral-300 transition-colors">
                    <input
                      type="text"
                      placeholder={t('home_placeholder')}
                      className="flex-1 bg-transparent border-none outline-none text-neutral-900 px-4 py-3 text-base placeholder:text-neutral-400"
                      value={state.topic}
                      onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartLearning()}
                    />
                    <button
                      onClick={handleStartLearning}
                      disabled={!state.topic.trim()}
                      className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white p-3 rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                {state.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {state.error}
                  </div>
                )}

                <div className="text-xs text-neutral-400">
                  {aiConfig.activeProviderId ? t('home_ai_configured') : t('home_ai_not_configured')}
                </div>
              </div>
            </div>
          )}

          {/* Loading State: Planning - 极简风格 */}
          {state.isGeneratingPlan && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-medium text-neutral-900">{t('analyzing_topic')} "{state.topic}"</h3>
                <p className="text-neutral-500 text-sm">{t('building_path')}</p>
              </div>
            </div>
          )}

          {/* Active Learning (Chat Interface) */}
          {activeNode && (
            <div className="flex flex-1 overflow-hidden">
              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col h-full min-h-0">

                {/* Chat Header - 简洁风格 */}
                <div className="px-6 py-4 border-b border-neutral-200 bg-white flex justify-between items-center">
                  <div>
                    <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">
                      {t('section', state.activeNodeIndex + 1)} · {activeNode.title}
                    </div>
                    <div className="text-sm text-neutral-600">{activeNode.description}</div>
                  </div>

                  {/* Action Buttons - 简洁风格 */}
                  <div className="flex items-center gap-2">
                    {activeNode.status === NodeStatus.ACTIVE && (
                      <>
                        {activeNode.quiz ? (
                          <button
                            onClick={() => setIsQuizOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>{t('knowledge_quiz')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGenerateQuiz}
                            disabled={isGeneratingQuiz || activeNode.messages.length < 2}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-lg text-sm transition-colors"
                          >
                            {isGeneratingQuiz ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t('generating_quiz')}</span>
                              </>
                            ) : (
                              <>
                                <ClipboardCheck className="w-4 h-4" />
                                <span>{t('knowledge_quiz')}</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={handleCompleteNode}
                          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm border border-neutral-200 transition-colors"
                        >
                          <span>{t('complete_section')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {activeNode.status === NodeStatus.SUMMARIZING && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('summarizing')}</span>
                      </div>
                    )}
                    {activeNode.status === NodeStatus.COMPLETED && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('completed')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages List - 白色背景 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth bg-white min-h-0">

                  {activeNode.status === NodeStatus.INITIALIZING && (
                    <div className="flex justify-center p-8">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <div className="w-2 h-2 bg-neutral-300 rounded-full loading-dot"></div>
                        <div className="w-2 h-2 bg-neutral-300 rounded-full loading-dot"></div>
                        <div className="w-2 h-2 bg-neutral-300 rounded-full loading-dot"></div>
                      </div>
                    </div>
                  )}

                  {activeNode.messages.map((msg, idx) => {
                    const isSaved = isMessageSaved(msg);
                    return (
                      <div key={`${idx}-${notebookVersion}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-bubble group`}>
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 relative ${msg.role === 'user'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-900'
                          }`}>
                          {msg.role === 'model' ? (
                            <SimpleMarkdown content={msg.text} />
                          ) : (
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          )}
                          {/* 保存到笔记本按钮 */}
                          <button
                            onClick={() => handleToggleNotebook(msg)}
                            className={`absolute -right-10 top-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isSaved
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                              }`}
                            title={isSaved ? t('remove_from_notebook') : t('save_to_notebook')}
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-100 rounded-2xl p-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area - OpenAI 风格 */}
                {activeNode.status === NodeStatus.ACTIVE && (
                  <div className="p-4 bg-white border-t border-neutral-200 shrink-0">
                    <div className="max-w-4xl mx-auto relative flex gap-2">
                      <textarea
                        ref={inputRef}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors placeholder:text-neutral-400 resize-none"
                        placeholder={t('input_placeholder')}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={3}
                        autoFocus
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isSending}
                        className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white p-3 rounded-xl transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar - OpenAI 风格 */}
              <div className="w-72 bg-neutral-50 border-l border-neutral-200 hidden lg:flex flex-col">
                <div className="p-5 border-b border-neutral-200">
                  <h3 className="text-neutral-900 font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-neutral-500" />
                    {t('learning_goals')}
                  </h3>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                  {activeNode.microSteps ? (
                    <ul className="space-y-4">
                      {activeNode.microSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-neutral-600 leading-snug">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-neutral-200 text-neutral-500 flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <span className="mt-0.5">{step}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400 text-sm gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('generating_outline')}
                    </div>
                  )}
                </div>

                {/* Context Info */}
                <div className="p-5 border-t border-neutral-200 bg-white">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2">{t('context')}</div>
                  <div className="text-xs text-neutral-500 line-clamp-4 leading-relaxed">
                    {state.contextSummary ? state.contextSummary : t('no_context')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion State - OpenAI 风格 */}
          {isFinished && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
              <div className="max-w-2xl w-full text-center p-12 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-semibold text-neutral-900">{t('learning_complete')}</h2>
                <p className="text-neutral-500">
                  {t('learning_complete_desc', state.topic)}
                </p>
                <button
                  onClick={() => setState({
                    topic: '',
                    nodes: [],
                    activeNodeIndex: -1,
                    contextSummary: '',
                    isGeneratingPlan: false,
                    error: null
                  })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors"
                >
                  {t('start_new_topic')}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Progress Bar - OpenAI 风格 */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-neutral-200 md:hidden z-20">
        <div
          className="h-full bg-neutral-900 transition-all duration-500"
          style={{ width: `${state.nodes.length > 0 ? ((state.activeNodeIndex) / state.nodes.length) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default App;