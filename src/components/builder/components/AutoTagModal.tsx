import React, { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES } from '@/lib/services/auto-categorize.service';
import type { PromptSuggestion } from '@/lib/services/auto-categorize.service';
import type { Lang } from '@/lib/i18n';

interface AutoTagModalProps {
  open: boolean;
  suggestion: PromptSuggestion;
  promptId: string;
  lang: Lang;
  onApply: (promptId: string, data: PromptSuggestion) => Promise<void>;
  onClose: () => void;
}

export const AutoTagModal: React.FC<AutoTagModalProps> = ({
  open,
  suggestion,
  promptId,
  lang,
  onApply,
  onClose,
}) => {
  const [category, setCategory] = useState(suggestion.category);
  const [difficulty, setDifficulty] = useState(suggestion.difficulty);
  const [tags, setTags] = useState<string[]>(suggestion.tags);
  const [tagInput, setTagInput] = useState('');
  const [applying, setApplying] = useState(false);
  const tagInputId = useId();

  const isPl = lang === 'pl';

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleApply = async () => {
    setApplying(true);
    await onApply(promptId, { category, difficulty, tags });
    setApplying(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isPl ? 'Edytuj sugestie AI' : 'Edit AI suggestions'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>{isPl ? 'Kategoria' : 'Category'}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-1.5">
            <Label>{isPl ? 'Poziom' : 'Difficulty'}</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as typeof difficulty)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={tagInputId}>
              {isPl ? 'Tagi' : 'Tags'} ({tags.length}/5)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-brand-900"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <Input
                id={tagInputId}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={isPl ? 'Dodaj tag i naciśnij Enter…' : 'Add tag and press Enter…'}
                className="mt-1"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={applying}>
            {isPl ? 'Anuluj' : 'Cancel'}
          </Button>
          <Button onClick={handleApply} disabled={applying || tags.length === 0}>
            {applying
              ? isPl ? 'Zapisywanie…' : 'Saving…'
              : isPl ? 'Zastosuj' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
