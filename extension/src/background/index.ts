// Background service worker — handles API calls and message routing.
// Runs in the extension's background context (no DOM access).

import { getPrompts, createPrompt, parseText, checkAuth } from '../shared/api';
import type { ExtensionMessage, SaveDoneMessage } from '../shared/messages';

// ── Prompt cache ──────────────────────────────────────────────────────────────

interface CacheEntry {
  data: Awaited<ReturnType<typeof getPrompts>>;
  ts: number;
}

let promptCache: CacheEntry | null = null;
const CACHE_TTL = 60_000; // 60 seconds

async function getCachedPrompts() {
  const now = Date.now();
  if (promptCache && now - promptCache.ts < CACHE_TTL) {
    return promptCache.data;
  }
  const data = await getPrompts(30);
  promptCache = { data, ts: now };
  return data;
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (r: unknown) => void) => {
    if (message.type === 'PING') {
      sendResponse({ pong: true });
      return false;
    }

    if (message.type === 'SAVE_SELECTION') {
      void (async () => {
        try {
          const parsed = await parseText(message.text);
          if (!parsed) {
            const reply: SaveDoneMessage = { type: 'SAVE_DONE', promptId: null, error: 'Parse failed' };
            sendResponse(reply);
            return;
          }
          const created = await createPrompt({
            title: parsed.title || 'Saved from web',
            blocks: parsed.blocks,
          });
          const reply: SaveDoneMessage = {
            type: 'SAVE_DONE',
            promptId: created?.id ?? null,
            error: created ? undefined : 'Failed to save',
          };
          // Bust cache on save
          promptCache = null;
          sendResponse(reply);
        } catch (err) {
          const reply: SaveDoneMessage = {
            type: 'SAVE_DONE',
            promptId: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
          sendResponse(reply);
        }
      })();
      return true; // keep channel open for async response
    }

    return false;
  },
);

// ── Context menu: "Save to PromptBase" ───────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-promptbase',
    title: 'Save to PromptBase',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'save-to-promptbase') return;
  const text = info.selectionText?.trim();
  if (!text) return;

  void (async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'PromptBase',
        message: 'Please sign in to PromptBase first.',
      });
      return;
    }

    const parsed = await parseText(text);
    if (!parsed) return;

    const created = await createPrompt({
      title: parsed.title || 'Saved from web',
      blocks: parsed.blocks,
    });

    if (created) {
      promptCache = null;
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Saved to PromptBase',
        message: `"${parsed.title}" saved to your library.`,
      });
    }
  })();
});

// ── Expose prompts to popup via chrome.runtime ────────────────────────────────

// The popup calls chrome.runtime.sendMessage with {type:'GET_PROMPTS'}
chrome.runtime.onMessage.addListener(
  (message: { type: string }, _sender, sendResponse: (r: unknown) => void) => {
    if (message.type === 'GET_PROMPTS') {
      void getCachedPrompts().then((data) => sendResponse({ data }));
      return true;
    }
    if (message.type === 'CHECK_AUTH') {
      void checkAuth().then((ok) => sendResponse({ ok }));
      return true;
    }
    return false;
  },
);
