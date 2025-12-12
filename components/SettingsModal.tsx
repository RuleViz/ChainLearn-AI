import React from 'react';
import { AIConfig } from '../types';
import { X, Save, Key, Globe, Box, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = React.useState<AIConfig>(config);

  React.useEffect(() => {
    if (isOpen) {
      setFormData(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleChange = (field: keyof AIConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            AI Provider Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Select Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChange('provider', 'GEMINI')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  formData.provider === 'GEMINI'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-bold">Google Gemini</div>
                <span className="text-xs opacity-70">Built-in (Free)</span>
              </button>
              <button
                onClick={() => handleChange('provider', 'OPENAI')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  formData.provider === 'OPENAI'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-bold">Custom / OpenAI</div>
                <span className="text-xs opacity-70">BYO Key</span>
              </button>
            </div>
          </div>

          {formData.provider === 'OPENAI' && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Base URL
                </label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-700"
                />
                <p className="text-xs text-slate-600">Enter the full root URL (usually ends in /v1)</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4" /> API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4" /> Model Name
                </label>
                <input
                  type="text"
                  value={formData.modelId}
                  onChange={(e) => handleChange('modelId', e.target.value)}
                  placeholder="gpt-4o, deepseek-chat, etc."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-700"
                />
              </div>
            </div>
          )}

          {formData.provider === 'GEMINI' && (
             <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-800 text-sm text-slate-400">
                Using built-in Google Gemini API key. No configuration needed.
             </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
