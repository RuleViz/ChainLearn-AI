import React, { useState, useEffect } from 'react';
import { X, Play, Trash2, Clock, MessageSquare, CheckCircle2, Circle, Check } from 'lucide-react';
import { getSessions, formatDuration, loadWorkflowState, clearAllSessions, deleteSession, deleteSessions } from '../services/learningStats';
import { LearningSession, WorkflowState } from '../types';

interface LearningHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueLearning: (state: WorkflowState, sessionId: string) => void;
}

export const LearningHistory: React.FC<LearningHistoryProps> = ({ isOpen, onClose, onContinueLearning }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSessions(getSessions());
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  }, [isOpen]);

  const handleContinue = (session: LearningSession) => {
    console.log('尝试继续学习，会话ID:', session.id);
    console.log('会话数据:', session);
    const state = loadWorkflowState(session.id);
    console.log('加载的状态:', state);
    if (state) {
      onContinueLearning(state, session.id);
      onClose();
    } else {
      console.error('无法加载学习状态');
      alert('无法加载学习状态，可能数据已损坏或未保存');
    }
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('确定要删除这条学习记录吗？')) {
      deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条学习记录吗？此操作不可恢复。`)) {
      deleteSessions(Array.from(selectedIds));
      setSessions(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      if (selectedSession && selectedIds.has(selectedSession.id)) {
        setSelectedSession(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清除所有学习记录吗？此操作不可恢复。')) {
      clearAllSessions();
      setSessions([]);
      setSelectedSession(null);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const toggleSelection = (sessionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">学习管理</h2>
            {isSelectionMode && selectedIds.size > 0 && (
              <span className="text-sm text-slate-400">
                已选择 {selectedIds.size} 项
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <>
                {isSelectionMode ? (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-1.5 text-sm text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                    >
                      {selectedIds.size === sessions.length ? '取消全选' : '全选'}
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={handleBatchDelete}
                        className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        删除选中
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      批量管理
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      清除所有
                    </button>
                  </>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Clock className="w-16 h-16 mb-4 opacity-50" />
              <p>还没有学习记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`bg-slate-800/50 rounded-xl p-4 border transition-all ${
                    isSelectionMode
                      ? selectedIds.has(session.id)
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700'
                      : 'border-slate-700 hover:border-indigo-500/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(session.id);
                    } else {
                      setSelectedSession(session);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1">
                      {isSelectionMode && (
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedIds.has(session.id)
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-slate-600'
                          }`}
                        >
                          {selectedIds.has(session.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <h3 className="text-white font-medium line-clamp-2 flex-1">
                        {session.sessionTitle}
                      </h3>
                    </div>
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {session.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-amber-400" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{session.messageCount} 条消息</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(session.startTime).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  {!isSelectionMode && session.workflowState && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinue(session);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>{session.completed ? '查看学习' : '继续学习'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedSession && !isSelectionMode && (
          <div className="border-t border-slate-800 p-4 bg-slate-800/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">{selectedSession.sessionTitle}</h3>
                <p className="text-sm text-slate-400">
                  {selectedSession.completed ? '已完成' : '进行中'} · {formatDuration(selectedSession.duration)} · {selectedSession.messageCount} 条消息
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSession.workflowState && (
                  <button
                    onClick={() => handleContinue(selectedSession)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>{selectedSession.completed ? '查看' : '继续'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedSession.id);
                    setSelectedSession(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedSession.nodeTitles && selectedSession.nodeTitles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-2">学习节点：</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.nodeTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSession.summary && (
              <div>
                <p className="text-xs text-slate-500 mb-2">总结：</p>
                <p className="text-sm text-slate-300">{selectedSession.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningHistory;
