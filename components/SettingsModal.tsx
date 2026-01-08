import React, { useState, useEffect } from 'react';
import { AIConfig, LearningGranularity, ProviderConfig, ModelConfig, Expert, ExpertConfig } from '../types';
import { X, Save, Key, Globe, Box, Layers, Plus, Trash2, AlertCircle, ExternalLink, Users, RotateCcw, Edit3, Check, Languages } from 'lucide-react';
import { PRESET_PROVIDERS, createDefaultProviderConfig, createCustomProviderConfig } from '../services/providerPresets';
import { getExpertConfig, saveExpertConfig, addExpert, updateExpert, deleteExpert, resetBuiltInExpert, resetAllExperts, BUILTIN_EXPERTS } from '../src/expert';
import { useTranslation } from '../contexts/LanguageContext';
import { Language } from '../services/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

const GRANULARITY_OPTIONS: { value: LearningGranularity; label: string; labelEn: string; desc: string; descEn: string; nodes: string }[] = [
  { value: 'brief', label: '简洁', labelEn: 'Brief', desc: '快速概览，适合有基础的学习者', descEn: 'Quick overview for learners with background', nodes: '2-3' },
  { value: 'standard', label: '标准', labelEn: 'Standard', desc: '平衡深度与效率', descEn: 'Balanced depth and efficiency', nodes: '4-6' },
  { value: 'detailed', label: '详细', labelEn: 'Detailed', desc: '深入学习，适合初学者', descEn: 'In-depth learning for beginners', nodes: '7-10' },
];

type TabType = 'providers' | 'experts' | 'learning';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>('');
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [granularity, setGranularity] = useState<LearningGranularity>('standard');
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  
  // 专家管理状态
  const [expertConfig, setExpertConfig] = useState<ExpertConfig>({ experts: [], defaultExpertId: '' });
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [showAddExpert, setShowAddExpert] = useState(false);
  const [newExpert, setNewExpert] = useState<Partial<Expert>>({
    name: '', description: '', systemPrompt: '', avatar: '🎓'
  });

  useEffect(() => {
    if (isOpen) {
      const initialProviders = config.providers || [];
      setProviders(initialProviders);
      setActiveProviderId(config.activeProviderId || initialProviders[0]?.id || '');
      setActiveModelId(config.activeModelId || '');
      setGranularity(config.granularity || 'standard');
      setEditingProvider(null);
      setShowAddProvider(false);
      setExpertConfig(getExpertConfig());
      setEditingExpert(null);
      setShowAddExpert(false);
    }
  }, [isOpen, config]);


  if (!isOpen) return null;

  const handleSave = () => {
    const activeProvider = providers.find(p => p.id === activeProviderId);
    const newConfig: AIConfig = {
      provider: 'OPENAI',
      baseUrl: activeProvider?.baseUrl || '',
      apiKey: activeProvider?.apiKey || '',
      modelId: activeModelId,
      granularity,
      providers,
      activeProviderId,
      activeModelId,
    };
    onSave(newConfig);
    onClose();
  };

  const handleAddPresetProvider = (presetId: string) => {
    const newProvider = createDefaultProviderConfig(presetId as any);
    if (newProvider) {
      newProvider.enabled = true;
      setProviders([...providers, newProvider]);
      setEditingProvider(newProvider);
      if (providers.length === 0) {
        setActiveProviderId(newProvider.id);
        const defaultModel = newProvider.models.find(m => m.isDefault) || newProvider.models[0];
        setActiveModelId(defaultModel?.id || '');
      }
    }
    setShowAddProvider(false);
  };

  const handleAddCustomProvider = () => {
    const newProvider = createCustomProviderConfig('自定义服务商', 'https://api.example.com/v1');
    newProvider.enabled = true;
    setProviders([...providers, newProvider]);
    setEditingProvider(newProvider);
    if (providers.length === 0) {
      setActiveProviderId(newProvider.id);
      setActiveModelId(newProvider.models[0]?.id || '');
    }
    setShowAddProvider(false);
  };

  const handleDeleteProvider = (id: string) => {
    setProviders(providers.filter(p => p.id !== id));
    if (activeProviderId === id) {
      const remaining = providers.filter(p => p.id !== id);
      setActiveProviderId(remaining[0]?.id || '');
      setActiveModelId(remaining[0]?.models[0]?.id || '');
    }
    if (editingProvider?.id === id) setEditingProvider(null);
  };

  const handleUpdateProvider = (updates: Partial<ProviderConfig>) => {
    if (!editingProvider) return;
    const updated = { ...editingProvider, ...updates };
    setEditingProvider(updated);
    setProviders(providers.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddModel = () => {
    if (!editingProvider || !newModelName.trim()) return;
    const newModel: ModelConfig = { id: newModelName.trim(), name: newModelName.trim() };
    handleUpdateProvider({ models: [...editingProvider.models, newModel] });
    setNewModelName('');
  };

  const handleDeleteModel = (modelId: string) => {
    if (!editingProvider) return;
    handleUpdateProvider({ models: editingProvider.models.filter(m => m.id !== modelId) });
  };

  const handleSelectProvider = (providerId: string) => {
    setActiveProviderId(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      const defaultModel = provider.models.find(m => m.isDefault) || provider.models[0];
      setActiveModelId(defaultModel?.id || '');
    }
  };

  // 专家管理函数
  const handleUpdateExpert = (id: string, updates: Partial<Expert>) => {
    updateExpert(id, updates);
    setExpertConfig(getExpertConfig());
    if (editingExpert?.id === id) {
      setEditingExpert({ ...editingExpert, ...updates });
    }
  };

  const handleDeleteExpert = (id: string) => {
    if (confirm('确定要删除这个专家吗？')) {
      deleteExpert(id);
      setExpertConfig(getExpertConfig());
      if (editingExpert?.id === id) setEditingExpert(null);
    }
  };

  const handleResetExpert = (id: string) => {
    if (confirm('确定要重置这个专家到默认设置吗？')) {
      resetBuiltInExpert(id);
      setExpertConfig(getExpertConfig());
      const updated = getExpertConfig().experts.find(e => e.id === id);
      if (updated && editingExpert?.id === id) setEditingExpert(updated);
    }
  };

  const handleResetAllExperts = () => {
    if (confirm('确定要重置所有专家到默认设置吗？这将删除所有自定义专家。')) {
      resetAllExperts();
      setExpertConfig(getExpertConfig());
      setEditingExpert(null);
    }
  };

  const handleAddNewExpert = () => {
    if (!newExpert.name || !newExpert.systemPrompt) return;
    const expert = addExpert({
      name: newExpert.name,
      description: newExpert.description || '',
      systemPrompt: newExpert.systemPrompt,
      avatar: newExpert.avatar || '🎓',
      enabled: true
    });
    setExpertConfig(getExpertConfig());
    setShowAddExpert(false);
    setNewExpert({ name: '', description: '', systemPrompt: '', avatar: '🎓' });
    setEditingExpert(expert);
  };

  const activeProvider = providers.find(p => p.id === activeProviderId);
  const enabledProviders = providers.filter(p => p.enabled);
  const hasNoProviders = providers.length === 0;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white shrink-0">
          <h2 className="text-xl font-semibold text-neutral-900">{t('settings')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 shrink-0 bg-neutral-50">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'providers' ? 'text-neutral-900 border-b-2 border-neutral-900 bg-white' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t('settings_provider')}
          </button>
          <button
            onClick={() => setActiveTab('experts')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'experts' ? 'text-neutral-900 border-b-2 border-neutral-900 bg-white' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t('settings_experts')}
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'learning' ? 'text-neutral-900 border-b-2 border-neutral-900 bg-white' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t('settings_preferences')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {hasNoProviders && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-amber-800 font-medium">尚未配置服务商</div>
                    <div className="text-sm text-amber-700 mt-1">请添加至少一个 AI 服务商并配置 API Key 才能使用学习功能。</div>
                  </div>
                </div>
              )}

              {enabledProviders.length > 0 && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-medium">当前使用</div>
                  <div className="flex gap-3">
                    <select value={activeProviderId} onChange={(e) => handleSelectProvider(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400">
                      {enabledProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={activeModelId} onChange={(e) => setActiveModelId(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400">
                      {activeProvider?.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-700">服务商列表</div>
                  <button onClick={() => setShowAddProvider(true)} className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900">
                    <Plus className="w-4 h-4" /> 添加服务商
                  </button>
                </div>

                {providers.length === 0 && !showAddProvider && (
                  <div className="p-8 text-center text-neutral-400 border border-dashed border-neutral-300 rounded-xl">
                    <div className="text-sm">暂无服务商</div>
                    <button onClick={() => setShowAddProvider(true)} className="mt-2 text-neutral-600 hover:text-neutral-900 text-sm">点击添加</button>
                  </div>
                )}

                {providers.map(provider => (
                  <div key={provider.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${editingProvider?.id === provider.id ? 'bg-neutral-50 border-neutral-400' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
                    onClick={() => setEditingProvider(provider)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-neutral-300'}`} />
                        <div>
                          <div className="font-medium text-neutral-900">{provider.name}</div>
                          <div className="text-xs text-neutral-500">{provider.baseUrl}</div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProvider(provider.id); }} className="p-1 text-neutral-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>


              {/* Provider Editor */}
              {editingProvider && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-neutral-900">编辑: {editingProvider.name}</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingProvider.enabled} onChange={(e) => handleUpdateProvider({ enabled: e.target.checked })}
                        className="rounded border-neutral-300 bg-white text-neutral-900 focus:ring-neutral-400" />
                      <span className="text-neutral-600">启用</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 flex items-center gap-1"><Globe className="w-3 h-3" /> 名称</label>
                      <input type="text" value={editingProvider.name} onChange={(e) => handleUpdateProvider({ name: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Base URL</label>
                      <input type="text" value={editingProvider.baseUrl} onChange={(e) => handleUpdateProvider({ baseUrl: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-500 flex items-center gap-1"><Key className="w-3 h-3" /> API Key</label>
                      {editingProvider.presetId && PRESET_PROVIDERS.find(p => p.id === editingProvider.presetId)?.apiKeyUrl && (
                        <a href={PRESET_PROVIDERS.find(p => p.id === editingProvider.presetId)?.apiKeyUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          获取 API Key <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input type="password" value={editingProvider.apiKey} onChange={(e) => handleUpdateProvider({ apiKey: e.target.value })} placeholder="sk-..."
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 flex items-center gap-1"><Box className="w-3 h-3" /> 模型列表</label>
                    <div className="flex flex-wrap gap-2">
                      {editingProvider.models.map(model => (
                        <div key={model.id} className="flex items-center gap-1 px-2 py-1 bg-neutral-200 rounded text-xs text-neutral-700">
                          {model.name}
                          <button onClick={() => handleDeleteModel(model.id)} className="text-neutral-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="添加模型 ID"
                        className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddModel()} />
                      <button onClick={handleAddModel} className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg text-sm">添加</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Provider Panel */}
              {showAddProvider && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-neutral-900">选择服务商</div>
                    <button onClick={() => setShowAddProvider(false)} className="text-neutral-400 hover:text-neutral-900"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_PROVIDERS.map(preset => (
                      <button key={preset.id} onClick={() => handleAddPresetProvider(preset.id)}
                        className="p-3 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-left transition-colors">
                        <div className="font-medium text-neutral-900 text-sm">{preset.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">{preset.description}</div>
                      </button>
                    ))}
                    <button onClick={handleAddCustomProvider} className="p-3 bg-white hover:bg-neutral-100 border border-dashed border-neutral-300 rounded-lg text-left transition-colors">
                      <div className="font-medium text-neutral-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> OpenAI 兼容</div>
                      <div className="text-xs text-neutral-500 mt-1">自定义 API 端点</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Experts Tab */}
          {activeTab === 'experts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">AI 专家列表</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleResetAllExperts} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                    <RotateCcw className="w-3 h-3" /> 重置全部
                  </button>
                  <button onClick={() => setShowAddExpert(true)} className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900">
                    <Plus className="w-4 h-4" /> 添加专家
                  </button>
                </div>
              </div>

              <p className="text-xs text-neutral-500">专家会根据学习主题自动匹配，你可以自定义专家的提示词和设定。</p>

              {/* Expert List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertConfig.experts.map(expert => (
                  <div key={expert.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${editingExpert?.id === expert.id ? 'bg-neutral-50 border-neutral-400' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
                    onClick={() => setEditingExpert(expert)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{expert.avatar || '🎓'}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900 truncate">{expert.name}</span>
                            {expert.isBuiltIn && <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">内置</span>}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{expert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${expert.enabled !== false ? 'bg-green-500' : 'bg-neutral-300'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expert Editor */}
              {editingExpert && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{editingExpert.avatar || '🎓'}</span>
                      <span className="font-medium text-neutral-900">{editingExpert.name}</span>
                      {editingExpert.isBuiltIn && <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">内置</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editingExpert.enabled !== false}
                          onChange={(e) => handleUpdateExpert(editingExpert.id, { enabled: e.target.checked })}
                          className="rounded border-neutral-300 bg-white text-neutral-900 focus:ring-neutral-400" />
                        <span className="text-neutral-600">启用</span>
                      </label>
                      {editingExpert.isBuiltIn && (
                        <button onClick={() => handleResetExpert(editingExpert.id)} className="p-1 text-neutral-400 hover:text-neutral-700" title="重置到默认">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {!editingExpert.isBuiltIn && (
                        <button onClick={() => handleDeleteExpert(editingExpert.id)} className="p-1 text-neutral-400 hover:text-red-500" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500">名称</label>
                      <input type="text" value={editingExpert.name}
                        onChange={(e) => handleUpdateExpert(editingExpert.id, { name: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500">头像 (Emoji)</label>
                      <input type="text" value={editingExpert.avatar || ''}
                        onChange={(e) => handleUpdateExpert(editingExpert.id, { avatar: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">简介 (用于 AI 路由匹配)</label>
                    <input type="text" value={editingExpert.description}
                      onChange={(e) => handleUpdateExpert(editingExpert.id, { description: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">系统提示词 (System Prompt)</label>
                    <textarea value={editingExpert.systemPrompt}
                      onChange={(e) => handleUpdateExpert(editingExpert.id, { systemPrompt: e.target.value })}
                      rows={5}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400 resize-none" />
                  </div>
                </div>
              )}


              {/* Add Expert Panel */}
              {showAddExpert && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-neutral-900">添加新专家</div>
                    <button onClick={() => setShowAddExpert(false)} className="text-neutral-400 hover:text-neutral-900"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500">名称 *</label>
                      <input type="text" value={newExpert.name || ''} onChange={(e) => setNewExpert({ ...newExpert, name: e.target.value })} placeholder="Dr. Example"
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500">头像 (Emoji)</label>
                      <input type="text" value={newExpert.avatar || ''} onChange={(e) => setNewExpert({ ...newExpert, avatar: e.target.value })} placeholder="🎓"
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">简介</label>
                    <input type="text" value={newExpert.description || ''} onChange={(e) => setNewExpert({ ...newExpert, description: e.target.value })} placeholder="专家的简短介绍..."
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">系统提示词 *</label>
                    <textarea value={newExpert.systemPrompt || ''} onChange={(e) => setNewExpert({ ...newExpert, systemPrompt: e.target.value })}
                      placeholder="You are an expert in..." rows={4}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:outline-none focus:border-neutral-400 resize-none" />
                  </div>

                  <button onClick={handleAddNewExpert} disabled={!newExpert.name || !newExpert.systemPrompt}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-lg text-sm font-medium transition-colors">
                    添加专家
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Learning Tab */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              {/* Language Setting */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-neutral-500" />
                  {t('settings_language')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      language === 'zh' ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-medium text-sm">{t('language_zh')}</span>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      language === 'en' ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-medium text-sm">{t('language_en')}</span>
                  </button>
                </div>
              </div>

              {/* Granularity Setting */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-500" />
                  {t('settings_granularity')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRANULARITY_OPTIONS.map((option) => (
                    <button key={option.value} onClick={() => setGranularity(option.value)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        granularity === option.value ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}>
                      <div className="font-medium text-sm">{language === 'zh' ? option.label : option.labelEn}</div>
                      <span className="text-xs opacity-70">{option.nodes}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500">{language === 'zh' ? GRANULARITY_OPTIONS.find(o => o.value === granularity)?.desc : GRANULARITY_OPTIONS.find(o => o.value === granularity)?.descEn}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm">{t('cancel')}</button>
          <button onClick={handleSave} className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Save className="w-4 h-4" /> {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
