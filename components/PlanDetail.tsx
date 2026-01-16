import React, { useState } from 'react';
import { ArrowLeft, Check, Circle, Clock, BookOpen, Code, RefreshCw, Play, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { LearningPlan, LearningPhase, LearningTask, PlanProgress } from '../planningTypes';
import { calculateProgress, toggleTaskStatus } from '../services/planningService';

interface PlanDetailProps {
    plan: LearningPlan;
    onBack: () => void;
    onPlanUpdate: (plan: LearningPlan) => void;
    onStartLearning: (topic: string) => void;
    onDeletePlan: (planId: string) => void;
}

const TaskTypeIcon: React.FC<{ type: LearningTask['type'] }> = ({ type }) => {
    switch (type) {
        case 'learn':
            return <BookOpen className="w-4 h-4" />;
        case 'practice':
            return <RefreshCw className="w-4 h-4" />;
        case 'project':
            return <Code className="w-4 h-4" />;
        case 'review':
            return <RefreshCw className="w-4 h-4" />;
        default:
            return <Circle className="w-4 h-4" />;
    }
};

const TaskTypeLabel: React.FC<{ type: LearningTask['type'] }> = ({ type }) => {
    const { t } = useTranslation();
    const labels = {
        learn: t('planning_task_learn'),
        practice: t('planning_task_practice'),
        project: t('planning_task_project'),
        review: t('planning_task_review'),
    };
    return <span>{labels[type]}</span>;
};

export const PlanDetail: React.FC<PlanDetailProps> = ({
    plan,
    onBack,
    onPlanUpdate,
    onStartLearning,
    onDeletePlan,
}) => {
    const { t } = useTranslation();
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
        // 默认展开活跃阶段
        const activePhase = plan.phases.find(p => p.status === 'active');
        return new Set(activePhase ? [activePhase.id] : [plan.phases[0]?.id]);
    });

    const progress = calculateProgress(plan);

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phaseId)) {
                next.delete(phaseId);
            } else {
                next.add(phaseId);
            }
            return next;
        });
    };

    const handleTaskToggle = (phaseId: string, taskId: string) => {
        const updatedPlan = toggleTaskStatus(plan.id, phaseId, taskId);
        if (updatedPlan) {
            onPlanUpdate(updatedPlan);
        }
    };

    const getPhaseStatusIcon = (phase: LearningPhase) => {
        if (phase.status === 'completed') {
            return <Check className="w-5 h-5 text-green-600" />;
        }
        if (phase.status === 'active') {
            return <div className="w-5 h-5 rounded-full border-2 border-neutral-900 flex items-center justify-center"><div className="w-2 h-2 bg-neutral-900 rounded-full" /></div>;
        }
        return <Circle className="w-5 h-5 text-neutral-300" />;
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">{plan.title}</h2>
                            <p className="text-sm text-neutral-500">{plan.totalDuration} · {plan.weeklyHours}h/week</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onDeletePlan(plan.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('delete')}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-600">{t('planning_progress')}</span>
                        <span className="font-medium text-neutral-900">{progress.progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
                        <span>{progress.completedTasks}/{progress.totalTasks} tasks</span>
                        <span>{t('planning_remaining_hours', Math.round(progress.estimatedRemainingHours))}</span>
                    </div>
                </div>
            </div>

            {/* Phases */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    {plan.phases.map((phase, phaseIndex) => (
                        <div
                            key={phase.id}
                            className={`bg-white rounded-xl border ${phase.status === 'active' ? 'border-neutral-900' : 'border-neutral-200'
                                } overflow-hidden`}
                        >
                            {/* Phase Header */}
                            <button
                                onClick={() => togglePhase(phase.id)}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {getPhaseStatusIcon(phase)}
                                    <div className="text-left">
                                        <div className="font-medium text-neutral-900">
                                            {t('planning_phase', phaseIndex + 1)}: {phase.title}
                                        </div>
                                        <div className="text-sm text-neutral-500 flex items-center gap-2 mt-0.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {phase.duration}
                                        </div>
                                    </div>
                                </div>
                                {expandedPhases.has(phase.id) ? (
                                    <ChevronUp className="w-5 h-5 text-neutral-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                                )}
                            </button>

                            {/* Tasks */}
                            {expandedPhases.has(phase.id) && (
                                <div className="px-5 pb-4 space-y-2">
                                    <p className="text-sm text-neutral-600 mb-3">{phase.description}</p>

                                    {phase.tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border ${task.status === 'completed'
                                                    ? 'bg-neutral-50 border-neutral-100'
                                                    : 'bg-white border-neutral-200'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleTaskToggle(phase.id, task.id)}
                                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                        ? 'bg-neutral-900 border-neutral-900'
                                                        : 'border-neutral-300 hover:border-neutral-400'
                                                    }`}
                                            >
                                                {task.status === 'completed' && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </button>

                                            {/* Task Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                                                    {task.title}
                                                </div>
                                                <div className="text-sm text-neutral-500 mt-1">{task.description}</div>

                                                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                                                    <span className="flex items-center gap-1">
                                                        <TaskTypeIcon type={task.type} />
                                                        <TaskTypeLabel type={task.type} />
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {t('planning_estimated_hours', task.estimatedHours)}
                                                    </span>
                                                </div>

                                                {/* Deep Learning Button */}
                                                {task.linkedTopic && task.status !== 'completed' && (
                                                    <button
                                                        onClick={() => onStartLearning(task.linkedTopic!)}
                                                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                                                    >
                                                        <Play className="w-3.5 h-3.5" />
                                                        {t('planning_start_learning')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
