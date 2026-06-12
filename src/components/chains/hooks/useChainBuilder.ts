import { useState, useCallback, useTransition } from 'react';
import { nanoid } from 'nanoid';
import type { ChainNode, PromptChainWithNodes } from '@/db/repositories/chain.repo';

export interface LocalNode extends ChainNode {
  _dirty?: boolean;
}

interface UseChainBuilderResult {
  nodes: LocalNode[];
  title: string;
  description: string;
  isSaving: boolean;
  isPending: boolean;

  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  addNode: () => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, fields: Partial<Pick<LocalNode, 'title' | 'content_md'>>) => void;
  moveNode: (fromIndex: number, toIndex: number) => void;
  saveAll: () => Promise<void>;
}

export function useChainBuilder(chain: PromptChainWithNodes): UseChainBuilderResult {
  const [title, setTitle] = useState(chain.title);
  const [description, setDescription] = useState(chain.description ?? '');
  const [nodes, setNodes] = useState<LocalNode[]>(chain.nodes);
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const [isPending, setIsPending] = useState(false);

  const addNode = useCallback(() => {
    const newNode: LocalNode = {
      id: `local_${nanoid()}`,
      chain_id: chain.id,
      prompt_id: null,
      title: '',
      content_md: '',
      order_index: nodes.length,
      created_at: new Date().toISOString(),
      _dirty: true,
    };
    setNodes((prev) => [...prev, newNode]);
  }, [chain.id, nodes.length]);

  const removeNode = useCallback((id: string) => {
    // If it's a real DB node, delete via API
    if (!id.startsWith('local_')) {
      void fetch(`/api/chains/${chain.id}/nodes/${id}`, { method: 'DELETE' });
    }
    setNodes((prev) =>
      prev.filter((n) => n.id !== id).map((n, i) => ({ ...n, order_index: i })),
    );
  }, [chain.id]);

  const updateNode = useCallback(
    (id: string, fields: Partial<Pick<LocalNode, 'title' | 'content_md'>>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...fields, _dirty: true } : n)),
      );
    },
    [],
  );

  const moveNode = useCallback((fromIndex: number, toIndex: number) => {
    startTransition(() => {
      setIsPending(true);
      setNodes((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, item);
        return arr.map((n, i) => ({ ...n, order_index: i, _dirty: true }));
      });
      setIsPending(false);
    });
  }, []);

  const saveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. Save chain metadata
      await fetch(`/api/chains/${chain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null }),
      });

      // 2. Upsert each node
      const savedNodes: LocalNode[] = [];
      for (const node of nodes) {
        if (node.id.startsWith('local_')) {
          // Create new node
          const res = await fetch(`/api/chains/${chain.id}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: node.title,
              content_md: node.content_md,
              order_index: node.order_index,
            }),
          });
          if (res.ok) {
            const json = (await res.json()) as { data: ChainNode };
            savedNodes.push({ ...json.data, _dirty: false });
          } else {
            savedNodes.push(node);
          }
        } else if (node._dirty) {
          // Update existing node
          await fetch(`/api/chains/${chain.id}/nodes/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: node.title, content_md: node.content_md }),
          });
          savedNodes.push({ ...node, _dirty: false });
        } else {
          savedNodes.push(node);
        }
      }

      // 3. Reorder if needed
      const realIds = savedNodes.filter((n) => !n.id.startsWith('local_')).map((n) => n.id);
      if (realIds.length > 0) {
        await fetch(`/api/chains/${chain.id}/nodes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordered_ids: realIds }),
        });
      }

      setNodes(savedNodes);
    } finally {
      setIsSaving(false);
    }
  }, [chain.id, title, description, nodes]);

  return {
    nodes,
    title,
    description,
    isSaving,
    isPending,
    setTitle,
    setDescription,
    addNode,
    removeNode,
    updateNode,
    moveNode,
    saveAll,
  };
}
