import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { SmartVariable } from '@/lib/variables/parser';

interface FieldProps {
  variable: SmartVariable;
  value: string;
  onChange: (value: string) => void;
}

export const SmartVariableField: React.FC<FieldProps> = ({ variable, value, onChange }) => {
  const id = useId();
  const resolved = value !== '' ? value : variable.defaultValue;

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <Label htmlFor={id} className="text-xs font-medium text-text-secondary">
        {variable.label}
      </Label>
      <FieldInput id={id} variable={variable} value={resolved} onChange={onChange} />
    </div>
  );
};

// ── Per-type inputs ───────────────────────────────────────────────────────────

interface InputProps {
  id: string;
  variable: SmartVariable;
  value: string;
  onChange: (value: string) => void;
}

const FieldInput: React.FC<InputProps> = ({ id, variable, value, onChange }) => {
  switch (variable.type) {
    case 'select':
      return (
        <Select value={(value || variable.options?.[0]) ?? ''} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-8 text-xs">
            <SelectValue placeholder={variable.label} />
          </SelectTrigger>
          <SelectContent>
            {(variable.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'number': {
      const numValue = parseFloat(value);
      const safeValue = isNaN(numValue) ? (variable.min ?? 0) : numValue;
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>{variable.min ?? 0}</span>
            <span className="font-semibold text-text-primary">{safeValue}</span>
            <span>{variable.max ?? 100}</span>
          </div>
          <Slider
            id={id}
            min={variable.min ?? 0}
            max={variable.max ?? 100}
            step={variable.step ?? 1}
            value={[safeValue]}
            onValueChange={([v]) => onChange(String(v))}
            className="w-full"
          />
        </div>
      );
    }

    case 'multiline':
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={variable.label}
          rows={3}
          className="min-h-0 resize-y text-xs"
        />
      );

    case 'boolean': {
      const checked = value === 'true';
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={id}
            checked={checked}
            onCheckedChange={(v) => onChange(String(v))}
          />
          <Label htmlFor={id} className="cursor-pointer text-xs text-text-muted">
            {checked ? 'On' : 'Off'}
          </Label>
        </div>
      );
    }

    default:
      return (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={variable.label}
          className="h-8 text-xs"
        />
      );
  }
};
