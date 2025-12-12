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

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  status: NodeStatus;
  messages: ChatMessage[]; // The conversation history
  summary?: string; // The AI generated summary of this node
  microSteps?: string[]; // The curriculum checklist for this node
}

export interface WorkflowState {
  topic: string;
  nodes: LearningNode[];
  activeNodeIndex: number;
  contextSummary: string; // The accumulated knowledge passed between nodes
  isGeneratingPlan: boolean;
  error: string | null;
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
  sessionTitle: string;    //学习主题
  startTime: string;
  endTime: string;
  duration: number;
  messageCount: number;
  completed: boolean;   //遍历nodeId: string[]所有的状态
  summary: string;
}


export interface DailyLearningStates{
  date:string;
  totalDuration:number;
  sessionId:string[];   //通过startTime查当天的session
  sessionCount:number;
  extent:number;
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
  data: HeatmapDataPoint
}

export interface LearningCalendarState {
  dailyStats: DailyLearningStates[];
  heatmapData: HeatmapData[];

  viewConfig: CalendarViewConfig;
  isLoading: boolean;
  error: string | null;

  selectedDate?: string;
  
}

