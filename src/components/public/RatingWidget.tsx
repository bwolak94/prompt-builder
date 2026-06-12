/**
 * RatingWidget — F-05
 * Star rating display and interaction for public prompt pages.
 * Renders as a React island (client:load).
 */

import React, { useState } from 'react';
import { useStarRating } from './hooks/useStarRating';

interface RatingWidgetProps {
  promptId: string;
  initialAvg: number | null;
  initialCount: number;
  initialUserRating: number | null;
  isLoggedIn: boolean;
}

export const RatingWidget: React.FC<RatingWidgetProps> = ({
  promptId,
  initialAvg,
  initialCount,
  initialUserRating,
  isLoggedIn,
}) => {
  const { stats, submitting, rate, removeRating } = useStarRating(promptId, {
    avg_rating: initialAvg,
    rating_count: initialCount,
    user_rating: initialUserRating,
  });

  const [hovered, setHovered] = useState<number | null>(null);

  const displayValue = hovered ?? stats.user_rating ?? 0;

  const handleClick = async (value: number) => {
    if (!isLoggedIn || submitting) return;
    if (stats.user_rating === value) {
      await removeRating();
    } else {
      await rate(value);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Average */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-text-primary">
          {stats.avg_rating !== null ? stats.avg_rating.toFixed(1) : '—'}
        </span>
        <StarDisplay value={stats.avg_rating ?? 0} />
        <span className="text-xs text-text-muted">({stats.rating_count})</span>
      </div>

      {/* Interactive stars */}
      {isLoggedIn ? (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-text-muted">
            {stats.user_rating ? `Twoja ocena: ${stats.user_rating}★` : 'Oceń ten prompt:'}
          </p>
          <div
            className="flex gap-0.5"
            onMouseLeave={() => setHovered(null)}
            role="radiogroup"
            aria-label="Ocena"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={submitting}
                role="radio"
                aria-checked={stats.user_rating === star}
                aria-label={`${star} gwiazdek`}
                className="text-xl transition-transform hover:scale-110 disabled:opacity-50"
                onMouseEnter={() => setHovered(star)}
                onClick={() => void handleClick(star)}
              >
                <span className={star <= displayValue ? 'text-amber-400' : 'text-text-muted/30'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-text-muted">
          <a href="/login" className="text-brand-400 hover:underline">Zaloguj się</a>{' '}
          aby ocenić
        </p>
      )}
    </div>
  );
};

// ── Static star display ───────────────────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5 text-sm" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(value) ? 'text-amber-400' : 'text-text-muted/30'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default RatingWidget;
