import { useState, useCallback } from 'react';

interface RatingStats {
  avg_rating: number | null;
  rating_count: number;
  user_rating: number | null;
}

interface UseStarRatingReturn {
  stats: RatingStats;
  submitting: boolean;
  rate: (value: number) => Promise<void>;
  removeRating: () => Promise<void>;
}

export function useStarRating(promptId: string, initial: RatingStats): UseStarRatingReturn {
  const [stats, setStats] = useState<RatingStats>(initial);
  const [submitting, setSubmitting] = useState(false);

  const rate = useCallback(async (value: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });
      if (!res.ok) return;
      // Refresh stats
      const statsRes = await fetch(`/api/prompts/${promptId}/ratings`);
      if (statsRes.ok) {
        const { data } = (await statsRes.json()) as { data: RatingStats };
        setStats(data);
      }
    } finally {
      setSubmitting(false);
    }
  }, [promptId]);

  const removeRating = useCallback(async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/prompts/${promptId}/ratings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const statsRes = await fetch(`/api/prompts/${promptId}/ratings`);
      if (statsRes.ok) {
        const { data } = (await statsRes.json()) as { data: RatingStats };
        setStats(data);
      }
    } finally {
      setSubmitting(false);
    }
  }, [promptId]);

  return { stats, submitting, rate, removeRating };
}
