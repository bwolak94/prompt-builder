/**
 * Domain types — application-level shapes that are NOT auto-generated.
 *
 * These wrap or refine the raw database types from src/db/types.ts:
 *  - JSONB columns come back as `Json` from Supabase; we cast them here
 *    to strongly-typed interfaces so the rest of the app is fully typed.
 *  - DTOs (request/response shapes for API routes) live here too.
 *
 * Import the generated Row aliases from src/db/types.ts for table rows.
 */

import type { Json } from '@/db/types';

// ── Builder block ─────────────────────────────────────────────────────────────

/**
 * One section block inside the visual prompt builder.
 * Stored as JSONB in prompts.blocks and system_templates.blocks.
 */
export interface PromptBlock {
  /** Stable client-side UUID — used as React key and for reordering */
  id: string;
  /** References prompt_sections.slug — "role" | "context" | "task" | … */
  section_slug: string;
  /** User-written content for this section */
  content: string;
  /** Zero-based display order within the prompt */
  order_index: number;
}

// ── Variable ──────────────────────────────────────────────────────────────────

/** Variable type determines which input control is rendered */
export type VariableType = 'text' | 'textarea' | 'select' | 'number';

/**
 * A {{variable_name}} placeholder declared in a prompt.
 * Stored as JSONB in prompts.variables and system_templates.variables.
 */
export interface PromptVariable {
  /** Matches the placeholder token: {{name}} */
  name: string;
  /** Human-readable label shown in the variable form */
  label: string;
  /** Pre-filled value in the form */
  defaultValue: string;
  type: VariableType;
  /** Only used when type === "select" */
  options?: string[];
}

// ── AI Scoring ────────────────────────────────────────────────────────────────

/** Individual dimension score + explanation */
export interface DimensionScore {
  /** 0–100 */
  score: number;
  /** One-sentence explanation */
  comment: string;
  /** Actionable suggestions to improve this dimension */
  suggestions: string[];
}

/** Raw per-dimension scores stored in prompt_ratings.scores (JSONB) */
export interface AIScores {
  clarity: number;
  specificity: number;
  structure: number;
  tone: number;
  completeness: number;
}

/** Rich per-dimension feedback stored in prompt_ratings.feedback (JSONB) */
export interface AIScoreFeedback {
  clarity: DimensionScore;
  specificity: DimensionScore;
  structure: DimensionScore;
  tone: DimensionScore;
  completeness: DimensionScore;
}

/**
 * Full AI scoring result — the shape returned by POST /api/score
 * and stored in the prompt_ratings table.
 */
export interface ScoreResult {
  overall_score: number;
  scores: AIScores;
  feedback: AIScoreFeedback;
  model_used: string;
  provider: 'openai' | 'anthropic';
}

// ── User preferences ──────────────────────────────────────────────────────────

/** Stored as JSONB in profiles.preferences */
export interface UserPreferences {
  defaultModel: 'openai' | 'anthropic';
  language: 'pl' | 'en';
}

// ── Section category / difficulty enums ───────────────────────────────────────

export type SectionCategory = 'core' | 'optional' | 'advanced';
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TemplateCategory = 'coding' | 'writing' | 'analysis' | 'roleplay';
export type AIProvider = 'openai' | 'anthropic';

// ── JSONB cast helpers ────────────────────────────────────────────────────────
// Use these when reading JSONB columns from Supabase query results.
// The generated types return `Json` — these narrow them to our domain types.

export function castBlocks(raw: Json): PromptBlock[] {
  return (raw as unknown as PromptBlock[]) ?? [];
}

export function castVariables(raw: Json): PromptVariable[] {
  return (raw as unknown as PromptVariable[]) ?? [];
}

export function castScores(raw: Json): AIScores {
  return raw as unknown as AIScores;
}

export function castFeedback(raw: Json): AIScoreFeedback {
  return raw as unknown as AIScoreFeedback;
}

export function castPreferences(raw: Json): UserPreferences {
  return (raw as unknown as UserPreferences) ?? { defaultModel: 'openai', language: 'pl' };
}

// ── Generic API response wrapper ──────────────────────────────────────────────

/**
 * Standard envelope for all JSON API responses.
 * Success: `{ data: T }` — Error: `{ error: string; code?: string }`
 */
export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: string; code?: string; data?: never };

// ── API DTOs ──────────────────────────────────────────────────────────────────

/** POST /api/prompts — create prompt */
export interface CreatePromptDto {
  title: string;
  description?: string;
  blocks: PromptBlock[];
  variables: PromptVariable[];
  tags: string[];
  is_public: boolean;
  slug?: string;
}

/** PATCH /api/prompts/[id] — update prompt */
export interface UpdatePromptDto extends Partial<CreatePromptDto> {
  content_md?: string;
}

/** POST /api/score — request AI scoring */
export interface ScoreRequestDto {
  prompt_id: string;
  content: string;
}

/** Response from POST /api/score */
export interface ScoreResponseDto {
  rating_id: string;
  result: ScoreResult;
}
