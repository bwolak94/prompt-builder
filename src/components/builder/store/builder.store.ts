import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { PromptBlock, PromptVariable, Prompt, VariableDefinition } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BuilderStore {
  // State
  promptId: string | null;
  blocks: PromptBlock[];
  variables: Record<string, string>;
  detectedVariables: VariableDefinition[];
  isDirty: boolean;
  isSaving: boolean;
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
  activeBlockId: string | null;

  // Block actions
  addBlock: (sectionSlug: string) => void;
  removeBlock: (id: string) => void;
  updateBlockContent: (id: string, content: string) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  setActiveBlockId: (id: string | null) => void;

  // Variable actions
  setVariable: (name: string, value: string) => void;
  setDetectedVariables: (vars: VariableDefinition[]) => void;

  // Metadata actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  setTags: (tags: string[]) => void;

  // Lifecycle
  setSaving: (saving: boolean) => void;
  markClean: () => void;
  save: () => Promise<void>;
  loadPrompt: (prompt: Prompt) => void;
  reset: () => void;
}

// ── Initial state ──────────────────────────────────────────────────────────────

const initialState = {
  promptId: null,
  blocks: [] as PromptBlock[],
  variables: {} as Record<string, string>,
  detectedVariables: [] as VariableDefinition[],
  isDirty: false,
  isSaving: false,
  title: '',
  description: '',
  isPublic: false,
  tags: [] as string[],
  activeBlockId: null,
};

// ── Store ──────────────────────────────────────────────────────────────────────

const createStore = (set: (fn: (state: BuilderStore) => Partial<BuilderStore>) => void): BuilderStore => ({
  ...initialState,

  // Block actions

  addBlock: (sectionSlug) =>
    set((state) => {
      const newBlock: PromptBlock = {
        id: nanoid(),
        section_slug: sectionSlug,
        content: '',
        order_index: state.blocks.length,
      };
      return {
        blocks: [...state.blocks, newBlock],
        isDirty: true,
      };
    }),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks
        .filter((b) => b.id !== id)
        .map((b, i) => ({ ...b, order_index: i })),
      isDirty: true,
    })),

  updateBlockContent: (id, content) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
      isDirty: true,
    })),

  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const activeIndex = state.blocks.findIndex((b) => b.id === activeId);
      const overIndex = state.blocks.findIndex((b) => b.id === overId);
      if (activeIndex === -1 || overIndex === -1) return {};

      const reordered = [...state.blocks];
      const [moved] = reordered.splice(activeIndex, 1);
      reordered.splice(overIndex, 0, moved);

      return {
        blocks: reordered.map((b, i) => ({ ...b, order_index: i })),
        isDirty: true,
      };
    }),

  setActiveBlockId: (id) => set(() => ({ activeBlockId: id })),

  // Variable actions

  setVariable: (name, value) =>
    set((state) => ({
      variables: { ...state.variables, [name]: value },
      isDirty: true,
    })),

  setDetectedVariables: (vars) => set(() => ({ detectedVariables: vars })),

  // Metadata actions

  setTitle: (title) => set(() => ({ title, isDirty: true })),
  setDescription: (description) => set(() => ({ description, isDirty: true })),
  setIsPublic: (isPublic) => set(() => ({ isPublic, isDirty: true })),
  setTags: (tags) => set(() => ({ tags, isDirty: true })),

  // Lifecycle

  setSaving: (saving) => set(() => ({ isSaving: saving })),
  markClean: () => set(() => ({ isDirty: false })),

  save: async () => {
    const state = useBuilderStore.getState();
    if (state.isSaving) return;

    set(() => ({ isSaving: true }));

    try {
      const body = {
        title: state.title,
        description: state.description,
        blocks: state.blocks,
        variables: [] as PromptVariable[],
        tags: state.tags,
        is_public: state.isPublic,
      };

      const url = state.promptId ? `/api/prompts/${state.promptId}` : '/api/prompts';
      const method = state.promptId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? 'Save failed');
      }

      const json = (await res.json()) as { data?: { id?: string } };
      const savedId = json.data?.id;

      set(() => ({
        promptId: savedId ?? state.promptId,
        isDirty: false,
        isSaving: false,
      }));
    } catch {
      set(() => ({ isSaving: false }));
      throw new Error('Save failed');
    }
  },

  loadPrompt: (prompt) =>
    set(() => ({
      promptId: prompt.id,
      title: prompt.title,
      description: prompt.description ?? '',
      blocks: prompt.blocks,
      variables: {},
      detectedVariables: [],
      tags: prompt.tags,
      isPublic: prompt.is_public,
      isDirty: false,
      isSaving: false,
      activeBlockId: null,
    })),

  reset: () => set(() => ({ ...initialState })),
});

export const useBuilderStore = create<BuilderStore>()(
  import.meta.env.DEV
    ? devtools(createStore, { name: 'BuilderStore' })
    : createStore,
);
