import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Play, Send, Sparkles, BookOpen, ChevronRight, CheckCircle2, Loader2, Settings, Calendar as CalendarIcon, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { generateLearningPlan, initializeNodeChat, sendChatMessage, summarizeNodeChat, generateNodeQuiz } from './services/geminiService';
import { LearningNode, NodeStatus, WorkflowState, ChatMessage, AIConfig } from './types';
import { NodeList } from './components/NodeList';
import { SimpleMarkdown } from './components/SimpleMarkdown';
import { SettingsModal } from './components/SettingsModal';
import { Calendar } from './components/Calendar';
import { LearningHistory } from './components/LearningHistory';
import { QuizModal } from './components/QuizModal';
import { startSession, endSession, updateSessionMessageCount, accumulateSessionTime, saveWorkflowState } from './services/learningStats';
import { ExpertRouterService } from './services/expertService';

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
  })





  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSessionIdRef = useRef<string | null>(null);

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

      let selectedExpert = undefined;
      try{
        const expertId = await expertRouter.routerToExpert(state.topic);
        selectedExpert =expertRouter.getExpertById(expertId);
        console.log(`Expert Router: Selected expert for topic "${state.topic}" with ID ${expertId}`);

      }catch(err){
        console.error(`Expert Router: Failed to route expert for topic "${state.topic}"`);
      }



      const { plan } = await generateLearningPlan(state.topic, aiConfig,selectedExpert);
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
       try{
        const expertId = await expertRouter.routerToExpert(state.topic);
        selectedExpert =expertRouter.getExpertById(expertId);
        console.log(`Expert Router: Selected expert for topic "${state.topic}" with ID ${expertId}`);

      }catch(err){
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
        setState(prev => ({...prev, error: "Error initializing node chat. Check AI settings."}));
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
        aiConfig
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
      setState(prev => ({...prev, error: "Failed to generate quiz."}));
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
      setState(prev => ({...prev, error: "Failed to summarize node."}));
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
  };

  const activeNode = state.activeNodeIndex >= 0 && state.activeNodeIndex < state.nodes.length 
    ? state.nodes[state.activeNodeIndex] 
    : null;

  const isFinished = state.activeNodeIndex === state.nodes.length && state.nodes.length > 0;

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
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

      {/* --- Sidebar (Roadmap) --- */}
      {state.nodes.length > 0 && (
        <NodeList nodes={state.nodes} activeNodeIndex={state.activeNodeIndex} />
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            {state.nodes.length > 0 && (
              <button
                onClick={handleBackToHome}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="返回首页"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ChainLearn <span className="text-sky-400">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             {state.topic && (
              <div className="text-sm text-slate-400 hidden md:block">
                Topic: <span className="text-white font-medium">{state.topic}</span>
              </div>
            )}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="学习管理"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="学习日历"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="AI Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* Initial State: Input */}
          {state.nodes.length === 0 && !state.isGeneratingPlan && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
               <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 pb-2">
                    What do you want to learn?
                  </h2>
                  <p className="text-slate-400 text-lg">
                    Enter a topic, and AI will build a chained conversational workflow to teach you step-by-step.
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                  <div className="relative bg-slate-900 rounded-xl p-2 flex items-center border border-slate-700">
                    <input
                      type="text"
                      placeholder="e.g., Quantum Physics, React Hooks, French Revolution..."
                      className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 text-lg placeholder:text-slate-600"
                      value={state.topic}
                      onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartLearning()}
                    />
                    <button 
                      onClick={handleStartLearning}
                      disabled={!state.topic.trim()}
                      className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white p-3 rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                {state.error && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                    {state.error}
                  </div>
                )}
                
                <div className="text-xs text-slate-600">
                  Running on {aiConfig.provider === 'GEMINI' ? 'Google Gemini' : 'Custom Provider'}
                </div>
              </div>
            </div>
          )}

          {/* Loading State: Planning */}
          {state.isGeneratingPlan && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-sky-500 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium text-white">Analyzing "{state.topic}"...</h3>
                <p className="text-slate-500">Deconstructing topic into learnable nodes.</p>
              </div>
            </div>
          )}

          {/* Active Learning (Chat Interface) */}
          {activeNode && (
            <div className="flex flex-1 overflow-hidden">
               {/* Main Chat Area */}
               <div className="flex-1 flex flex-col h-full min-h-0">
                  
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-sky-400 font-medium uppercase tracking-wider mb-1">
                        Node {state.activeNodeIndex + 1}: {activeNode.title}
                      </div>
                      <div className="text-sm text-slate-400">{activeNode.description}</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {activeNode.status === NodeStatus.ACTIVE && (
                        <>
                          {activeNode.quiz ? (
                            <button 
                              onClick={() => setIsQuizOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              <span>知识自测</span>
                            </button>
                          ) : (
                            <button 
                              onClick={handleGenerateQuiz}
                              disabled={isGeneratingQuiz || activeNode.messages.length < 2}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm transition-colors"
                            >
                              {isGeneratingQuiz ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>生成中...</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardCheck className="w-4 h-4" />
                                  <span>知识自测</span>
                                </>
                              )}
                            </button>
                          )}
                          <button 
                            onClick={handleCompleteNode}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm border border-slate-700 transition-colors"
                          >
                            <span>Complete Node</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {activeNode.status === NodeStatus.SUMMARIZING && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/20 text-indigo-300 rounded-lg text-sm border border-indigo-900/50">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Summarizing...</span>
                        </div>
                      )}
                      {activeNode.status === NodeStatus.COMPLETED && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/20 text-emerald-300 rounded-lg text-sm border border-emerald-900/50">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Done</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-slate-950 min-h-0">
                    
                    {activeNode.status === NodeStatus.INITIALIZING && (
                       <div className="flex justify-center p-8">
                          <div className="flex items-center gap-3 text-slate-500 animate-pulse">
                            <Sparkles className="w-5 h-5" />
                            <span>AI Tutor is preparing lesson materials...</span>
                          </div>
                       </div>
                    )}

                    {activeNode.messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-6 ${
                          msg.role === 'user' 
                            ? 'bg-sky-600 text-white rounded-br-sm' 
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                          {msg.role === 'model' ? (
                            <SimpleMarkdown content={msg.text} />
                          ) : (
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  {activeNode.status === NodeStatus.ACTIVE && (
                    <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-sm shrink-0">
                      <div className="max-w-4xl mx-auto relative flex gap-2">
                        <textarea
                          ref={inputRef}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600 resize-none"
                          placeholder="Ask a question or answer the tutor... (Shift+Enter 换行, Enter 发送)"
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
                          className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition-all"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
               </div>

               {/* Right Sidebar: Micro-steps / Syllabus */}
               <div className="w-72 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col">
                  <div className="p-5 border-b border-slate-800">
                    <h3 className="text-indigo-400 font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Session Goals
                    </h3>
                  </div>
                  <div className="p-5 overflow-y-auto flex-1">
                    {activeNode.microSteps ? (
                      <ul className="space-y-4">
                        {activeNode.microSteps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-snug">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="mt-0.5">{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm gap-2">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Generating syllabus...
                      </div>
                    )}
                  </div>
                  
                  {/* Context Info */}
                  <div className="p-5 border-t border-slate-800 bg-slate-900/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Context</div>
                    <div className="text-xs text-slate-400 line-clamp-4 leading-relaxed">
                      {state.contextSummary ? state.contextSummary : "Starting fresh. No prior context."}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Completion State */}
          {isFinished && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950">
               <div className="max-w-2xl w-full text-center p-12 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Learning Chain Completed!</h2>
                <p className="text-slate-400">
                  You have successfully navigated through all nodes of the "{state.topic}" workflow. 
                  The AI has summarized each conversation to ensure retention.
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Start New Topic
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-slate-800 md:hidden z-20">
        <div 
          className="h-full bg-sky-500 transition-all duration-500"
          style={{ width: `${state.nodes.length > 0 ? ((state.activeNodeIndex) / state.nodes.length) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default App;