// 学习规划相关类型定义

// 任务类型
export type TaskType = 'learn' | 'practice' | 'project' | 'review';

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// 阶段状态
export type PhaseStatus = 'pending' | 'active' | 'completed';

// 规划状态
export type PlanStatus = 'active' | 'paused' | 'completed' | 'archived';

// 资源类型
export interface PlanResource {
    title: string;
    type: 'article' | 'video' | 'book' | 'course' | 'project';
    url?: string;
    description?: string;
}

// 学习任务
export interface LearningTask {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    estimatedHours: number;
    status: TaskStatus;
    linkedTopic?: string;         // 可跳转到学习链学习的主题
    resources?: PlanResource[];
    checkpoints?: string[];       // 完成检查点
    completedAt?: string;
}

// 学习阶段
export interface LearningPhase {
    id: string;
    title: string;
    description: string;
    duration: string;             // 预计时长（如"2周"）
    order: number;
    status: PhaseStatus;
    tasks: LearningTask[];
    prerequisites?: string[];     // 前置阶段ID
}

// 里程碑
export interface PlanMilestone {
    id: string;
    title: string;
    description: string;
    targetDate?: string;
    phaseId: string;
    achieved: boolean;
    achievedAt?: string;
}

// 学习规划
export interface LearningPlan {
    id: string;
    title: string;
    goal: string;
    totalDuration: string;        // 预计总时长（如"12周"）
    weeklyHours: number;
    createdAt: string;
    updatedAt: string;
    status: PlanStatus;

    phases: LearningPhase[];
    milestones: PlanMilestone[];

    metadata: {
        expertId: string;
        language: 'zh' | 'en';
        currentLevel?: string;      // 用户当前水平
    };
}

// 规划进度统计
export interface PlanProgress {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalPhases: number;
    completedPhases: number;
    activePhaseIndex: number;
    progressPercentage: number;
    estimatedRemainingHours: number;
}

// 规划创建输入
export interface PlanCreationInput {
    goal: string;
    weeklyHours: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
}

// 规划状态（用于 App 状态管理）
export interface PlanningState {
    plans: LearningPlan[];
    activePlanId: string | null;
    isCreating: boolean;
    isLoading: boolean;
    error: string | null;
}

// AI 生成规划响应
export interface GeneratePlanResponse {
    title: string;
    totalDuration: string;
    phases: Array<{
        title: string;
        description: string;
        duration: string;
        tasks: Array<{
            title: string;
            description: string;
            type: TaskType;
            estimatedHours: number;
            linkedTopic?: string;
            checkpoints?: string[];
        }>;
    }>;
    milestones: Array<{
        title: string;
        description: string;
        phaseIndex: number;
    }>;
}
