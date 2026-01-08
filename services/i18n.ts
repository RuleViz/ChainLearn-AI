// 国际化服务
export type Language = 'zh' | 'en';

const STORAGE_KEY = 'chainlearn_language';

// 翻译文本
const translations = {
  zh: {
    // 通用
    app_name: 'ChainLearn',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    reset: '重置',
    close: '关闭',
    confirm: '确认',
    search: '搜索',
    loading: '加载中...',
    
    // 首页
    home_title: '你想学习什么？',
    home_subtitle: '输入一个主题，AI 将为你构建结构化的学习路径',
    home_placeholder: '例如：量子物理、React Hooks、法国大革命...',
    home_ai_configured: '已配置 AI 服务',
    home_ai_not_configured: '请先在设置中配置 AI 服务商',
    
    // 学习状态
    analyzing_topic: '正在分析',
    building_path: '构建学习路径中...',
    generating_outline: '生成学习大纲...',
    summarizing: '总结中...',
    completed: '已完成',
    
    // 节点学习
    section: '第 {0} 节',
    learning_goals: '学习目标',
    context: '上下文',
    no_context: '从头开始，暂无上下文。',
    input_placeholder: '输入问题或回答... (Shift+Enter 换行, Enter 发送)',
    complete_section: '完成本节',
    knowledge_quiz: '知识自测',
    generating_quiz: '生成中...',
    save_to_notebook: '保存到笔记本',
    remove_from_notebook: '从笔记本移除',
    
    // 完成页面
    learning_complete: '学习完成！',
    learning_complete_desc: '你已成功完成 "{0}" 的所有学习节点。AI 已为每个对话生成总结以帮助记忆。',
    start_new_topic: '开始新主题',
    
    // 设置
    settings: '设置',
    settings_provider: 'AI 服务商',
    settings_experts: '专家管理',
    settings_language: '语言',
    settings_granularity: '学习链细度',
    granularity_brief: '简洁',
    granularity_brief_desc: '2-3 个节点，快速概览',
    granularity_standard: '标准',
    granularity_standard_desc: '4-6 个节点，平衡深度',
    granularity_detailed: '详细',
    granularity_detailed_desc: '7-10 个节点，深入学习',
    
    // 服务商
    provider_select: '选择服务商',
    provider_add: '添加服务商',
    provider_name: '服务商名称',
    provider_base_url: 'Base URL',
    provider_api_key: 'API Key',
    provider_models: '模型列表',
    provider_add_model: '添加模型',
    provider_delete_confirm: '确定删除此服务商？',
    
    // 专家
    expert_management: '专家管理',
    expert_add: '添加专家',
    expert_name: '专家名称',
    expert_avatar: '头像',
    expert_description: '专业领域描述',
    expert_system_prompt: '系统提示词',
    expert_enabled: '已启用',
    expert_disabled: '已禁用',
    expert_builtin: '内置',
    expert_custom: '自定义',
    expert_reset: '重置为默认',
    expert_reset_all: '重置所有专家',
    expert_delete_confirm: '确定删除此专家？',
    
    // 笔记本
    notebook: '笔记本',
    notebook_empty: '暂无笔记',
    notebook_empty_desc: '在学习过程中点击消息旁的书签图标保存笔记',
    notebook_search_placeholder: '搜索笔记...',
    notebook_all: '全部',
    notebook_favorites: '收藏',
    notebook_by_topic: '按主题',
    notebook_delete_selected: '删除选中',
    notebook_select_all: '全选',
    notebook_deselect_all: '取消全选',
    
    // 日历
    calendar: '学习日历',
    calendar_today: '今天',
    calendar_sessions: '次学习',
    calendar_duration: '学习时长',
    calendar_no_data: '暂无学习记录',
    
    // 学习历史
    history: '学习管理',
    history_continue: '继续学习',
    history_delete: '删除记录',
    history_no_sessions: '暂无学习记录',
    history_start_learning: '开始学习新主题',
    
    // 统计
    stats_total_sessions: '总学习次数',
    stats_total_duration: '总学习时长',
    stats_avg_daily: '日均学习',
    stats_current_streak: '当前连续',
    stats_longest_streak: '最长连续',
    stats_days: '天',
    stats_minutes: '分钟',
    stats_hours: '小时',
    
    // 测验
    quiz_title: '知识自测',
    quiz_question: '问题',
    quiz_submit: '提交答案',
    quiz_next: '下一题',
    quiz_finish: '完成测验',
    quiz_correct: '正确！',
    quiz_incorrect: '错误',
    quiz_explanation: '解析',
    quiz_score: '得分',
    quiz_retry: '重新测试',
    
    // 时间格式
    time_just_now: '刚刚',
    time_minutes_ago: '{0} 分钟前',
    time_hours_ago: '{0} 小时前',
    time_days_ago: '{0} 天前',
  },
  en: {
    // Common
    app_name: 'ChainLearn',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    reset: 'Reset',
    close: 'Close',
    confirm: 'Confirm',
    search: 'Search',
    loading: 'Loading...',
    
    // Home
    home_title: 'What do you want to learn?',
    home_subtitle: 'Enter a topic and AI will build a structured learning path for you',
    home_placeholder: 'e.g., Quantum Physics, React Hooks, French Revolution...',
    home_ai_configured: 'AI service configured',
    home_ai_not_configured: 'Please configure AI provider in settings first',
    
    // Learning status
    analyzing_topic: 'Analyzing',
    building_path: 'Building learning path...',
    generating_outline: 'Generating outline...',
    summarizing: 'Summarizing...',
    completed: 'Completed',
    
    // Node learning
    section: 'Section {0}',
    learning_goals: 'Learning Goals',
    context: 'Context',
    no_context: 'Starting fresh, no prior context.',
    input_placeholder: 'Type your question or answer... (Shift+Enter for new line, Enter to send)',
    complete_section: 'Complete Section',
    knowledge_quiz: 'Knowledge Quiz',
    generating_quiz: 'Generating...',
    save_to_notebook: 'Save to Notebook',
    remove_from_notebook: 'Remove from Notebook',
    
    // Completion page
    learning_complete: 'Learning Complete!',
    learning_complete_desc: 'You have successfully completed all learning nodes for "{0}". AI has generated summaries for each conversation to help with retention.',
    start_new_topic: 'Start New Topic',
    
    // Settings
    settings: 'Settings',
    settings_provider: 'AI Provider',
    settings_experts: 'Expert Management',
    settings_language: 'Language',
    settings_granularity: 'Learning Chain Granularity',
    granularity_brief: 'Brief',
    granularity_brief_desc: '2-3 nodes, quick overview',
    granularity_standard: 'Standard',
    granularity_standard_desc: '4-6 nodes, balanced depth',
    granularity_detailed: 'Detailed',
    granularity_detailed_desc: '7-10 nodes, in-depth learning',
    
    // Provider
    provider_select: 'Select Provider',
    provider_add: 'Add Provider',
    provider_name: 'Provider Name',
    provider_base_url: 'Base URL',
    provider_api_key: 'API Key',
    provider_models: 'Models',
    provider_add_model: 'Add Model',
    provider_delete_confirm: 'Delete this provider?',
    
    // Expert
    expert_management: 'Expert Management',
    expert_add: 'Add Expert',
    expert_name: 'Expert Name',
    expert_avatar: 'Avatar',
    expert_description: 'Expertise Description',
    expert_system_prompt: 'System Prompt',
    expert_enabled: 'Enabled',
    expert_disabled: 'Disabled',
    expert_builtin: 'Built-in',
    expert_custom: 'Custom',
    expert_reset: 'Reset to Default',
    expert_reset_all: 'Reset All Experts',
    expert_delete_confirm: 'Delete this expert?',
    
    // Notebook
    notebook: 'Notebook',
    notebook_empty: 'No notes yet',
    notebook_empty_desc: 'Click the bookmark icon next to messages during learning to save notes',
    notebook_search_placeholder: 'Search notes...',
    notebook_all: 'All',
    notebook_favorites: 'Favorites',
    notebook_by_topic: 'By Topic',
    notebook_delete_selected: 'Delete Selected',
    notebook_select_all: 'Select All',
    notebook_deselect_all: 'Deselect All',
    
    // Calendar
    calendar: 'Learning Calendar',
    calendar_today: 'Today',
    calendar_sessions: 'sessions',
    calendar_duration: 'Duration',
    calendar_no_data: 'No learning records',
    
    // History
    history: 'Learning History',
    history_continue: 'Continue',
    history_delete: 'Delete',
    history_no_sessions: 'No learning sessions',
    history_start_learning: 'Start learning a new topic',
    
    // Stats
    stats_total_sessions: 'Total Sessions',
    stats_total_duration: 'Total Duration',
    stats_avg_daily: 'Daily Average',
    stats_current_streak: 'Current Streak',
    stats_longest_streak: 'Longest Streak',
    stats_days: 'days',
    stats_minutes: 'min',
    stats_hours: 'hrs',
    
    // Quiz
    quiz_title: 'Knowledge Quiz',
    quiz_question: 'Question',
    quiz_submit: 'Submit',
    quiz_next: 'Next',
    quiz_finish: 'Finish',
    quiz_correct: 'Correct!',
    quiz_incorrect: 'Incorrect',
    quiz_explanation: 'Explanation',
    quiz_score: 'Score',
    quiz_retry: 'Retry',
    
    // Time format
    time_just_now: 'Just now',
    time_minutes_ago: '{0} min ago',
    time_hours_ago: '{0} hrs ago',
    time_days_ago: '{0} days ago',
  }
};

export type TranslationKey = keyof typeof translations.zh;

// 获取当前语言
export const getLanguage = (): Language => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'zh') {
    return saved;
  }
  // 默认根据浏览器语言
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
};

// 设置语言
export const setLanguage = (lang: Language): void => {
  localStorage.setItem(STORAGE_KEY, lang);
  // 触发自定义事件通知语言变化
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
};

// 获取翻译文本
export const t = (key: TranslationKey, ...args: (string | number)[]): string => {
  const lang = getLanguage();
  let text = translations[lang][key] || translations.zh[key] || key;
  
  // 替换占位符 {0}, {1}, etc.
  args.forEach((arg, index) => {
    text = text.replace(`{${index}}`, String(arg));
  });
  
  return text;
};

// React Hook for language
export const useLanguage = (): [Language, (lang: Language) => void] => {
  // 这个 hook 需要在 React 组件中使用，这里只提供类型
  // 实际实现在组件中
  return [getLanguage(), setLanguage];
};
