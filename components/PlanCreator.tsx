import React, { useState } from 'react';
import { ArrowLeft, Loader2, Clock, BookOpen, Sparkles } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { PlanCreationInput } from '../planningTypes';

interface PlanCreatorProps {
    onBack: () => void;
    onCreatePlan: (input: PlanCreationInput) => Promise<void>;
    isCreating: boolean;
}

export const PlanCreator: React.FC<PlanCreatorProps> = ({
    onBack,
    onCreatePlan,
    isCreating,
}) => {
    const { t } = useTranslation();
    const [goal, setGoal] = useState('');
    const [weeklyHours, setWeeklyHours] = useState<number>(10);
    const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

    const handleSubmit = async () => {
        if (!goal.trim() || isCreating) return;

        await onCreatePlan({
            goal: goal.trim(),
            weeklyHours,
            currentLevel,
        });
    };

    const hourOptions = [
        { value: 5, label: t('planning_hours_5') },
        { value: 10, label: t('planning_hours_10') },
        { value: 15, label: t('planning_hours_20') },
        { value: 25, label: t('planning_hours_more') },
    ];

    const levelOptions = [
        { value: 'beginner' as const, label: t('planning_level_beginner') },
        { value: 'intermediate' as const, label: t('planning_level_intermediate') },
        { value: 'advanced' as const, label: t('planning_level_advanced') },
    ];

    if (isCreating) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full loading-dot"></div>
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-medium text-neutral-900">{t('planning_creating')}</h3>
                    <p className="text-neutral-500 text-sm">AI 正在为你制定详细的学习计划</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-white flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{t('planning_title')}</h2>
                    <p className="text-sm text-neutral-500">{t('planning_subtitle')}</p>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-xl mx-auto space-y-8">
                    {/* Goal Input */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <Sparkles className="w-4 h-4 text-neutral-500" />
                            {t('planning_goal_label')}
                        </label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t('planning_goal_placeholder')}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors placeholder:text-neutral-400 resize-none"
                            rows={3}
                            autoFocus
                        />
                    </div>

                    {/* Weekly Hours */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <Clock className="w-4 h-4 text-neutral-500" />
                            {t('planning_weekly_hours')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {hourOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setWeeklyHours(option.value)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${weeklyHours === option.value
                                            ? 'bg-neutral-900 border-neutral-900 text-white'
                                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Level */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <BookOpen className="w-4 h-4 text-neutral-500" />
                            {t('planning_level')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {levelOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setCurrentLevel(option.value)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${currentLevel === option.value
                                            ? 'bg-neutral-900 border-neutral-900 text-white'
                                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!goal.trim() || isCreating}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('planning_creating')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                {t('planning_create')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
