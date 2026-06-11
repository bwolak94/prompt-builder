import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock scoring provider ──────────────────────────────────────────────────────

const VALID_JSON =
  '{"overall":80,"dimensions":{"clarity":{"score":80,"comment":"ok","suggestions":[]},' +
  '"specificity":{"score":80,"comment":"ok","suggestions":[]},' +
  '"structure":{"score":80,"comment":"ok","suggestions":[]},' +
  '"tone":{"score":80,"comment":"ok","suggestions":[]},' +
  '"completeness":{"score":80,"comment":"ok","suggestions":[]}}}';

vi.mock('@/lib/ai/scoring.provider', () => {
  const z = require('zod');
  const DimSchema = z.object({
    score: z.number().min(0).max(100),
    comment: z.string(),
    suggestions: z.array(z.string()),
  });
  const ScoreResponseSchema = z.object({
    overall: z.number().min(0).max(100),
    dimensions: z.object({
      clarity: DimSchema,
      specificity: DimSchema,
      structure: DimSchema,
      tone: DimSchema,
      completeness: DimSchema,
    }),
  });
  return {
    getScoringProvider: vi.fn().mockResolvedValue({
      name: 'openai',
      score: async function* () { yield VALID_JSON; },
    }),
    ScoreResponseSchema,
  };
});

// ── Mock ratingRepo ────────────────────────────────────────────────────────────

vi.mock('@/db/repositories/rating.repo', () => ({
  ratingRepo: {
    create: vi.fn(),
  },
}));

import { aiScoreService } from '../ai-score.service';
import { ratingRepo } from '@/db/repositories/rating.repo';
import type { PromptRatingRow } from '@/db/repositories/rating.repo';

const mockRatingRow: PromptRatingRow = {
  id: 'r1',
  prompt_id: 'p1',
  overall_score: 80,
  scores: { clarity: 80, specificity: 80, structure: 80, tone: 80, completeness: 80 },
  feedback: {
    clarity: { score: 80, comment: 'ok', suggestions: [] },
    specificity: { score: 80, comment: 'ok', suggestions: [] },
    structure: { score: 80, comment: 'ok', suggestions: [] },
    tone: { score: 80, comment: 'ok', suggestions: [] },
    completeness: { score: 80, comment: 'ok', suggestions: [] },
  },
  model_used: 'gpt-4o-mini',
  provider: 'openai',
  created_at: '2025-01-01T00:00:00Z',
};

const mockSupabase = {} as Parameters<typeof aiScoreService.parseAndSave>[0];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('aiScoreService.getStream', () => {
  it('returns an async iterable', () => {
    const stream = aiScoreService.getStream('test content', 'openai');
    expect(stream[Symbol.asyncIterator]).toBeDefined();
  });

  it('yields chunks from the provider', async () => {
    const stream = aiScoreService.getStream('test content', 'openai');
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toBe(VALID_JSON);
  });

  it('works with anthropic provider', async () => {
    const stream = aiScoreService.getStream('test content', 'anthropic');
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe(VALID_JSON);
  });
});

describe('aiScoreService.parseAndSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ratingRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockRatingRow);
  });

  it('parses valid JSON and saves rating', async () => {
    const result = await aiScoreService.parseAndSave(mockSupabase, 'p1', VALID_JSON, 'openai');
    expect(result.overall_score).toBe(80);
    expect(result.provider).toBe('openai');
  });

  it('calls ratingRepo.create with correct modelUsed for openai', async () => {
    await aiScoreService.parseAndSave(mockSupabase, 'p1', VALID_JSON, 'openai');
    expect(ratingRepo.create).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ modelUsed: 'gpt-4o-mini', provider: 'openai' }),
    );
  });

  it('calls ratingRepo.create with correct modelUsed for anthropic', async () => {
    (ratingRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockRatingRow,
      provider: 'anthropic',
      model_used: 'claude-haiku-4-5-20251001',
    });
    await aiScoreService.parseAndSave(mockSupabase, 'p1', VALID_JSON, 'anthropic');
    expect(ratingRepo.create).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ modelUsed: 'claude-haiku-4-5-20251001', provider: 'anthropic' }),
    );
  });

  it('throws on invalid JSON', async () => {
    await expect(
      aiScoreService.parseAndSave(mockSupabase, 'p1', 'not-json', 'openai'),
    ).rejects.toThrow();
  });

  it('maps dimension scores correctly', async () => {
    await aiScoreService.parseAndSave(mockSupabase, 'p1', VALID_JSON, 'openai');
    expect(ratingRepo.create).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        scores: { clarity: 80, specificity: 80, structure: 80, tone: 80, completeness: 80 },
      }),
    );
  });

  it('returns the saved PromptRatingRow', async () => {
    const result = await aiScoreService.parseAndSave(mockSupabase, 'p1', VALID_JSON, 'openai');
    expect(result.id).toBe('r1');
    expect(result.prompt_id).toBe('p1');
  });
});
