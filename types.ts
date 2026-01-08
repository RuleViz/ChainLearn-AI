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

export type AIProvider = 'GEMINI' | 'OPENAI';

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  modelId: string;
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
}