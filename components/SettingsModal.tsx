import React, { useState, useEffect } from 'react';
import { AIConfig, LearningGranularity, ProviderConfig, ModelConfig } from '../types';
import { X, Save, Key, Globe, Box, Layers, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { PRESET_PROVIDERS, createDefaultProviderConfig, createCustomProviderConfig } from '../services/providerPresets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

const GRANULARITY_OPTIONS: { value: LearningGranularity; label: string; desc: string; nodes: string }[] = [
  { value: 'brief', label: '简洁', desc: '快速概览，适合有基础的学习者', nodes: '2-3 节点' },
  { value: 'standard', label: '标准', desc: '平衡深度与效率', nodes: '4-6 节点' },
  { value: 'detailed', label: '详细', desc: '深入学习，适合初学者', nodes: '7-10 节点' },
];

type TabType = 'providers' | 'learning';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>('');
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [granularity, setGranularity] = useState<LearningGranularity>('standard');
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialProviders = config.providers || [];
      setProviders(initialProviders);
      setActiveProviderId(config.activeProviderId || initialProviders[0]?.id || '');
      setActiveModelId(config.activeModelId || '');
      setGranularity(config.granularity || 'standard');
      setEditingProvider(null);
      setShowAddProvider(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    const activeProvider = providers.find(p => p.id === activeProviderId);
    const newConfig: AIConfig = {
      // 兼容旧版字段
      provider: 'OPENAI',
      baseUrl: activeProvider?.baseUrl || '',
      apiKey: activeProvider?.apiKey || '',
      modelId: activeModelId,
      granularity,
      // 新版字段
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
      // 如果是第一个服务商，自动设为激活
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
    if (editingProvider?.id === id) {
      setEditingProvider(null);
    }
  };

  const handleUpdateProvider = (updates: Partial<ProviderConfig>) => {
    if (!editingProvider) return;
    const updated = { ...editingProvider, ...updates };
    setEditingProvider(updated);
    setProviders(providers.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddModel = () => {
    if (!editingProvider || !newModelName.trim()) return;
    const newModel: ModelConfig = {
      id: newModelName.trim(),
      name: newModelName.trim(),
    };
    handleUpdateProvider({
      models: [...editingProvider.models, newModel]
    });
    setNewModelName('');
  };

  const handleDeleteModel = (modelId: string) => {
    if (!editingProvider) return;
    handleUpdateProvider({
      models: editingProvider.models.filter(m => m.id !== modelId)
    });
  };

  const handleSelectProvider = (providerId: string) => {
    setActiveProviderId(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      const defaultModel = provider.models.find(m => m.isDefault) || provider.models[0];
      setActiveModelId(defaultModel?.id || '');
    }
  };

  const activeProvider = providers.find(p => p.id === activeProviderId);
  const enabledProviders = providers.filter(p => p.enabled);
  const hasNoProviders = providers.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <h2 className="text-xl font-bold text-white">设置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'providers'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI 服务商
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'learning'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            学习设置
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* No Provider Warning */}
              {hasNoProviders && (
                <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-amber-400 font-medium">尚未配置服务商</div>
                    <div className="text-sm text-amber-500/80 mt-1">请添加至少一个 AI 服务商并配置 API Key 才能使用学习功能。</div>
                  </div>
                </div>
              )}

              {/* Current Selection */}
              {enabledProviders.length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">当前使用</div>
                  <div className="flex gap-3">
                    <select
                      value={activeProviderId}
                      onChange={(e) => handleSelectProvider(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                    >
                      {enabledProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={activeModelId}
                      onChange={(e) => setActiveModelId(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                    >
                      {activeProvider?.models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Provider List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-300">服务商列表</div>
                  <button
                    onClick={() => setShowAddProvider(true)}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    <Plus className="w-4 h-4" />
                    添加服务商
                  </button>
                </div>

                {providers.length === 0 && !showAddProvider && (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                    <div className="text-sm">暂无服务商</div>
                    <button
                      onClick={() => setShowAddProvider(true)}
                      className="mt-2 text-sky-400 hover:text-sky-300 text-sm"
                    >
                      点击添加
                    </button>
                  </div>
                )}

                {providers.map(provider => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      editingProvider?.id === provider.id
                        ? 'bg-slate-800 border-sky-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => setEditingProvider(provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <div>
                          <div className="font-medium text-white">{provider.name}</div>
                          <div className="text-xs text-slate-500">{provider.baseUrl}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProvider(provider.id); }}
                        className="p-1 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Provider Editor */}
              {editingProvider && (
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">编辑: {editingProvider.name}</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editingProvider.enabled}
                        onChange={(e) => handleUpdateProvider({ enabled: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-slate-400">启用</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> 名称
                      </label>
                      <input
                        type="text"
                        value={editingProvider.name}
                        onChange={(e) => handleUpdateProvider({ name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Base URL
                      </label>
                      <input
                        type="text"
                        value={editingProvider.baseUrl}
                        onChange={(e) => handleUpdateProvider({ baseUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key className="w-3 h-3" /> API Key
                      </label>
                      {editingProvider.presetId && PRESET_PROVIDERS.find(p => p.id === editingProvider.presetId)?.apiKeyUrl && (
                        <a
                          href={PRESET_PROVIDERS.find(p => p.id === editingProvider.presetId)?.apiKeyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          获取 API Key
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <input
                      type="password"
                      value={editingProvider.apiKey}
                      onChange={(e) => handleUpdateProvider({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center gap-1">
                      <Box className="w-3 h-3" /> 模型列表
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {editingProvider.models.map(model => (
                        <div key={model.id} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {model.name}
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="添加模型 ID"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                      />
                      <button
                        onClick={handleAddModel}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Provider Panel */}
              {showAddProvider && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">选择服务商</div>
                    <button onClick={() => setShowAddProvider(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_PROVIDERS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleAddPresetProvider(preset.id)}
                        className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition-colors"
                      >
                        <div className="font-medium text-white text-sm">{preset.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{preset.description}</div>
                      </button>
                    ))}
                    <button
                      onClick={handleAddCustomProvider}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-600 rounded-lg text-left transition-colors"
                    >
                      <div className="font-medium text-slate-400 text-sm flex items-center gap-1">
                        <Plus className="w-4 h-4" /> OpenAI 兼容
                      </div>
                      <div className="text-xs text-slate-500 mt-1">自定义 API 端点</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'learning' && (
            <div className="space-y-6">
              {/* Learning Granularity */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  学习链细度
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRANULARITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGranularity(option.value)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        granularity === option.value
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="font-bold text-sm">{option.label}</div>
                      <span className="text-xs opacity-70">{option.nodes}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {GRANULARITY_OPTIONS.find(o => o.value === granularity)?.desc}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
