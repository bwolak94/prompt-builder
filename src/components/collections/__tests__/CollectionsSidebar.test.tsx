import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSetActiveCollection = vi.fn();
const mockCreateCollection = vi.fn();
const mockUpdateCollection = vi.fn();
const mockDeleteCollection = vi.fn();

let mockTree: unknown[] = [];
let mockActiveId: string | null = null;

vi.mock('../hooks/useCollections', () => ({
  useCollections: (initial: unknown[], activeId: unknown) => ({
    tree: mockTree.length ? mockTree : initial,
    activeCollectionId: mockActiveId ?? activeId,
    setActiveCollection: mockSetActiveCollection,
    createCollection: mockCreateCollection,
    updateCollection: mockUpdateCollection,
    deleteCollection: mockDeleteCollection,
    error: null,
  }),
}));

import { CollectionsSidebar } from '../CollectionsSidebar';
import type { CollectionNode } from '@/db/repositories/collection.repo';

const NODE: CollectionNode = {
  id: 'c1',
  user_id: 'u1',
  name: 'My Collection',
  description: null,
  icon: '📁',
  color: null,
  parent_id: null,
  depth: 0,
  is_public: false,
  slug: null,
  order_index: 0,
  prompt_count: 0,
  children_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  children: [],
};

beforeEach(() => {
  mockTree = [];
  mockActiveId = null;
  mockSetActiveCollection.mockClear();
  mockCreateCollection.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CollectionsSidebar', () => {
  it('renders collections title in Polish', () => {
    render(<CollectionsSidebar lang="pl" initialTree={[]} initialActiveId={null} />);
    expect(screen.getByText('Kolekcje')).toBeTruthy();
  });

  it('renders collections title in English', () => {
    render(<CollectionsSidebar lang="en" initialTree={[]} initialActiveId={null} />);
    expect(screen.getByText('Collections')).toBeTruthy();
  });

  it('renders new collection button', () => {
    render(<CollectionsSidebar lang="pl" initialTree={[]} initialActiveId={null} />);
    expect(screen.getByLabelText('Nowa kolekcja')).toBeTruthy();
  });

  it('renders collection nodes', () => {
    mockTree = [NODE];
    render(<CollectionsSidebar lang="en" initialTree={[NODE]} initialActiveId={null} />);
    expect(screen.getByText('My Collection')).toBeTruthy();
  });

  it('opens create modal when new collection button clicked', () => {
    render(<CollectionsSidebar lang="pl" initialTree={[]} initialActiveId={null} />);
    fireEvent.click(screen.getByLabelText('Nowa kolekcja'));
    // Modal opens (collection form dialog)
    expect(screen.getByPlaceholderText(/Nazwa/i)).toBeTruthy();
  });
});
