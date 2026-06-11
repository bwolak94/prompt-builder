import React, { lazy, Suspense } from 'react';
import type { AIScores } from '@/types';

const LazyChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function RadarChartWrapper({ scores }: { scores: AIScores }) {
      const { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } = mod;

      const data = [
        { subject: 'Klarowność', value: scores.clarity },
        { subject: 'Szczegółowość', value: scores.specificity },
        { subject: 'Struktura', value: scores.structure },
        { subject: 'Ton', value: scores.tone },
        { subject: 'Kompletność', value: scores.completeness },
      ];

      return (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#71717a', fontSize: 10 }}
            />
            <Radar
              name="Ocena"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fafafa',
              }}
              formatter={(v: unknown) => [`${v}/100`, 'Wynik'] as [string, string]}
            />
          </RadarChart>
        </ResponsiveContainer>
      );
    },
  })),
);

interface ScoreRadarChartProps {
  scores: AIScores;
}

export const ScoreRadarChart: React.FC<ScoreRadarChartProps> = ({ scores }) => (
  <Suspense
    fallback={
      <div className="h-[220px] w-full animate-pulse rounded-lg bg-surface-raised" />
    }
  >
    <LazyChart scores={scores} />
  </Suspense>
);
