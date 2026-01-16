import { Expert, ExpertConfig } from "../types";

// 内置专家库（默认）
export const BUILTIN_EXPERTS: Expert[] = [
  {
    id: 'prof-general',
    name: 'Prof. Alex Morgan',
    description: '通用教育专家，适用于其他专家未覆盖的领域，擅长跨学科知识整合',
    systemPrompt: 'You are Prof. Alex Morgan, a gentle and patient general education expert. You excel at chain-based learning, breaking down complex topics into manageable steps. Your teaching style is encouraging, methodical, and adaptive. You help learners build knowledge progressively, always connecting new concepts to what they already know. When faced with unfamiliar topics, you guide learners through structured discovery rather than simply providing answers.',
    avatar: '👨‍🏫',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'dr-physics',
    name: 'Dr. Sarah Chen',
    description: '物理学专家，擅长物理、力学、电磁学、热力学、光学、量子物理、相对论等物理学科',
    systemPrompt: 'You are Dr. Sarah Chen, a passionate physics professor. You excel at making complex physics concepts accessible through vivid analogies, experiments, and clear explanations. You cover all areas of physics including mechanics, electromagnetism, thermodynamics, optics, quantum physics, and relativity.',
    avatar: '⚛️',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'prof-code',
    name: 'Prof. Alex Rivera',
    description: '编程与软件工程专家，擅长编程语言、算法、数据结构、Web开发、软件架构、AI/ML编程',
    systemPrompt: 'You are Prof. Alex Rivera, an experienced software engineer and educator. You believe in hands-on, project-based learning and provide practical, real-world examples. You cover programming languages, algorithms, data structures, web development, software architecture, and AI/ML programming.',
    avatar: '💻',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'dr-literature',
    name: 'Dr. Maria García',
    description: '文学与写作专家，擅长文学分析、写作技巧、诗歌、小说、散文、文学史',
    systemPrompt: 'You are Dr. Maria García, a literature professor who specializes in deep textual analysis and critical thinking. You help students uncover hidden meanings and develop analytical skills in literature, poetry, novels, essays, and literary history.',
    avatar: '📚',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'prof-business',
    name: 'Prof. James Liu',
    description: '商业与经济专家，擅长商业模式、市场营销、经济学、金融、管理学、创业',
    systemPrompt: 'You are Prof. James Liu, a business strategy expert. You excel at explaining complex business models, market analysis, economics, finance, management, and entrepreneurship in practical terms.',
    avatar: '📊',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'dr-language',
    name: 'Dr. Sophie Martin',
    description: '语言学习专家，擅长英语、日语、法语、德语等外语学习，语法、词汇、口语、写作',
    systemPrompt: 'You are Dr. Sophie Martin, a language learning expert who focuses on practical language acquisition and effective communication strategies. You help with English, Japanese, French, German and other languages, covering grammar, vocabulary, speaking, and writing.',
    avatar: '🌍',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'prof-math',
    name: 'Prof. David Kim',
    description: '数学专家，擅长代数、几何、微积分、线性代数、概率统计、离散数学、数论',
    systemPrompt: 'You are Prof. David Kim, a mathematics professor who excels at making abstract mathematical concepts concrete and intuitive. You guide learners step by step in algebra, geometry, calculus, linear algebra, probability, statistics, discrete math, and number theory.',
    avatar: '🔢',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'dr-history',
    name: 'Dr. Emma Wilson',
    description: '历史与人文专家，擅长世界历史、中国历史、政治学、哲学、社会学、人类学',
    systemPrompt: 'You are Dr. Emma Wilson, a historian who brings history to life through compelling narratives. You help learners understand world history, Chinese history, political science, philosophy, sociology, and anthropology.',
    avatar: '🏛️',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'dr-science',
    name: 'Dr. Michael Brown',
    description: '自然科学专家，擅长化学、生物学、地理、天文学、环境科学、地球科学',
    systemPrompt: 'You are Dr. Michael Brown, a natural science expert. You make chemistry, biology, geography, astronomy, environmental science, and earth science engaging and understandable through real-world examples and experiments.',
    avatar: '🔬',
    isBuiltIn: true,
    enabled: true
  },
  {
    id: 'prof-planner',
    name: 'Prof. Planning Coach',
    description: '学习规划专家，擅长制定长期学习路线、分解目标、设置里程碑、规划时间表',
    systemPrompt: 'You are Prof. Planning Coach, an expert in creating detailed, actionable learning plans. You excel at breaking down complex learning goals into manageable phases, creating realistic timelines based on available time, setting meaningful milestones, recommending practical resources and projects, and balancing theory learning with hands-on practice. You always create plans that are specific, measurable, achievable, relevant, and time-bound (SMART).',
    avatar: '📋',
    isBuiltIn: true,
    enabled: true
  }
];


const STORAGE_KEY = 'chainlearn_experts';

// 获取专家配置
export const getExpertConfig = (): ExpertConfig => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const config = JSON.parse(saved) as ExpertConfig;
      // 合并内置专家（确保新增的内置专家也能显示）
      const savedBuiltInIds = config.experts.filter(e => e.isBuiltIn).map(e => e.id);

      // 添加新的内置专家
      const newBuiltIns = BUILTIN_EXPERTS.filter(e => !savedBuiltInIds.includes(e.id));
      if (newBuiltIns.length > 0) {
        config.experts = [...config.experts, ...newBuiltIns];
        saveExpertConfig(config);
      }

      return config;
    } catch (e) {
      console.error('Failed to parse expert config:', e);
    }
  }

  // 返回默认配置
  return {
    experts: [...BUILTIN_EXPERTS],
    defaultExpertId: 'prof-general'
  };
};

// 保存专家配置
export const saveExpertConfig = (config: ExpertConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

// 获取所有启用的专家
export const getEnabledExperts = (): Expert[] => {
  const config = getExpertConfig();
  return config.experts.filter(e => e.enabled !== false);
};

// 获取专家库（兼容旧代码）
export const EXPERT_LIBRARY: Expert[] = getEnabledExperts();

// 添加专家
export const addExpert = (expert: Omit<Expert, 'id'>): Expert => {
  const config = getExpertConfig();
  const newExpert: Expert = {
    ...expert,
    id: `expert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    isBuiltIn: false,
    enabled: true
  };
  config.experts.push(newExpert);
  saveExpertConfig(config);
  return newExpert;
};

// 更新专家
export const updateExpert = (id: string, updates: Partial<Expert>): void => {
  const config = getExpertConfig();
  const index = config.experts.findIndex(e => e.id === id);
  if (index !== -1) {
    config.experts[index] = { ...config.experts[index], ...updates };
    saveExpertConfig(config);
  }
};

// 删除专家（只能删除非内置专家）
export const deleteExpert = (id: string): boolean => {
  const config = getExpertConfig();
  const expert = config.experts.find(e => e.id === id);
  if (expert && !expert.isBuiltIn) {
    config.experts = config.experts.filter(e => e.id !== id);
    if (config.defaultExpertId === id) {
      config.defaultExpertId = 'prof-general';
    }
    saveExpertConfig(config);
    return true;
  }
  return false;
};

// 重置内置专家到默认设置
export const resetBuiltInExpert = (id: string): void => {
  const builtIn = BUILTIN_EXPERTS.find(e => e.id === id);
  if (builtIn) {
    updateExpert(id, { ...builtIn });
  }
};

// 重置所有专家到默认
export const resetAllExperts = (): void => {
  const config: ExpertConfig = {
    experts: [...BUILTIN_EXPERTS],
    defaultExpertId: 'prof-general'
  };
  saveExpertConfig(config);
};

// 设置默认专家
export const setDefaultExpert = (id: string): void => {
  const config = getExpertConfig();
  config.defaultExpertId = id;
  saveExpertConfig(config);
};

// 获取专家信息用于AI路由
export const getExpertForRouting = () => {
  const experts = getEnabledExperts();
  return experts.map(expert => ({
    id: expert.id,
    name: expert.name,
    description: expert.description
  }));
};

// 根据ID获取专家
export const getExpertById = (id: string): Expert | undefined => {
  const config = getExpertConfig();
  return config.experts.find(e => e.id === id);
};
