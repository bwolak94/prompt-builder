import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore } from '../builder.store';
import type { Prompt } from '@/types';

const getStore = () => useBuilderStore.getState();

const resetStore = () => {
  useBuilderStore.getState().reset();
};

describe('BuilderStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── addBlock ────────────────────────────────────────────────────
  describe('addBlock', () => {
    it('adds a block with correct section_slug', () => {
      getStore().addBlock('role');
      const { blocks } = getStore();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].section_slug).toBe('role');
    });

    it('assigns sequential order_index', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      const { blocks } = getStore();
      expect(blocks[0].order_index).toBe(0);
      expect(blocks[1].order_index).toBe(1);
    });

    it('sets isDirty to true', () => {
      expect(getStore().isDirty).toBe(false);
      getStore().addBlock('role');
      expect(getStore().isDirty).toBe(true);
    });

    it('generates a unique id for each block', () => {
      getStore().addBlock('role');
      getStore().addBlock('role');
      const { blocks } = getStore();
      expect(blocks[0].id).not.toBe(blocks[1].id);
    });
  });

  // ── removeBlock ─────────────────────────────────────────────────
  describe('removeBlock', () => {
    it('removes the correct block', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      const id = getStore().blocks[0].id;
      getStore().removeBlock(id);
      expect(getStore().blocks).toHaveLength(1);
      expect(getStore().blocks[0].section_slug).toBe('task');
    });

    it('re-indexes order_index after removal', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      const id = getStore().blocks[0].id;
      getStore().removeBlock(id);
      expect(getStore().blocks[0].order_index).toBe(0);
    });

    it('sets isDirty to true', () => {
      getStore().addBlock('role');
      useBuilderStore.setState({ isDirty: false });
      const id = getStore().blocks[0].id;
      getStore().removeBlock(id);
      expect(getStore().isDirty).toBe(true);
    });
  });

  // ── updateBlockContent ──────────────────────────────────────────
  describe('updateBlockContent', () => {
    it('updates content of the correct block', () => {
      getStore().addBlock('role');
      const id = getStore().blocks[0].id;
      getStore().updateBlockContent(id, 'You are a helpful assistant');
      expect(getStore().blocks[0].content).toBe('You are a helpful assistant');
    });

    it('does not affect other blocks', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      const id = getStore().blocks[0].id;
      getStore().updateBlockContent(id, 'Role content');
      expect(getStore().blocks[1].content).toBe('');
    });

    it('sets isDirty to true', () => {
      getStore().addBlock('role');
      useBuilderStore.setState({ isDirty: false });
      const id = getStore().blocks[0].id;
      getStore().updateBlockContent(id, 'test');
      expect(getStore().isDirty).toBe(true);
    });
  });

  // ── reorderBlocks ───────────────────────────────────────────────
  describe('reorderBlocks', () => {
    it('swaps two blocks', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      getStore().addBlock('format');
      const [b0, b1] = getStore().blocks;
      getStore().reorderBlocks(b0.id, b1.id);
      const reordered = getStore().blocks;
      expect(reordered[0].section_slug).toBe('task');
      expect(reordered[1].section_slug).toBe('role');
    });

    it('updates order_index after reorder', () => {
      getStore().addBlock('role');
      getStore().addBlock('task');
      const [b0, b1] = getStore().blocks;
      getStore().reorderBlocks(b0.id, b1.id);
      getStore().blocks.forEach((b, i) => {
        expect(b.order_index).toBe(i);
      });
    });

    it('ignores unknown ids', () => {
      getStore().addBlock('role');
      const before = getStore().blocks.map((b) => b.id);
      getStore().reorderBlocks('nonexistent', 'also-nonexistent');
      const after = getStore().blocks.map((b) => b.id);
      expect(after).toEqual(before);
    });
  });

  // ── setVariable ─────────────────────────────────────────────────
  describe('setVariable', () => {
    it('stores variable value by name', () => {
      getStore().setVariable('user_name', 'Alice');
      expect(getStore().variables['user_name']).toBe('Alice');
    });

    it('preserves existing variables', () => {
      getStore().setVariable('a', '1');
      getStore().setVariable('b', '2');
      expect(getStore().variables['a']).toBe('1');
      expect(getStore().variables['b']).toBe('2');
    });

    it('sets isDirty to true', () => {
      useBuilderStore.setState({ isDirty: false });
      getStore().setVariable('x', 'y');
      expect(getStore().isDirty).toBe(true);
    });
  });

  // ── metadata actions ────────────────────────────────────────────
  describe('metadata actions', () => {
    it('setTitle updates title and marks dirty', () => {
      getStore().setTitle('My Prompt');
      expect(getStore().title).toBe('My Prompt');
      expect(getStore().isDirty).toBe(true);
    });

    it('setDescription updates description and marks dirty', () => {
      getStore().setDescription('A description');
      expect(getStore().description).toBe('A description');
      expect(getStore().isDirty).toBe(true);
    });

    it('setIsPublic updates isPublic and marks dirty', () => {
      getStore().setIsPublic(true);
      expect(getStore().isPublic).toBe(true);
      expect(getStore().isDirty).toBe(true);
    });

    it('setTags updates tags and marks dirty', () => {
      getStore().setTags(['ai', 'coding']);
      expect(getStore().tags).toEqual(['ai', 'coding']);
      expect(getStore().isDirty).toBe(true);
    });
  });

  // ── loadPrompt ──────────────────────────────────────────────────
  describe('loadPrompt', () => {
    const mockPrompt: Prompt = {
      id: 'prompt-1',
      user_id: 'user-1',
      title: 'Test Prompt',
      description: 'A test',
      blocks: [{ id: 'b1', section_slug: 'role', content: 'Be helpful', order_index: 0 }],
      variables: [],
      content_md: '# Be helpful',
      tags: ['test'],
      is_public: true,
      slug: 'test-prompt-abc123',
      fork_of: null,
      fork_count: 0,
      view_count: 5,
      category: null,
      difficulty: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      deleted_at: null,
    };

    it('populates store from prompt', () => {
      getStore().loadPrompt(mockPrompt);
      const s = getStore();
      expect(s.promptId).toBe('prompt-1');
      expect(s.title).toBe('Test Prompt');
      expect(s.blocks).toHaveLength(1);
      expect(s.tags).toEqual(['test']);
    });

    it('resets isDirty after load', () => {
      getStore().addBlock('role'); // makes it dirty
      getStore().loadPrompt(mockPrompt);
      expect(getStore().isDirty).toBe(false);
    });
  });

  // ── reset ───────────────────────────────────────────────────────
  describe('reset', () => {
    it('clears all state', () => {
      getStore().addBlock('role');
      getStore().setTitle('something');
      getStore().reset();
      const s = getStore();
      expect(s.blocks).toHaveLength(0);
      expect(s.title).toBe('');
      expect(s.promptId).toBeNull();
      expect(s.isDirty).toBe(false);
    });
  });
});
