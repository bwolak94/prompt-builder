import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserPreferences } from '@/types';

interface PreferencesTabProps {
  preferences: UserPreferences;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ preferences }) => {
  const [defaultModel, setDefaultModel] = useState<UserPreferences['defaultModel']>(
    preferences.defaultModel,
  );
  const [language, setLanguage] = useState<UserPreferences['language']>(preferences.language);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { defaultModel, language } }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus('ok');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [defaultModel, language]);

  return (
    <div className="flex flex-col gap-6">
      {/* Default AI provider */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Domyślny provider AI</Label>
        <Select value={defaultModel} onValueChange={(v) => setDefaultModel(v as UserPreferences['defaultModel'])}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">GPT-4o mini (OpenAI)</SelectItem>
            <SelectItem value="anthropic">Claude Haiku (Anthropic)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-text-muted">Używany do oceniania promptów w builderze</p>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Język interfejsu</Label>
        <Select value={language} onValueChange={(v) => setLanguage(v as UserPreferences['language'])}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pl">Polski</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Zapisz preferencje
        </button>
        {saveStatus === 'ok' && <span className="text-xs text-emerald-400">Zapisano!</span>}
        {saveStatus === 'error' && <span className="text-xs text-red-400">Błąd zapisu</span>}
      </div>
    </div>
  );
};
