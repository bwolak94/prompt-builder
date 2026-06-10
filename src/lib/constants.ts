/**
 * Section color map — each builder section has a unique colour for
 * immediate visual identification.
 *
 * Values are Tailwind utility class fragments applied to the block header:
 *   bg:     light tinted background
 *   border: matching border (lower opacity)
 *   text:   icon / label colour
 *   icon:   Lucide icon name (string union matches lucide-react exports)
 */

export interface SectionColorConfig {
  /** bg-* class for the block header background */
  readonly bg: string;
  /** border-* class for the block header bottom border */
  readonly border: string;
  /** text-* class for the section icon and label */
  readonly text: string;
  /** Lucide icon name */
  readonly icon: string;
}

export const SECTION_COLORS: Readonly<Record<string, SectionColorConfig>> = {
  role: {
    bg: 'bg-violet-600/10',
    border: 'border-violet-600/20',
    text: 'text-violet-400',
    icon: 'User',
  },
  context: {
    bg: 'bg-blue-600/10',
    border: 'border-blue-600/20',
    text: 'text-blue-400',
    icon: 'BookOpen',
  },
  task: {
    bg: 'bg-emerald-600/10',
    border: 'border-emerald-600/20',
    text: 'text-emerald-400',
    icon: 'Target',
  },
  format: {
    bg: 'bg-amber-600/10',
    border: 'border-amber-600/20',
    text: 'text-amber-400',
    icon: 'Layout',
  },
  constraints: {
    bg: 'bg-red-600/10',
    border: 'border-red-600/20',
    text: 'text-red-400',
    icon: 'ShieldOff',
  },
  examples: {
    bg: 'bg-cyan-600/10',
    border: 'border-cyan-600/20',
    text: 'text-cyan-400',
    icon: 'Lightbulb',
  },
  tone: {
    bg: 'bg-purple-600/10',
    border: 'border-purple-600/20',
    text: 'text-purple-400',
    icon: 'MessageSquare',
  },
  audience: {
    bg: 'bg-lime-600/10',
    border: 'border-lime-600/20',
    text: 'text-lime-400',
    icon: 'Users',
  },
  chain_of_thought: {
    bg: 'bg-fuchsia-600/10',
    border: 'border-fuchsia-600/20',
    text: 'text-fuchsia-400',
    icon: 'GitBranch',
  },
  output_schema: {
    bg: 'bg-zinc-600/10',
    border: 'border-zinc-600/20',
    text: 'text-zinc-400',
    icon: 'Code2',
  },
} as const;

/** Section slugs in the order they appear in the builder palette. */
export const SECTION_SLUGS = Object.keys(SECTION_COLORS) as Array<keyof typeof SECTION_COLORS>;

/**
 * Safely retrieve section colors, falling back to a neutral config
 * for unknown slugs (e.g. future custom sections).
 */
export function getSectionColors(slug: string): SectionColorConfig {
  return (
    SECTION_COLORS[slug] ?? {
      bg: 'bg-zinc-600/10',
      border: 'border-zinc-600/20',
      text: 'text-zinc-400',
      icon: 'Square',
    }
  );
}

// ── AI Score thresholds ─────────────────────────────────────────
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
} as const;

export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.fair) return 'fair';
  return 'poor';
}

export const SCORE_COLORS: Readonly<Record<ScoreLevel, string>> = {
  excellent: 'text-score-excellent',
  good: 'text-score-good',
  fair: 'text-score-fair',
  poor: 'text-score-poor',
} as const;

// ── Variable detection ──────────────────────────────────────────
/** Regex for detecting {{variable_name}} placeholders in prompt content. */
export const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

// ── Rate limiting ───────────────────────────────────────────────
export const AI_SCORE_RATE_LIMIT = 10; // requests per window
export const AI_SCORE_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
