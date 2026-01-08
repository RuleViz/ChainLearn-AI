import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Flame, Target, TrendingUp, X } from 'lucide-react';
import { 
  getDailyStats, 
  getLearningSummary, 
  getSessions,
  formatDuration 
} from '../services/learningStats';
import { DailyLearningStats, LearningSession, LearningStatsSummary } from '../types';

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 热力图颜色映射 - OpenAI 风格
const getHeatmapColor = (intensity: number): string => {
  if (intensity === 0) return '#f5f5f5'; // neutral-100
  if (intensity < 25) return '#d4d4d4'; // neutral-300
  if (intensity < 50) return '#a3a3a3'; // neutral-400
  if (intensity < 75) return '#525252'; // neutral-600
  return '#171717'; // neutral-900
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export const Calendar: React.FC<CalendarProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyLearningStats[]>([]);
  const [summary, setSummary] = useState<LearningStatsSummary | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<LearningSession[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (isOpen) {
      const stats = getDailyStats(year, month);
      setDailyStats(stats);
      setSummary(getLearningSummary());
    }
  }, [isOpen, year, month]);

  useEffect(() => {
    if (selectedDate) {
      const sessions = getSessions({
        dateRange: {
          start: selectedDate + 'T00:00:00',
          end: selectedDate + 'T23:59:59'
        }
      });
      setSelectedDaySessions(sessions);
    }
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: Array<{ day: number; date: string; stats?: DailyLearningStats }> = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: '' });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = dailyStats.find(s => s.date === dateStr);
      days.push({ day, date: dateStr, stats });
    }
    
    return days;
  }, [year, month, dailyStats]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-neutral-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">学习日历</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 统计面板 */}
            <div className="lg:col-span-1 space-y-3">
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="总学习时长"
                value={summary ? formatDuration(summary.totalDuration) : '0分钟'}
                color="neutral"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="学习次数"
                value={`${summary?.totalSessions || 0} 次`}
                color="neutral"
              />
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="当前连续"
                value={`${summary?.currentStreak || 0} 天`}
                color="orange"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="最长连续"
                value={`${summary?.longestStreak || 0} 天`}
                color="green"
              />
            </div>

            {/* 日历主体 */}
            <div className="lg:col-span-2 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
              {/* 月份导航 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevMonth}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-neutral-900">
                    {year}年 {MONTHS[month]}
                  </span>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    今天
                  </button>
                </div>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center text-xs text-neutral-500 py-2 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => (
                  <button
                    key={idx}
                    disabled={item.day === 0}
                    onClick={() => item.day > 0 && setSelectedDate(item.date)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                      ${item.day === 0 ? 'invisible' : 'hover:ring-2 hover:ring-neutral-400'}
                      ${item.date === today ? 'ring-2 ring-neutral-900' : ''}
                      ${item.date === selectedDate ? 'ring-2 ring-neutral-600' : ''}
                    `}
                    style={{ backgroundColor: item.stats ? getHeatmapColor(item.stats.intensity) : '#f5f5f5' }}
                  >
                    <span className={`${item.date === today ? 'text-neutral-900 font-bold' : item.stats && item.stats.intensity >= 50 ? 'text-white' : 'text-neutral-700'}`}>
                      {item.day > 0 ? item.day : ''}
                    </span>
                    {item.stats && item.stats.sessionCount > 0 && (
                      <span className={`text-[10px] ${item.stats.intensity >= 50 ? 'text-neutral-300' : 'text-neutral-500'}`}>{item.stats.sessionCount}次</span>
                    )}
                  </button>
                ))}
              </div>

              {/* 图例 */}
              <div className="flex items-center justify-end gap-2 mt-4 text-xs text-neutral-500">
                <span>少</span>
                {[0, 25, 50, 75, 100].map(intensity => (
                  <div
                    key={intensity}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getHeatmapColor(intensity) }}
                  />
                ))}
                <span>多</span>
              </div>
            </div>
          </div>

          {/* 选中日期的会话列表 */}
          {selectedDate && (
            <div className="mt-4 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                {selectedDate} 的学习记录
              </h3>
              {selectedDaySessions.length === 0 ? (
                <p className="text-neutral-400 text-sm">当天没有学习记录</p>
              ) : (
                <div className="space-y-2">
                  {selectedDaySessions.map(session => (
                    <div
                      key={session.id}
                      className="bg-white rounded-lg p-3 border border-neutral-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-900 font-medium">{session.sessionTitle}</span>
                        <span className="text-xs text-neutral-500">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                      {session.summary && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{session.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                        <span>{new Date(session.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{session.messageCount} 条消息</span>
                        {session.completed ? (
                          <>
                            <span>·</span>
                            <span className="text-green-600">已完成</span>
                          </>
                        ) : (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">进行中</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 统计卡片组件 - OpenAI 风格
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'neutral' | 'orange' | 'green';
}

const colorMap = {
  neutral: 'bg-neutral-100 text-neutral-600',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600'
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-4 border border-neutral-200">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-lg font-semibold text-neutral-900">{value}</div>
      </div>
    </div>
  </div>
);

export default Calendar;
