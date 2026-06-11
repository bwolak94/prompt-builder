import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreResponseSchema } from '../scoring.provider';

// ── ScoreResponseSchema validation ────────────────────────────────────────────

const validResponse = {
  overall: 75,
  dimensions: {
    clarity:      { score: 80, comment: 'Clear instructions.', suggestions: ['Be more specific.'] },
    specificity:  { score: 70, comment: 'Moderately specific.', suggestions: ['Add examples.'] },
    structure:    { score: 75, comment: 'Well structured.', suggestions: ['Add headers.'] },
    tone:         { score: 78, comment: 'Professional tone.', suggestions: [] },
    completeness: { score: 72, comment: 'Mostly complete.', suggestions: ['Add context.'] },
  },
};

describe('ScoreResponseSchema', () => {
  it('parses a valid response', () => {
    const result = ScoreResponseSchema.parse(validResponse);
    expect(result.overall).toBe(75);
    expect(result.dimensions.clarity.score).toBe(80);
  });

  it('rejects overall score outside 0–100', () => {
    expect(() => ScoreResponseSchema.parse({ ...validResponse, overall: 101 })).toThrow();
    expect(() => ScoreResponseSchema.parse({ ...validResponse, overall: -1 })).toThrow();
  });

  it('rejects dimension score outside 0–100', () => {
    const bad = JSON.parse(JSON.stringify(validResponse));
    bad.dimensions.clarity.score = 150;
    expect(() => ScoreResponseSchema.parse(bad)).toThrow();
  });

  it('rejects missing dimension', () => {
    const bad = JSON.parse(JSON.stringify(validResponse));
    delete bad.dimensions.tone;
    expect(() => ScoreResponseSchema.parse(bad)).toThrow();
  });

  it('requires suggestions to be an array', () => {
    const bad = JSON.parse(JSON.stringify(validResponse));
    bad.dimensions.clarity.suggestions = 'not an array';
    expect(() => ScoreResponseSchema.parse(bad)).toThrow();
  });

  it('requires comment to be a string', () => {
    const bad = JSON.parse(JSON.stringify(validResponse));
    bad.dimensions.clarity.comment = 42;
    expect(() => ScoreResponseSchema.parse(bad)).toThrow();
  });
});

// ── Provider mocking ──────────────────────────────────────────────────────────

vi.mock('../providers/openai.provider', () => ({
  OpenAIScoringProvider: class {
    readonly name = 'openai';
    async *score(_content: string) {
      yield '{"overall":80,"dimensions":{"clarity":{"score":80,"comment":"ok","suggestions":[]},"specificity":{"score":80,"comment":"ok","suggestions":[]},"structure":{"score":80,"comment":"ok","suggestions":[]},"tone":{"score":80,"comment":"ok","suggestions":[]},"completeness":{"score":80,"comment":"ok","suggestions":[]}}}';
    }
  },
}));

vi.mock('../providers/anthropic.provider', () => ({
  AnthropicScoringProvider: class {
    readonly name = 'anthropic';
    async *score(_content: string) {
      yield '{"overall":70,"dimensions":{"clarity":{"score":70,"comment":"ok","suggestions":[]},"specificity":{"score":70,"comment":"ok","suggestions":[]},"structure":{"score":70,"comment":"ok","suggestions":[]},"tone":{"score":70,"comment":"ok","suggestions":[]},"completeness":{"score":70,"comment":"ok","suggestions":[]}}}';
    }
  },
}));

import { getScoringProvider } from '../scoring.provider';

describe('getScoringProvider', () => {
  it('returns openai provider by default', async () => {
    const p = await getScoringProvider('openai');
    expect(p.name).toBe('openai');
  });

  it('returns anthropic provider when specified', async () => {
    const p = await getScoringProvider('anthropic');
    expect(p.name).toBe('anthropic');
  });

  it('openai provider streams content', async () => {
    const p = await getScoringProvider('openai');
    const chunks: string[] = [];
    for await (const chunk of p.score('test prompt')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    const full = chunks.join('');
    const parsed = JSON.parse(full);
    expect(parsed.overall).toBe(80);
  });

  it('anthropic provider streams content', async () => {
    const p = await getScoringProvider('anthropic');
    const chunks: string[] = [];
    for await (const chunk of p.score('test prompt')) {
      chunks.push(chunk);
    }
    const full = chunks.join('');
    const parsed = JSON.parse(full);
    expect(parsed.overall).toBe(70);
  });
});
