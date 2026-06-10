import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptService } from '../prompt.service';
import type { Prompt } from '@/types';

// ── Mock promptRepo ────────────────────────────────────────────────────────────

vi.mock('@/db/repositories/prompt.repo', () => ({
  promptRepo: {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findBySlug: vi.fn(),
    slugExists: vi.fn().mockResolvedValue(false),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    incrementViewCount: vi.fn(),
    incrementForkCount: vi.fn(),
  },
}));

import { promptRepo } from '@/db/repositories/prompt.repo';

const mockSupabase = {} as Parameters<typeof promptService.createPrompt>[0];

const makePrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'p1',
  user_id: 'u1',
  title: 'Test',
  description: null,
  blocks: [],
  variables: [],
  content_md: '',
  tags: [],
  is_public: false,
  slug: null,
  fork_of: null,
  fork_count: 0,
  view_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(promptRepo.slugExists).mockResolvedValue(false);
});

describe('promptService.createPrompt', () => {
  it('calls repo.create with correct shape', async () => {
    vi.mocked(promptRepo.create).mockResolvedValue(makePrompt());

    await promptService.createPrompt(mockSupabase, 'u1', {
      title: 'My Prompt',
      blocks: [],
      variables: [],
      tags: ['ai'],
      is_public: false,
    });

    expect(promptRepo.create).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        user_id: 'u1',
        title: 'My Prompt',
        tags: ['ai'],
        is_public: false,
        slug: null,
      }),
    );
  });

  it('generates slug when is_public=true', async () => {
    vi.mocked(promptRepo.create).mockResolvedValue(makePrompt({ is_public: true, slug: 'test-abc123' }));

    await promptService.createPrompt(mockSupabase, 'u1', {
      title: 'Public Prompt',
      blocks: [],
      variables: [],
      tags: [],
      is_public: true,
    });

    const call = vi.mocked(promptRepo.create).mock.calls[0][1];
    expect(call.slug).toBeTruthy();
    expect(typeof call.slug).toBe('string');
  });

  it('retries slug generation if slug is taken', async () => {
    vi.mocked(promptRepo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.mocked(promptRepo.create).mockResolvedValue(makePrompt());

    await promptService.createPrompt(mockSupabase, 'u1', {
      title: 'Test',
      blocks: [],
      variables: [],
      tags: [],
      is_public: true,
    });

    expect(promptRepo.slugExists).toHaveBeenCalledTimes(2);
  });
});

describe('promptService.deletePrompt', () => {
  it('throws Forbidden if user is not owner', async () => {
    vi.mocked(promptRepo.findById).mockResolvedValue(makePrompt({ user_id: 'other-user' }));

    await expect(
      promptService.deletePrompt(mockSupabase, 'p1', 'attacker'),
    ).rejects.toThrow('Forbidden');
  });

  it('calls softDelete for owner', async () => {
    vi.mocked(promptRepo.findById).mockResolvedValue(makePrompt({ user_id: 'u1' }));
    vi.mocked(promptRepo.softDelete).mockResolvedValue();

    await promptService.deletePrompt(mockSupabase, 'p1', 'u1');
    expect(promptRepo.softDelete).toHaveBeenCalledWith(mockSupabase, 'p1');
  });
});

describe('promptService.forkPrompt', () => {
  it('creates forked prompt with " (fork)" title suffix', async () => {
    vi.mocked(promptRepo.findById).mockResolvedValue(makePrompt({ title: 'Original' }));
    vi.mocked(promptRepo.create).mockResolvedValue(makePrompt({ title: 'Original (fork)' }));

    await promptService.forkPrompt(mockSupabase, 'p1', 'u2');

    const call = vi.mocked(promptRepo.create).mock.calls[0][1];
    expect(call.title).toBe('Original (fork)');
    expect(call.fork_of).toBe('p1');
    expect(call.is_public).toBe(false);
  });

  it('increments fork_count on source fire-and-forget', async () => {
    vi.mocked(promptRepo.findById).mockResolvedValue(makePrompt({ id: 'p1' }));
    vi.mocked(promptRepo.create).mockResolvedValue(makePrompt());

    await promptService.forkPrompt(mockSupabase, 'p1', 'u2');
    expect(promptRepo.incrementForkCount).toHaveBeenCalledWith(mockSupabase, 'p1');
  });
});

describe('promptService.getPublicPrompt', () => {
  it('returns null for private prompts', async () => {
    vi.mocked(promptRepo.findBySlug).mockResolvedValue(makePrompt({ is_public: false }));
    const result = await promptService.getPublicPrompt(mockSupabase, 'some-slug');
    expect(result).toBeNull();
  });

  it('returns null when prompt not found', async () => {
    vi.mocked(promptRepo.findBySlug).mockResolvedValue(null);
    const result = await promptService.getPublicPrompt(mockSupabase, 'nonexistent');
    expect(result).toBeNull();
  });

  it('increments view_count for public prompts', async () => {
    vi.mocked(promptRepo.findBySlug).mockResolvedValue(makePrompt({ is_public: true }));

    await promptService.getPublicPrompt(mockSupabase, 'my-slug');
    expect(promptRepo.incrementViewCount).toHaveBeenCalledWith(mockSupabase, 'p1');
  });
});
