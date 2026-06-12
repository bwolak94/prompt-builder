/**
 * CollectionsSidebar — F-09
 * Nested collection tree with CRUD. Renders as a React island (client:load).
 */

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import type {
  CollectionNode,
  CreateCollectionDto,
  Collection,
} from '@/db/repositories/collection.repo';
import { useCollections } from './hooks/useCollections';

interface CollectionsSidebarProps {
  lang: Lang;
  initialTree: CollectionNode[];
  initialActiveId: string | null;
}

export const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({
  lang,
  initialTree,
  initialActiveId,
}) => {
  const { t } = useI18n(lang);
  const {
    tree,
    activeCollectionId,
    setActiveCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    error,
  } = useCollections(initialTree, initialActiveId);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    parentId?: string;
    collection?: Collection;
  }>({ open: false, mode: 'create' });

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">
          {t('collections.title')}
        </span>
        <button
          onClick={() => setModalState({ open: true, mode: 'create' })}
          className="text-text-muted hover:text-text-primary rounded p-0.5 transition-colors"
          title={t('collections.newCollection')}
          aria-label={t('collections.newCollection')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
        </button>
      </div>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded px-2 py-1 text-[10px]">{error}</p>
      )}

      {/* All prompts (no filter) */}
      <button
        onClick={() => setActiveCollection(null)}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
          activeCollectionId === null
            ? 'bg-surface-overlay text-text-primary font-medium'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        <span>📋</span>
        <span className="flex-1 text-left">{t('dashboard.filterAll')}</span>
      </button>

      {/* Tree */}
      {tree.length === 0 ? (
        <div className="px-2 py-3 text-center">
          <p className="text-text-muted text-[10px]">{t('collections.noCollections')}</p>
          <p className="text-text-muted/70 mt-0.5 text-[10px]">
            {t('collections.noCollectionsSub')}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5" role="tree">
          {tree.map((node) => (
            <CollectionNodeItem
              key={node.id}
              node={node}
              activeId={activeCollectionId}
              onSelect={setActiveCollection}
              onEdit={(c) => setModalState({ open: true, mode: 'edit', collection: c })}
              onDelete={deleteCollection}
              onAddChild={(parentId) => setModalState({ open: true, mode: 'create', parentId })}
              depth={0}
            />
          ))}
        </ul>
      )}

      {/* Modal */}
      {modalState.open && (
        <CollectionModal
          mode={modalState.mode}
          collection={modalState.collection}
          parentId={modalState.parentId}
          onCreate={createCollection}
          onUpdate={updateCollection}
          onClose={() => setModalState({ open: false, mode: 'create' })}
          t={t}
        />
      )}
    </div>
  );
};

// ── CollectionNodeItem ────────────────────────────────────────────────────────

interface NodeItemProps {
  node: CollectionNode;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (c: Collection) => void;
  onDelete: (id: string) => Promise<void>;
  onAddChild: (parentId: string) => void;
  depth: number;
}

const CollectionNodeItem: React.FC<NodeItemProps> = ({
  node,
  activeId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  depth,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const isActive = activeId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
          isActive
            ? 'bg-brand-500/15 text-brand-400'
            : 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-text-muted/60 shrink-0 text-[10px]"
            aria-label={expanded ? 'Zwiń' : 'Rozwiń'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}

        {/* Icon + name */}
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs"
          onClick={() => onSelect(node.id)}
        >
          {node.icon && <span className="shrink-0">{node.icon}</span>}
          {node.color && !node.icon && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: node.color }}
              aria-hidden="true"
            />
          )}
          <span className="truncate">{node.name}</span>
          {node.prompt_count > 0 && (
            <span className="bg-surface-overlay ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px]">
              {node.prompt_count}
            </span>
          )}
        </button>

        {/* Actions (hover) */}
        {showActions && (
          <div className="flex shrink-0 items-center gap-0.5">
            {node.depth < 4 && (
              <button
                onClick={() => onAddChild(node.id)}
                className="text-text-muted/60 hover:text-text-primary rounded p-0.5 text-[10px]"
                title="Dodaj podkolekcję"
              >
                +
              </button>
            )}
            <button
              onClick={() => onEdit(node)}
              className="text-text-muted/60 hover:text-text-primary rounded p-0.5 text-[10px]"
              title="Edytuj"
            >
              ✎
            </button>
            <button
              onClick={() => void onDelete(node.id)}
              className="rounded p-0.5 text-[10px] text-red-400/60 hover:text-red-400"
              title="Usuń"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="group">
          {node.children.map((child) => (
            <CollectionNodeItem
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// ── CollectionModal ───────────────────────────────────────────────────────────

const PRESET_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
const PRESET_ICONS = ['📁', '⭐', '🔥', '💡', '🎯', '🛠️', '📝', '🤖', '📊', '🎨'];

interface ModalProps {
  mode: 'create' | 'edit';
  collection?: Collection;
  parentId?: string;
  onCreate: (dto: CreateCollectionDto) => Promise<void>;
  onUpdate: UpdateFn;
  onClose: () => void;
  t: ReturnType<typeof useI18n>['t'];
}

// fix type — onUpdate is from useCollections
type UpdateFn = (
  id: string,
  dto: { name?: string; description?: string; is_public?: boolean; color?: string; icon?: string },
) => Promise<void>;

const CollectionModal: React.FC<Omit<ModalProps, 'onUpdate'> & { onUpdate: UpdateFn }> = ({
  mode,
  collection,
  parentId,
  onCreate,
  onUpdate,
  onClose,
  t,
}) => {
  const [name, setName] = useState(collection?.name ?? '');
  const [description, setDescription] = useState(collection?.description ?? '');
  const [color, setColor] = useState(collection?.color ?? '');
  const [icon, setIcon] = useState(collection?.icon ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        await onCreate({
          name: name.trim(),
          description: description || undefined,
          parent_id: parentId,
          color: color || undefined,
          icon: icon || undefined,
        });
      } else if (collection) {
        await onUpdate(collection.id, {
          name: name.trim(),
          description: description || undefined,
          color: color || undefined,
          icon: icon || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'create' ? t('collections.newCollection') : t('collections.editCollection');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="border-border bg-surface-base w-full max-w-sm rounded-xl border p-5 shadow-xl">
        <h3 className="text-text-primary mb-4 text-sm font-semibold">{title}</h3>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('collections.namePlaceholder')}
            maxLength={100}
            required
            autoFocus
            className="border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:ring-brand-400 rounded-md border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
          />

          {/* Description */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opis (opcjonalnie)"
            maxLength={500}
            className="border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:ring-brand-400 rounded-md border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
          />

          {/* Color picker */}
          <div>
            <p className="text-text-muted mb-1.5 text-[10px]">Kolor</p>
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    color === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor('')}
                className={`border-border text-text-muted flex h-5 w-5 items-center justify-center rounded-full border text-[9px] transition-all ${
                  !color ? 'border-text-muted' : ''
                }`}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <p className="text-text-muted mb-1.5 text-[10px]">Ikona</p>
            <div className="flex flex-wrap gap-1">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(icon === ic ? '' : ic)}
                  className={`rounded px-1.5 py-0.5 text-base transition-all ${
                    icon === ic ? 'bg-brand-500/20' : 'hover:bg-surface-overlay'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-destructive text-[10px]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionsSidebar;
