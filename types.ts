export enum NodeStatus {
  PENDING = 'PENDING',
  INITIALIZING = 'INITIALIZING', // Generating micro-steps and first message
  ACTIVE = 'ACTIVE',             // User is chatting
  SUMMARIZING = 'SUMMARIZING',
  COMPLETED = 'COMPLETED',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  status: NodeStatus;
  messages: ChatMessage[]; // The conversation history
  summary?: string; // The AI generated summary of this node
  microSteps?: string[]; // The curriculum checklist for this node
  quiz?: QuizQuestion[]; // Quiz questions for this node
}

export interface WorkflowState {
  topic: string;
  nodes: LearningNode[];
  activeNodeIndex: number;
  contextSummary: string; // The accumulated knowledge passed between nodes
  isGeneratingPlan: boolean;
  error: string | null;
  selectedExpert?: Expert;
  isExpertLoading?: boolean;

}

export type PlanResponse = {
  plan: Array<{
    title: string;
    description: string;
  }>;
}

export type AIProvider = 'OPENAI';

// 学习链细度等级
export type LearningGranularity = 'brief' | 'standard' | 'detailed';

// 预设服务商类型
export type PresetProviderId = 
  | 'openai'      // OpenAI
  | 'deepseek'    // DeepSeek
  | 'moonshot'    // Moonshot (Kimi)
  | 'custom';     // 自定义 OpenAI 兼容

// 服务商配置
export interface ProviderConfig {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  baseUrl: string;               // API 基础 URL
  apiKey: string;                // API Key
  models: ModelConfig[];         // 可用模型列表
  enabled: boolean;              // 是否启用
  isPreset: boolean;             // 是否为预设服务商
  presetId?: PresetProviderId;   // 预设服务商 ID
}

// 模型配置
export interface ModelConfig {
  id: string;                    // 模型 ID
  name: string;                  // 显示名称
  maxTokens?: number;            // 最大 token 数
  isDefault?: boolean;           // 是否为默认模型
}

// 预设服务商信息
export interface PresetProvider {
  id: PresetProviderId;
  name: string;
  baseUrl: string;
  defaultModels: ModelConfig[];
  description: string;
  website: string;
  apiKeyUrl?: string;            // API Key 获取链接
}

export interface AIConfig {
  provider: AIProvider;          // 兼容旧版
  baseUrl: string;               // 兼容旧版
  apiKey: string;                // 兼容旧版
  modelId: string;               // 兼容旧版
  granularity: LearningGranularity;
  
  // 新版多服务商配置
  providers: ProviderConfig[];   // 所有服务商配置
  activeProviderId: string;      // 当前激活的服务商 ID
  activeModelId: string;         // 当前激活的模型 ID
}

export interface LearningSession {
  id: string;
  nodeId: string[];   //节点id
  nodeTitles?: string[];
  sessionTitle: string;    //学习主题
  startTime: string;
  endTime: string;
  duration: number;
  messageCount: number;
  completed: boolean;   //遍历nodeId: string[]所有的状态
  summary: string;
  tags: string[];
  lastActiveTime?: string; // 最后活跃时间，用于累计学习时长
  workflowState?: string; // 保存的工作流状态，用于继续学习
}

export interface LearningStatsSummary {
  totalSessions: number;
  totalDuration: number; // 毫秒
  averageDailyDuration: number;
  longestStreak: number; // 连续学习天数
  currentStreak: number;
  mostActiveDay?: string;
}

 export interface CalendarFilters {
  nodeIds?: string[];
  tags?: string[];
  dateRange?: { start: string; end: string };
  minDuration?: number;
 }


export interface DailyLearningStats {
  date: string;
  totalDuration: number;
  sessionId: string[];   //通过startTime查当天的session
  sessionCount: number;
  intensity: number;  // 0-100
  completedSessions: number;
}

export enum CalendarViewType {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY'
}

export interface CalendarViewConfig {
  viewType: CalendarViewType;
  currentDate: string;
  startDate: string;
  endDate: string;
}

export interface HeatmapDataPoint{
  data: string;
  value: number;
  duration: number;
  tooltip: string;
}

export interface HeatmapData{
  year: number;
  month?: number;
  data: HeatmapDataPoint[]
}

export interface LearningCalendarState {
  dailyStats: DailyLearningStats[];
  heatmapData: HeatmapData[];

  viewConfig: CalendarViewConfig;
  isLoading: boolean;
  error: string | null;

  selectedDate?: string;
  dateRange?: {
    start: string;
    end: string;
  }
}


//内置专家
export interface Expert {
  id: string;          // 唯一标识符 (如 "dr-quantum")
  name: string;        // 专家名称 (如 "Dr. Sarah Chen")
  description: string; // 简短介绍 (用于AI上下文)
  systemPrompt: string; // AI系统提示词
  avatar?: string;     // 头像 emoji 或图标
  isBuiltIn?: boolean; // 是否为内置专家
  enabled?: boolean;   // 是否启用
}

// 专家配置（用于存储用户自定义）
export interface ExpertConfig {
  experts: Expert[];
  defaultExpertId: string;
}

// 笔记本相关类型
export interface Note {
  id: string;
  content: string;           // 笔记内容（原始消息文本）
  title?: string;            // 笔记标题（可选）
  topic: string;             // 来源学习主题
  nodeTitle: string;         // 来源节点标题
  sourceRole: 'user' | 'model'; // 消息来源角色
  createdAt: string;         // 创建时间
  updatedAt: string;         // 更新时间
  tags: string[];            // 标签
  isFavorite: boolean;       // 是否收藏
}

export interface NotebookConfig {
  notes: Note[];
  sortBy: 'createdAt' | 'updatedAt' | 'topic';
  sortOrder: 'asc' | 'desc';
}