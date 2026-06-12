import React, { lazy, Suspense } from 'react';
import type { AIScores } from '@/types';

interface OverlayData {
  scoresA: AIScores;
  scoresB: AIScores;
}

const LazyOverlay = lazy(() =>
  import('recharts').then((mod) => ({
    default: function RadarOverlayWrapper({ scoresA, scoresB }: OverlayData) {
      const { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } = mod;

      const data = [
        { subject: 'Clarity', a: scoresA.clarity, b: scoresB.clarity },
        { subject: 'Specificity', a: scoresA.specificity, b: scoresB.specificity },
        { subject: 'Structure', a: scoresA.structure, b: scoresB.structure },
        { subject: 'Tone', a: scoresA.tone, b: scoresB.tone },
        { subject: 'Completeness', a: scoresA.completeness, b: scoresB.completeness },
      ];

      return (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#71717a', fontSize: 10 }}
            />
            <Radar
              name="A"
              dataKey="a"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="B"
              dataKey="b"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => `Variant ${value as string}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fafafa',
              }}
              formatter={(v: unknown, name: unknown) => [
                `${v as number}/100`,
                `Variant ${name as string}`,
              ] as [string, string]}
            />
          </RadarChart>
        </ResponsiveContainer>
      );
    },
  })),
);

interface ScoreRadarChartOverlayProps {
  scoresA: AIScores;
  scoresB: AIScores;
}

export const ScoreRadarChartOverlay: React.FC<ScoreRadarChartOverlayProps> = ({
  scoresA,
  scoresB,
}) => (
  <Suspense
    fallback={<div className="h-[260px] w-full animate-pulse rounded-lg bg-surface-raised" />}
  >
    <LazyOverlay scoresA={scoresA} scoresB={scoresB} />
  </Suspense>
);
