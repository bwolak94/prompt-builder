import React from 'react';

interface ScoreRingProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-lime-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function strokeColor(score: number): string {
  if (score >= 80) return '#34d399'; // emerald-400
  if (score >= 60) return '#a3e635'; // lime-400
  if (score >= 40) return '#fbbf24'; // amber-400
  return '#f87171';                  // red-400
}

export const ScoreRingProgress: React.FC<ScoreRingProgressProps> = ({
  score,
  size = 96,
  strokeWidth = 8,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-raised"
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={strokeColor(score)}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      {/* Score number in center — overlay with absolute positioning */}
      <div
        className={`-mt-[${size / 2 + 8}px] text-xl font-bold ${scoreColor(score)}`}
        style={{ marginTop: -(size / 2 + 8) }}
        aria-label={`Wynik: ${Math.round(score)}`}
      >
        {Math.round(score)}
      </div>
      {label && <p className="text-xs text-text-muted">{label}</p>}
    </div>
  );
};
