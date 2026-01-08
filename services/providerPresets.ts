import { PresetProviderId, PresetProvider, ProviderConfig } from '../types';

// 预设服务商列表
export const PRESET_PROVIDERS: PresetProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    description: 'GPT-5 系列，400K 上下文',
    website: 'https://platform.openai.com/',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModels: [
      { id: 'gpt-5.2', name: 'GPT-5.2 (最新旗舰)', isDefault: true },
      { id: 'gpt-5.1', name: 'GPT-5.1 (次旗舰)' },
      { id: 'gpt-5', name: 'GPT-5 (基础旗舰)' },
      { id: 'gpt-5-pro', name: 'GPT-5 Pro (专业级)' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini (高效版)' },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano (最快最便宜)' },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    description: 'DeepSeek-V3，高性价比国产模型',
    website: 'https://platform.deepseek.com/',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    defaultModels: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3 非思考)', isDefault: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (V3 思考)' },
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    description: 'Kimi K2 系列模型，支持 256K 上下文',
    website: 'https://platform.moonshot.cn/',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    defaultModels: [
      { id: 'kimi-k2-0905-preview', name: 'Kimi K2 (256K)', isDefault: true },
      { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo (极速版)' },
      { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking (思考模型)' },
      { id: 'kimi-k2-thinking-turbo', name: 'Kimi K2 Thinking Turbo (极速思考)' },
    ]
  },
];

// 创建预设服务商配置
export function createDefaultProviderConfig(presetId: PresetProviderId): ProviderConfig | null {
  const preset = PRESET_PROVIDERS.find(p => p.id === presetId);
  if (!preset) return null;

  return {
    id: `${presetId}-${Date.now()}`,
    name: preset.name,
    baseUrl: preset.baseUrl,
    apiKey: '',
    models: [...preset.defaultModels],
    enabled: false,
    isPreset: true,
    presetId: preset.id,
  };
}

// 创建自定义服务商配置（OpenAI 兼容）
export function createCustomProviderConfig(name: string, baseUrl: string): ProviderConfig {
  return {
    id: `custom-${Date.now()}`,
    name: name || '自定义服务商',
    baseUrl: baseUrl || 'https://api.example.com/v1',
    apiKey: '',
    models: [{ id: 'default', name: '默认模型', isDefault: true }],
    enabled: false,
    isPreset: false,
    presetId: 'custom',
  };
}

// 获取默认服务商列表（空，用户需要自己添加）
export function getDefaultProviders(): ProviderConfig[] {
  return [];
}
