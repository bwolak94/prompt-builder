import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCollectionTree, generateUniqueSlug, assertOwner } from '../collection.service';
import type { CollectionWithCount } from '@/db/repositories/collection.repo';

// ── Mock collectionRepo ───────────────────────────────────────────────────────

vi.mock('@/db/repositories/collection.repo', () => ({
  collectionRepo: {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

import { collectionRepo } from '@/db/repositories/collection.repo';

const mockSupabase = {} as Parameters<typeof generateUniqueSlug>[0];

// ── Factory helpers ────────────────────────────────────────────────────────────

const makeCollection = (
  id: string,
  parentId: string | null = null,
  overrides: Partial<CollectionWithCount> = {},
): CollectionWithCount => ({
  id,
  user_id: 'u1',
  name: `Collection ${id}`,
  description: null,
  slug: null,
  depth: 0,
  is_public: false,
  parent_id: parentId,
  icon: null,
  color: null,
  order_index: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  prompt_count: 0,
  children_count: 0,
  ...overrides,
});

// ── buildCollectionTree ────────────────────────────────────────────────────────

describe('buildCollectionTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCollectionTree([])).toEqual([]);
  });

  it('returns root-level nodes when there are no parents', () => {
    const flat = [makeCollection('a'), makeCollection('b')];
    const tree = buildCollectionTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('nests child under parent', () => {
    const flat = [makeCollection('parent'), makeCollection('child', 'parent')];
    const tree = buildCollectionTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('parent');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('child');
  });

  it('nests multiple children under a single parent', () => {
    const flat = [
      makeCollection('root'),
      makeCollection('c1', 'root'),
      makeCollection('c2', 'root'),
    ];
    const tree = buildCollectionTree(flat);
    expect(tree[0].children).toHaveLength(2);
  });

  it('builds a three-level deep tree', () => {
    const flat = [makeCollection('l1'), makeCollection('l2', 'l1'), makeCollection('l3', 'l2')];
    const tree = buildCollectionTree(flat);
    expect(tree[0].children[0].children[0].id).toBe('l3');
  });

  it('treats orphan nodes (unknown parent) as roots', () => {
    const flat = [makeCollection('orphan', 'nonexistent-parent')];
    const tree = buildCollectionTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('orphan');
  });

  it('initializes children array as empty for leaf nodes', () => {
    const tree = buildCollectionTree([makeCollection('leaf')]);
    expect(tree[0].children).toEqual([]);
  });
});

// ── generateUniqueSlug ────────────────────────────────────────────────────────

describe('generateUniqueSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns base slug when not taken', async () => {
    vi.mocked(collectionRepo.findBySlug).mockResolvedValue(null);
    const slug = await generateUniqueSlug(mockSupabase, 'My Collection');
    expect(slug).toBe('my-collection');
  });

  it('strips diacritics (decomposable) from the name', async () => {
    vi.mocked(collectionRepo.findBySlug).mockResolvedValue(null);
    // ó/é/á decompose via NFD; non-decomposable chars like ł are simply removed
    const slug = await generateUniqueSlug(mockSupabase, 'Réservation Clé');
    expect(slug).toBe('reservation-cle');
  });

  it('appends numeric suffix when base slug is taken', async () => {
    vi.mocked(collectionRepo.findBySlug)
      .mockResolvedValueOnce({ id: 'existing' } as CollectionWithCount)
      .mockResolvedValue(null);
    const slug = await generateUniqueSlug(mockSupabase, 'My Collection');
    expect(slug).toBe('my-collection-2');
  });

  it('increments suffix until a free slot is found', async () => {
    vi.mocked(collectionRepo.findBySlug)
      .mockResolvedValueOnce({ id: 'e1' } as CollectionWithCount) // my-collection
      .mockResolvedValueOnce({ id: 'e2' } as CollectionWithCount) // my-collection-2
      .mockResolvedValue(null); // my-collection-3
    const slug = await generateUniqueSlug(mockSupabase, 'My Collection');
    expect(slug).toBe('my-collection-3');
  });

  it('uses "collection" fallback for empty/special-char-only names', async () => {
    vi.mocked(collectionRepo.findBySlug).mockResolvedValue(null);
    const slug = await generateUniqueSlug(mockSupabase, '!!!');
    expect(slug).toBe('collection');
  });
});

// ── assertOwner ───────────────────────────────────────────────────────────────

describe('assertOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the collection when user is the owner', async () => {
    const col = makeCollection('c1', null, { user_id: 'u1' });
    vi.mocked(collectionRepo.findById).mockResolvedValue(col);

    const result = await assertOwner(mockSupabase, 'c1', 'u1');
    expect(result.id).toBe('c1');
  });

  it('throws "Collection not found" when collection does not exist', async () => {
    vi.mocked(collectionRepo.findById).mockResolvedValue(null);
    await expect(assertOwner(mockSupabase, 'missing', 'u1')).rejects.toThrow(
      'Collection not found',
    );
  });

  it('throws "Forbidden" when user is not the owner', async () => {
    const col = makeCollection('c1', null, { user_id: 'owner' });
    vi.mocked(collectionRepo.findById).mockResolvedValue(col);
    await expect(assertOwner(mockSupabase, 'c1', 'attacker')).rejects.toThrow('Forbidden');
  });
});
