// 学习规划服务
import {
    LearningPlan,
    LearningPhase,
    LearningTask,
    PlanMilestone,
    PlanProgress,
    PlanCreationInput,
    TaskStatus,
    PhaseStatus
} from '../planningTypes';
import { generateDetailedLearningPlan, GenerateDetailedPlanResponse } from './aiService';
import { AIConfig, Expert } from '../types';
import { Language, getLanguage } from './i18n';

const STORAGE_KEY = 'chainlearn_plans';

// 获取所有规划
export const loadPlans = (): LearningPlan[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse plans:', e);
        }
    }
    return [];
};

// 保存所有规划
export const savePlans = (plans: LearningPlan[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

// 根据 ID 获取规划
export const getPlanById = (planId: string): LearningPlan | undefined => {
    const plans = loadPlans();
    return plans.find(p => p.id === planId);
};

// 生成唯一 ID
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// 将 AI 响应转换为 LearningPlan
const convertResponseToPlan = (
    response: GenerateDetailedPlanResponse,
    input: PlanCreationInput,
    expertId: string,
    language: Language
): LearningPlan => {
    const now = new Date().toISOString();

    const phases: LearningPhase[] = response.phases.map((phase, index) => ({
        id: `phase-${generateId()}`,
        title: phase.title,
        description: phase.description,
        duration: phase.duration,
        order: index,
        status: index === 0 ? 'active' : 'pending' as PhaseStatus,
        tasks: phase.tasks.map(task => ({
            id: `task-${generateId()}`,
            title: task.title,
            description: task.description,
            type: task.type,
            estimatedHours: task.estimatedHours,
            status: 'pending' as TaskStatus,
            linkedTopic: task.linkedTopic,
            checkpoints: task.checkpoints,
        })),
    }));

    const milestones: PlanMilestone[] = response.milestones.map(m => ({
        id: `milestone-${generateId()}`,
        title: m.title,
        description: m.description,
        phaseId: phases[m.phaseIndex]?.id || phases[0].id,
        achieved: false,
    }));

    return {
        id: `plan-${generateId()}`,
        title: response.title,
        goal: input.goal,
        totalDuration: response.totalDuration,
        weeklyHours: input.weeklyHours,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        phases,
        milestones,
        metadata: {
            expertId,
            language,
            currentLevel: input.currentLevel,
        },
    };
};

// 创建新规划
export const createPlan = async (
    input: PlanCreationInput,
    config: AIConfig,
    expert?: Expert,
    language?: Language
): Promise<LearningPlan> => {
    const lang = language || getLanguage();

    const response = await generateDetailedLearningPlan(
        input.goal,
        input.weeklyHours,
        input.currentLevel,
        config,
        expert,
        lang
    );

    const plan = convertResponseToPlan(
        response,
        input,
        expert?.id || 'prof-planner',
        lang
    );

    const plans = loadPlans();
    plans.unshift(plan);
    savePlans(plans);

    return plan;
};

// 更新规划
export const updatePlan = (planId: string, updates: Partial<LearningPlan>): LearningPlan | null => {
    const plans = loadPlans();
    const index = plans.findIndex(p => p.id === planId);

    if (index === -1) return null;

    plans[index] = {
        ...plans[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    savePlans(plans);
    return plans[index];
};

// 删除规划
export const deletePlan = (planId: string): boolean => {
    const plans = loadPlans();
    const filtered = plans.filter(p => p.id !== planId);

    if (filtered.length === plans.length) return false;

    savePlans(filtered);
    return true;
};

// 更新任务状态
export const updateTaskStatus = (
    planId: string,
    phaseId: string,
    taskId: string,
    status: TaskStatus
): LearningPlan | null => {
    const plans = loadPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) return null;

    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) return null;

    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return null;

    task.status = status;
    if (status === 'completed') {
        task.completedAt = new Date().toISOString();
    }

    // 检查阶段是否完成
    const allTasksCompleted = phase.tasks.every(t => t.status === 'completed');
    if (allTasksCompleted) {
        phase.status = 'completed';

        // 激活下一个阶段
        const nextPhase = plan.phases.find(p => p.order === phase.order + 1);
        if (nextPhase) {
            nextPhase.status = 'active';
        }
    }

    // 检查整个规划是否完成
    const allPhasesCompleted = plan.phases.every(p => p.status === 'completed');
    if (allPhasesCompleted) {
        plan.status = 'completed';
    }

    plan.updatedAt = new Date().toISOString();
    savePlans(plans);

    return plan;
};

// 切换任务状态
export const toggleTaskStatus = (
    planId: string,
    phaseId: string,
    taskId: string
): LearningPlan | null => {
    const plan = getPlanById(planId);
    if (!plan) return null;

    const phase = plan.phases.find(p => p.id === phaseId);
    if (!phase) return null;

    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    return updateTaskStatus(planId, phaseId, taskId, newStatus);
};

// 计算规划进度
export const calculateProgress = (plan: LearningPlan): PlanProgress => {
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let estimatedRemainingHours = 0;
    let activePhaseIndex = -1;

    plan.phases.forEach((phase, index) => {
        if (phase.status === 'active' && activePhaseIndex === -1) {
            activePhaseIndex = index;
        }

        phase.tasks.forEach(task => {
            totalTasks++;
            if (task.status === 'completed') {
                completedTasks++;
            } else if (task.status === 'in_progress') {
                inProgressTasks++;
                estimatedRemainingHours += task.estimatedHours * 0.5; // 假设进行中的任务完成一半
            } else {
                estimatedRemainingHours += task.estimatedHours;
            }
        });
    });

    const completedPhases = plan.phases.filter(p => p.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalPhases: plan.phases.length,
        completedPhases,
        activePhaseIndex: activePhaseIndex >= 0 ? activePhaseIndex : 0,
        progressPercentage,
        estimatedRemainingHours,
    };
};

// 获取活跃阶段
export const getActivePhase = (plan: LearningPlan): LearningPhase | undefined => {
    return plan.phases.find(p => p.status === 'active');
};
