interface Props {
  password: string;
}

interface StrengthLevel {
  label: string;
  score: number; // 0–4
  color: string;
}

function getStrength(password: string): StrengthLevel {
  if (!password) return { label: '', score: 0, color: 'bg-border' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: StrengthLevel[] = [
    { label: 'Zbyt słabe', score: 1, color: 'bg-error' },
    { label: 'Słabe', score: 2, color: 'bg-warning' },
    { label: 'Dobre', score: 3, color: 'bg-score-good' },
    { label: 'Silne', score: 4, color: 'bg-success' },
  ];

  return levels[Math.min(score, 4) - 1] ?? { label: 'Zbyt słabe', score: 1, color: 'bg-error' };
}

export function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null;

  const { label, score, color } = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite" aria-atomic="true">
      {/* 4-segment bar */}
      <div className="flex gap-1" role="img" aria-label={`Siła hasła: ${label}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? color : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
