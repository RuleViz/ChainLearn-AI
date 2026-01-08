import { Note, NotebookConfig } from '../types';

const STORAGE_KEY = 'chainlearn_notebook';

// 获取笔记本配置
export const getNotebookConfig = (): NotebookConfig => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as NotebookConfig;
    } catch (e) {
      console.error('Failed to parse notebook config:', e);
    }
  }
  return {
    notes: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
};

// 保存笔记本配置
export const saveNotebookConfig = (config: NotebookConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

// 获取所有笔记
export const getNotes = (): Note[] => {
  const config = getNotebookConfig();
  return sortNotes(config.notes, config.sortBy, config.sortOrder);
};

// 排序笔记
const sortNotes = (notes: Note[], sortBy: string, sortOrder: string): Note[] => {
  return [...notes].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'updatedAt') {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    } else if (sortBy === 'topic') {
      comparison = a.topic.localeCompare(b.topic);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

// 添加笔记
export const addNote = (
  content: string,
  topic: string,
  nodeTitle: string,
  sourceRole: 'user' | 'model',
  title?: string
): Note => {
  const config = getNotebookConfig();
  const now = new Date().toISOString();
  
  const newNote: Note = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    content,
    title: title || generateTitle(content),
    topic,
    nodeTitle,
    sourceRole,
    createdAt: now,
    updatedAt: now,
    tags: [],
    isFavorite: false
  };
  
  config.notes.unshift(newNote);
  saveNotebookConfig(config);
  return newNote;
};

// 自动生成标题（取内容前30个字符）
const generateTitle = (content: string): string => {
  const cleaned = content.replace(/[#*`\n]/g, ' ').trim();
  if (cleaned.length <= 30) return cleaned;
  return cleaned.substring(0, 30) + '...';
};

// 更新笔记
export const updateNote = (id: string, updates: Partial<Note>): void => {
  const config = getNotebookConfig();
  const index = config.notes.findIndex(n => n.id === id);
  if (index !== -1) {
    config.notes[index] = {
      ...config.notes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveNotebookConfig(config);
  }
};

// 删除笔记
export const deleteNote = (id: string): void => {
  const config = getNotebookConfig();
  config.notes = config.notes.filter(n => n.id !== id);
  saveNotebookConfig(config);
};

// 批量删除笔记
export const deleteNotes = (ids: string[]): void => {
  const config = getNotebookConfig();
  config.notes = config.notes.filter(n => !ids.includes(n.id));
  saveNotebookConfig(config);
};

// 切换收藏状态
export const toggleFavorite = (id: string): void => {
  const config = getNotebookConfig();
  const note = config.notes.find(n => n.id === id);
  if (note) {
    note.isFavorite = !note.isFavorite;
    note.updatedAt = new Date().toISOString();
    saveNotebookConfig(config);
  }
};

// 添加标签
export const addTag = (id: string, tag: string): void => {
  const config = getNotebookConfig();
  const note = config.notes.find(n => n.id === id);
  if (note && !note.tags.includes(tag)) {
    note.tags.push(tag);
    note.updatedAt = new Date().toISOString();
    saveNotebookConfig(config);
  }
};

// 移除标签
export const removeTag = (id: string, tag: string): void => {
  const config = getNotebookConfig();
  const note = config.notes.find(n => n.id === id);
  if (note) {
    note.tags = note.tags.filter(t => t !== tag);
    note.updatedAt = new Date().toISOString();
    saveNotebookConfig(config);
  }
};

// 搜索笔记
export const searchNotes = (query: string): Note[] => {
  const notes = getNotes();
  const lowerQuery = query.toLowerCase();
  return notes.filter(note =>
    note.content.toLowerCase().includes(lowerQuery) ||
    note.title?.toLowerCase().includes(lowerQuery) ||
    note.topic.toLowerCase().includes(lowerQuery) ||
    note.nodeTitle.toLowerCase().includes(lowerQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// 按主题分组笔记
export const getNotesByTopic = (): Record<string, Note[]> => {
  const notes = getNotes();
  return notes.reduce((acc, note) => {
    if (!acc[note.topic]) {
      acc[note.topic] = [];
    }
    acc[note.topic].push(note);
    return acc;
  }, {} as Record<string, Note[]>);
};

// 获取所有标签
export const getAllTags = (): string[] => {
  const notes = getNotes();
  const tags = new Set<string>();
  notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
};

// 清空所有笔记
export const clearAllNotes = (): void => {
  saveNotebookConfig({
    notes: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
};

// 根据内容和来源查找笔记（用于检查是否已保存）
export const findNoteByContent = (
  content: string,
  topic: string,
  nodeTitle: string
): Note | undefined => {
  const config = getNotebookConfig();
  return config.notes.find(
    n => n.content === content && n.topic === topic && n.nodeTitle === nodeTitle
  );
};

// 根据内容删除笔记
export const deleteNoteByContent = (
  content: string,
  topic: string,
  nodeTitle: string
): boolean => {
  const config = getNotebookConfig();
  const index = config.notes.findIndex(
    n => n.content === content && n.topic === topic && n.nodeTitle === nodeTitle
  );
  if (index !== -1) {
    config.notes.splice(index, 1);
    saveNotebookConfig(config);
    return true;
  }
  return false;
};
