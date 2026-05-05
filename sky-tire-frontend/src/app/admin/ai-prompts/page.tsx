'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  RotateCcw, 
  ExternalLink, 
  X, 
  Loader2, 
  Cpu,
  MessageSquare,
  Sparkles,
  Zap,
  Bot,
  Monitor,
  Brain,
  Search
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const AI_TOOLS = [
  { key: 'chatgpt', name: 'ChatGPT', icon: MessageSquare, url: 'https://chatgpt.com/?prompt=' },
  { key: 'gemini', name: 'Gemini', icon: Sparkles, url: 'https://gemini.google.com/' },
  { key: 'claude', name: 'Claude', icon: Bot, url: 'https://claude.ai/' },
  { key: 'grok', name: 'Grok', icon: Zap, url: 'https://grok.com/' },
  { key: 'cursor', name: 'Cursor', icon: Monitor, url: 'https://cursor.sh/' },
  { key: 'deepseek', name: 'DeepSeek', icon: Brain, url: 'https://chat.deepseek.com/' },
  { key: 'perplexity', name: 'Perplexity', icon: Search, url: 'https://www.perplexity.ai/' },
];

export default function AIPromptsPage() {
  const [activeTool, setActiveTool] = useState(AI_TOOLS[0]);
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchPrompt = useCallback(async (aiKey: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/ai-prompts?aiKey=${aiKey}`);
      setPrompt(response.data.prompt);
      setOriginalPrompt(response.data.prompt);
      setDefaultPrompt(response.data.defaultPrompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      toast.error('Failed to load prompt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompt(activeTool.key);
  }, [activeTool, fetchPrompt]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/ai-prompts', {
        aiKey: activeTool.key,
        prompt: prompt,
      });
      setOriginalPrompt(prompt);
      toast.success('Prompt saved successfully');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPrompt(originalPrompt);
    toast.success('Changes discarded');
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = async () => {
    setIsResetModalOpen(false);
    setResetting(true);
    try {
      const response = await axios.post('/api/admin/ai-prompts/reset', {
        aiKey: activeTool.key,
      });
      setPrompt(response.data.prompt);
      setOriginalPrompt(response.data.prompt);
      toast.success('Prompt reset to default');
    } catch (error) {
      console.error('Error resetting prompt:', error);
      toast.error('Failed to reset prompt');
    } finally {
      setResetting(false);
    }
  };

  const handleTest = async () => {
  try {
    const encodedPrompt = encodeURIComponent(prompt);

    if (activeTool.key === 'chatgpt') {
      window.open(`${activeTool.url}${encodedPrompt}`, '_blank', 'noopener,noreferrer');
      toast.success('Opening ChatGPT with autofill...');
    } else {
      await navigator.clipboard.writeText(prompt);
      toast.success(`${activeTool.name} prompt copied! Now paste it.`);
      const baseUrl = activeTool.url.split('?')[0];      
      setTimeout(() => {
        window.open(baseUrl, '_blank', 'noopener,noreferrer');
      }, 1000);
    }
  } catch (err) {
    toast.error('Action failed');
    console.error('Test error:', err);
  }
};

  const hasChanges = prompt !== originalPrompt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B5998] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Cpu className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">AI Prompts Management</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool.key === tool.key;
            return (
              <button
                key={tool.key}
                onClick={() => setActiveTool(tool)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#3B5998] text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {tool.name}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-[22px] font-bold text-[#1e2a4a]">{activeTool.name} Prompt</h2>
                <p className="text-sm sm:text-[16px] text-gray-400 mt-0.5">Customize how {activeTool.name} behaves for this platform.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={handleTest}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-[#1e2a4a] rounded-xl text-sm sm:text-[16px] font-bold hover:bg-gray-100 transition-all border border-gray-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Test Prompt
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting || loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-[#FF5A5F] rounded-xl text-sm sm:text-[16px] font-bold hover:bg-red-100 transition-all border border-red-50 disabled:opacity-50"
                >
                  {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Reset to Default
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Loading prompt configuration...</p>
                </div>
              ) : (
                <>
                  <div className="relative" key={activeTool.key}>
                    <textarea
                      value={prompt}
                      maxLength={5000}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-96 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[16px] font-medium focus:ring-2 focus:ring-[#3B5998]/5 focus:border-[#3B5998] transition-all resize-none leading-relaxed text-[#1e2a4a]"
                      placeholder={`Enter your prompt for ${activeTool.name}...`}
                    />
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 text-[11px] font-bold text-gray-400">
                      {prompt.length}/ 5000 characters
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
                    <button
                      onClick={handleDiscard}
                      disabled={!hasChanges || saving}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm sm:text-[16px] font-bold transition-all disabled:opacity-30 ${
                        hasChanges 
                          ? 'bg-violet-500 text-white hover:bg-green-600 shadow-lg shadow-green-100'
                          : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <X className="h-4 w-4" />
                      Discard Changes
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges || saving}
                      className="flex items-center justify-center gap-2 px-8 py-3 bg-[#3B5998] text-white rounded-xl text-sm sm:text-[16px] font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={isResetModalOpen}
        title="Reset to Default"
        message={`Are you sure you want to reset the ${activeTool.name} prompt to its default version? This action cannot be undone.`}
        onConfirm={confirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
