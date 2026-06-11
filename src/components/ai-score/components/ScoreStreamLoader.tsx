import React from 'react';

export const ScoreStreamLoader: React.FC = () => (
  <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label="Trwa ocenianie promptu…">
    {/* Ring skeleton */}
    <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-surface-raised" />
    {/* Label */}
    <div className="mx-auto h-3 w-32 animate-pulse rounded bg-surface-raised" />
    {/* 5 dimension rows */}
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
        <div className="h-2 flex-1 animate-pulse rounded-full bg-surface-raised" />
        <div className="h-3 w-8 animate-pulse rounded bg-surface-raised" />
      </div>
    ))}
  </div>
);
