import React, { useState, useEffect } from 'react';
import { X, Search, Star, Trash2, Tag, BookOpen, ChevronDown, ChevronRight, Check, Copy, Edit3 } from 'lucide-react';
import { Note } from '../types';
import { getNotes, deleteNote, deleteNotes, toggleFavorite, updateNote, searchNotes, clearAllNotes } from '../services/notebookService';
import { SimpleMarkdown } from './SimpleMarkdown';

interface NotebookProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Notebook: React.FC<NotebookProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadNotes();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  }, [isOpen]);

  const loadNotes = () => {
    const allNotes = searchQuery ? searchNotes(searchQuery) : getNotes();
    const filtered = filterFavorites ? allNotes.filter(n => n.isFavorite) : allNotes;
    setNotes(filtered);
    
    // 默认展开所有主题
    const topics = new Set(filtered.map(n => n.topic));
    setExpandedTopics(topics);
  };

  useEffect(() => {
    if (isOpen) loadNotes();
  }, [searchQuery, filterFavorites]);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      deleteNote(id);
      loadNotes();
      if (selectedNote?.id === id) setSelectedNote(null);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条笔记吗？`)) {
      deleteNotes(Array.from(selectedIds));
      loadNotes();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      if (selectedNote && selectedIds.has(selectedNote.id)) setSelectedNote(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有笔记吗？此操作不可恢复。')) {
      clearAllNotes();
      loadNotes();
      setSelectedNote(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    loadNotes();
    // 更新 selectedNote 的状态
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topic)) newSet.delete(topic);
      else newSet.add(topic);
      return newSet;
    });
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSaveTitle = (id: string) => {
    if (editTitleValue.trim()) {
      updateNote(id, { title: editTitleValue.trim() });
      loadNotes();
    }
    setEditingTitle(null);
  };

  // 按主题分组
  const notesByTopic = notes.reduce((acc, note) => {
    if (!acc[note.topic]) acc[note.topic] = [];
    acc[note.topic].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-neutral-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">笔记本</h2>
            <span className="text-sm text-neutral-500">{notes.length} 条笔记</span>
          </div>
          <div className="flex items-center gap-2">
            {notes.length > 0 && (
              <>
                {isSelectionMode ? (
                  <>
                    {selectedIds.size > 0 && (
                      <button onClick={handleBatchDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                        删除选中 ({selectedIds.size})
                      </button>
                    )}
                    <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                      className="px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">取消</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsSelectionMode(true)}
                      className="px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-lg">批量管理</button>
                    <button onClick={handleClearAll}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">清空</button>
                  </>
                )}
              </>
            )}
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-neutral-200 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
              filterFavorites ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Star className={`w-4 h-4 ${filterFavorites ? 'fill-amber-500' : ''}`} />
            收藏
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Note List */}
          <div className="w-1/2 border-r border-neutral-200 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8">
                <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                <p>{searchQuery ? '没有找到匹配的笔记' : '还没有保存任何笔记'}</p>
                <p className="text-sm mt-2">在对话中点击消息旁的保存按钮添加笔记</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {Object.entries(notesByTopic).map(([topic, topicNotes]: [string, Note[]]) => (
                  <div key={topic} className="border border-neutral-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleTopic(topic)}
                      className="w-full px-4 py-3 bg-neutral-50 flex items-center justify-between hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedTopics.has(topic) ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                        <span className="font-medium text-neutral-900">{topic}</span>
                        <span className="text-xs text-neutral-500">({topicNotes.length})</span>
                      </div>
                    </button>
                    
                    {expandedTopics.has(topic) && (
                      <div className="divide-y divide-neutral-100">
                        {topicNotes.map(note => (
                          <div
                            key={note.id}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedNote?.id === note.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                            }`}
                            onClick={() => !isSelectionMode && setSelectedNote(note)}
                          >
                            <div className="flex items-start gap-2">
                              {isSelectionMode && (
                                <div
                                  onClick={(e) => { e.stopPropagation(); toggleSelection(note.id); }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
                                    selectedIds.has(note.id) ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300'
                                  }`}
                                >
                                  {selectedIds.has(note.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-neutral-900 truncate">{note.title}</span>
                                  {note.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-neutral-500 mt-0.5">{note.nodeTitle}</p>
                                <p className="text-xs text-neutral-400 mt-1">{new Date(note.createdAt).toLocaleString('zh-CN')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Note Detail */}
          <div className="w-1/2 overflow-y-auto">
            {selectedNote ? (
              <div className="p-4 space-y-4">
                {/* Note Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingTitle === selectedNote.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="flex-1 px-2 py-1 border border-neutral-300 rounded text-lg font-medium focus:outline-none focus:border-neutral-400"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(selectedNote.id)}
                        />
                        <button onClick={() => handleSaveTitle(selectedNote.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTitle(null)} className="p-1 text-neutral-400 hover:bg-neutral-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-neutral-900">{selectedNote.title}</h3>
                        <button
                          onClick={() => { setEditingTitle(selectedNote.id); setEditTitleValue(selectedNote.title || ''); }}
                          className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      <span>{selectedNote.topic}</span>
                      <span>·</span>
                      <span>{selectedNote.nodeTitle}</span>
                      <span>·</span>
                      <span>{selectedNote.sourceRole === 'model' ? 'AI 回复' : '我的提问'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFavorite(selectedNote.id)}
                      className={`p-2 rounded-lg transition-colors ${selectedNote.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                    >
                      <Star className={`w-4 h-4 ${selectedNote.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCopyContent(selectedNote.content)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                      title="复制内容"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedNote.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <SimpleMarkdown content={selectedNote.content} />
                </div>

                {/* Meta */}
                <div className="text-xs text-neutral-400 space-y-1">
                  <p>创建时间: {new Date(selectedNote.createdAt).toLocaleString('zh-CN')}</p>
                  <p>更新时间: {new Date(selectedNote.updatedAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                <p>选择一条笔记查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notebook;
