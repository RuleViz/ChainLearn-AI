import { 
  LearningSession, 
  DailyLearningStats, 
  HeatmapData, 
  HeatmapDataPoint,
  LearningStatsSummary, 
  CalendarFilters,
  WorkflowState
} from '../types';

const STORAGE_KEY = 'chainlearn_sessions_v1';

interface StoredData {
  version: number;
  sessions: LearningSession[];
  lastUpdated: string;
}

// 获取存储数据
function getStoredData(): StoredData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse stored sessions:', e);
  }
  return { version: 1, sessions: [], lastUpdated: new Date().toISOString() };
}

// 保存数据
function saveData(data: StoredData): void {
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 生成唯一ID
function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// 开始新会话
export function startSession(nodeIds: string[], sessionTitle: string, nodeTitles?: string[]): string {
  const data = getStoredData();
  const id = generateId();
  
  const session: LearningSession = {
    id,
    nodeId: nodeIds,
    nodeTitles: nodeTitles || [],
    sessionTitle,
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    messageCount: 0,
    completed: false,
    summary: '',
    tags: [],
    lastActiveTime: new Date().toISOString() // 记录最后活跃时间
  };
  
  data.sessions.push(session);
  saveData(data);
  return id;
}


// 结束会话
export function endSession(sessionId: string, summary?: string, messageCount?: number): void {
  const data = getStoredData();
  const session = data.sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.endTime = new Date().toISOString();
    session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    session.completed = true;
    if (summary) session.summary = summary;
    if (messageCount !== undefined) session.messageCount = messageCount;
    saveData(data);
  }
}

// 更新会话消息数
export function updateSessionMessageCount(sessionId: string, count: number): void {
  const data = getStoredData();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    session.messageCount = count;
    saveData(data);
  }
}

// 累计学习时间（定时器调用，只在学习界面时累计）
export function accumulateSessionTime(sessionId: string): void {
  const data = getStoredData();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    const now = Date.now();
    
    if (session.lastActiveTime) {
      const lastActive = new Date(session.lastActiveTime).getTime();
      const timeDiff = now - lastActive;
      
      // 只累计30秒内的时间（超过30秒认为是新的计时周期开始）
      // 这样可以避免页面切换、刷新等情况下累计错误时间
      if (timeDiff > 0 && timeDiff < 30 * 1000) {
        session.duration += timeDiff;
      }
    }
    
    session.lastActiveTime = new Date().toISOString();
    saveData(data);
  }
}

// 保存工作流状态（用于继续学习）
export function saveWorkflowState(sessionId: string, state: WorkflowState): void {
  const data = getStoredData();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session) {
    session.workflowState = JSON.stringify(state);
    saveData(data);
  }
}

// 加载工作流状态
export function loadWorkflowState(sessionId: string): WorkflowState | null {
  const data = getStoredData();
  const session = data.sessions.find(s => s.id === sessionId);
  if (session && session.workflowState) {
    try {
      return JSON.parse(session.workflowState);
    } catch (e) {
      console.error('Failed to parse workflow state:', e);
    }
  }
  return null;
}

// 获取所有会话
export function getSessions(filters?: CalendarFilters): LearningSession[] {
  const data = getStoredData();
  let sessions = data.sessions;
  
  if (filters) {
    if (filters.nodeIds?.length) {
      sessions = sessions.filter(s => s.nodeId.some(id => filters.nodeIds!.includes(id)));
    }
    if (filters.tags?.length) {
      sessions = sessions.filter(s => s.tags.some(tag => filters.tags!.includes(tag)));
    }
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start).getTime();
      const end = new Date(filters.dateRange.end).getTime();
      sessions = sessions.filter(s => {
        const time = new Date(s.startTime).getTime();
        return time >= start && time <= end;
      });
    }
    if (filters.minDuration) {
      sessions = sessions.filter(s => s.duration >= filters.minDuration!);
    }
  }
  
  return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

// 获取当前活跃会话
export function getActiveSession(): LearningSession | null {
  const data = getStoredData();
  return data.sessions.find(s => !s.completed && s.endTime === '') || null;
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 获取会话的实际时长
function getSessionActualDuration(session: LearningSession): number {
  return session.duration;
}

// 获取每日统计
export function getDailyStats(year: number, month?: number): DailyLearningStats[] {
  const data = getStoredData();
  const statsMap = new Map<string, DailyLearningStats>();
  
  data.sessions.forEach(session => {
    if (!session.startTime) return;
    
    const sessionDate = new Date(session.startTime);
    if (sessionDate.getFullYear() !== year) return;
    if (month !== undefined && sessionDate.getMonth() !== month) return;
    
    const dateKey = formatDate(sessionDate);
    
    if (!statsMap.has(dateKey)) {
      statsMap.set(dateKey, {
        date: dateKey,
        totalDuration: 0,
        sessionId: [],
        sessionCount: 0,
        intensity: 0,
        completedSessions: 0
      });
    }
    
    const stats = statsMap.get(dateKey)!;
    stats.sessionId.push(session.id);
    stats.sessionCount++;
    stats.totalDuration += getSessionActualDuration(session);
    if (session.completed) stats.completedSessions++;
  });
  
  // 计算强度 (基于学习时长，最大2小时为100)
  const maxDuration = 2 * 60 * 60 * 1000; // 2小时
  statsMap.forEach(stats => {
    stats.intensity = Math.min(100, Math.round((stats.totalDuration / maxDuration) * 100));
  });
  
  return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}


// 获取热力图数据
export function getHeatmapData(year: number, month?: number): HeatmapData {
  const dailyStats = getDailyStats(year, month);
  
  const dataPoints: HeatmapDataPoint[] = dailyStats.map(stats => ({
    data: stats.date,
    value: stats.intensity,
    duration: stats.totalDuration,
    tooltip: `${stats.date}: ${formatDuration(stats.totalDuration)}, ${stats.sessionCount} 次学习`
  }));
  
  return {
    year,
    month,
    data: dataPoints
  };
}

// 格式化时长
export function formatDuration(ms: number): string {
  if (ms < 1000) return '0分钟';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`;
  }
  return `${minutes}分钟`;
}

// 获取学习统计摘要
export function getLearningSummary(): LearningStatsSummary {
  const data = getStoredData();
  
  // 计算所有会话
  const allSessions = data.sessions;
  const completedSessions = data.sessions.filter(s => s.completed);
  
  const totalSessions = completedSessions.length;
  
  // 计算总时长（只计算已记录的 duration）
  const totalDuration = allSessions.reduce((sum, s) => sum + s.duration, 0);
  
  // 计算每日学习情况
  const dailyMap = new Map<string, number>();
  allSessions.forEach(s => {
    if (!s.startTime) return;
    const date = formatDate(new Date(s.startTime));
    dailyMap.set(date, (dailyMap.get(date) || 0) + s.duration);
  });
  
  const daysWithLearning = dailyMap.size;
  const averageDailyDuration = daysWithLearning > 0 ? totalDuration / daysWithLearning : 0;
  
  // 计算连续学习天数
  const sortedDates = Array.from(dailyMap.keys()).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 1;
  
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // 当前连续天数
  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    currentStreak = 1;
    const startDate = sortedDates.includes(today) ? today : yesterday;
    let checkDate = new Date(startDate);
    
    while (true) {
      checkDate = new Date(checkDate.getTime() - 86400000);
      const checkDateStr = formatDate(checkDate);
      if (sortedDates.includes(checkDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // 最活跃的一天
  let mostActiveDay: string | undefined;
  let maxDuration = 0;
  dailyMap.forEach((duration, date) => {
    if (duration > maxDuration) {
      maxDuration = duration;
      mostActiveDay = date;
    }
  });
  
  return {
    totalSessions,
    totalDuration,
    averageDailyDuration,
    longestStreak,
    currentStreak,
    mostActiveDay
  };
}

// 导出数据
export function exportSessions(): string {
  return JSON.stringify(getStoredData(), null, 2);
}

// 导入数据
export function importSessions(json: string): boolean {
  try {
    const imported = JSON.parse(json) as StoredData;
    if (imported.sessions && Array.isArray(imported.sessions)) {
      saveData(imported);
      return true;
    }
  } catch (e) {
    console.error('Failed to import sessions:', e);
  }
  return false;
}

// 删除单个会话
export function deleteSession(sessionId: string): boolean {
  const data = getStoredData();
  const index = data.sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    data.sessions.splice(index, 1);
    saveData(data);
    return true;
  }
  return false;
}

// 批量删除会话
export function deleteSessions(sessionIds: string[]): number {
  const data = getStoredData();
  const idsSet = new Set(sessionIds);
  const originalLength = data.sessions.length;
  data.sessions = data.sessions.filter(s => !idsSet.has(s.id));
  const deletedCount = originalLength - data.sessions.length;
  if (deletedCount > 0) {
    saveData(data);
  }
  return deletedCount;
}

// 清除所有数据
export function clearAllSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
