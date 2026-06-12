import type { SupabaseClient } from '@/db/supabase.client';
import {
  collectionRepo,
  type Collection,
  type CollectionWithCount,
  type CollectionNode,
} from '@/db/repositories/collection.repo';

/** Build a nested tree from a flat list sorted by order_index/name. */
export function buildCollectionTree(flat: CollectionWithCount[]): CollectionNode[] {
  const map = new Map<string, CollectionNode>();
  const roots: CollectionNode[] = [];

  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  flat.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** Slugify a string to URL-safe lowercase kebab-case. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

/** Generate a unique slug for a collection, appending a numeric suffix if needed. */
export async function generateUniqueSlug(supabase: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name) || 'collection';
  let candidate = base;
  let i = 2;

  while (true) {
    const existing = await collectionRepo.findBySlug(supabase, candidate);
    if (!existing) return candidate;
    candidate = `${base}-${i}`;
    i++;
  }
}

/** Verify ownership and return the collection, or throw. */
export async function assertOwner(
  supabase: SupabaseClient,
  collectionId: string,
  userId: string,
): Promise<Collection> {
  const collection = await collectionRepo.findById(supabase, collectionId);
  if (!collection) throw new Error('Collection not found');
  if (collection.user_id !== userId) throw new Error('Forbidden');
  return collection;
}

export const collectionService = {
  buildTree: buildCollectionTree,
  generateUniqueSlug,
  assertOwner,

  /** Toggle is_public. Generates slug when making public. */
  async togglePublic(
    supabase: SupabaseClient,
    collectionId: string,
    userId: string,
  ): Promise<Collection> {
    const collection = await assertOwner(supabase, collectionId, userId);
    const makePublic = !collection.is_public;
    const slug =
      makePublic && !collection.slug
        ? await generateUniqueSlug(supabase, collection.name)
        : collection.slug;

    return collectionRepo.update(supabase, collectionId, {
      is_public: makePublic,
      slug: makePublic ? slug : null,
    });
  },
};
