import React from 'react';
import { Plus, Clock, ChevronRight, Folder } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { LearningPlan } from '../planningTypes';
import { calculateProgress } from '../services/planningService';

interface PlanningHomeProps {
    plans: LearningPlan[];
    onCreateNew: () => void;
    onSelectPlan: (planId: string) => void;
}

export const PlanningHome: React.FC<PlanningHomeProps> = ({
    plans,
    onCreateNew,
    onSelectPlan,
}) => {
    const { t } = useTranslation();

    const activePlans = plans.filter(p => p.status === 'active');
    const completedPlans = plans.filter(p => p.status === 'completed');

    const PlanCard: React.FC<{ plan: LearningPlan }> = ({ plan }) => {
        const progress = calculateProgress(plan);

        return (
            <button
                onClick={() => onSelectPlan(plan.id)}
                className="w-full bg-white rounded-xl border border-neutral-200 p-5 text-left hover:border-neutral-300 hover:shadow-sm transition-all"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">{plan.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{plan.goal}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-3" />
                </div>

                {/* Progress */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                        <span>{progress.completedTasks}/{progress.totalTasks} tasks</span>
                        <span>{progress.progressPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${plan.status === 'completed' ? 'bg-green-500' : 'bg-neutral-900'
                                }`}
                            style={{ width: `${progress.progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.totalDuration}
                    </span>
                    <span>{plan.weeklyHours}h/week</span>
                </div>
            </button>
        );
    };

    // Empty State
    if (plans.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Folder className="w-8 h-8 text-neutral-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-neutral-900">{t('planning_no_plans')}</h2>
                        <p className="text-neutral-500">{t('planning_no_plans_desc')}</p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        {t('planning_new')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-neutral-900">{t('planning_my_plans')}</h2>
                    <button
                        onClick={onCreateNew}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {t('planning_new')}
                    </button>
                </div>

                {/* Active Plans */}
                {activePlans.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Active ({activePlans.length})
                        </h3>
                        <div className="grid gap-4">
                            {activePlans.map(plan => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Plans */}
                {completedPlans.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Completed ({completedPlans.length})
                        </h3>
                        <div className="grid gap-4">
                            {completedPlans.map(plan => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
