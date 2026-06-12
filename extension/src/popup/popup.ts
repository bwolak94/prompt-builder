// Popup script — runs in the extension popup context.

import type { PromptEntry } from '../shared/api';
import { getHost } from '../shared/api';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const authBanner = document.getElementById('authBanner')!;
const openAppLink = document.getElementById('openAppLink') as HTMLAnchorElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const listWrap = document.getElementById('listWrap')!;
const stateMsg = document.getElementById('stateMsg')!;
const refreshBtn = document.getElementById('refreshBtn')!;
const optionsBtn = document.getElementById('optionsBtn')!;
const toast = document.getElementById('toast')!;

// ── State ─────────────────────────────────────────────────────────────────────

let allPrompts: PromptEntry[] = [];
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg: string): void {
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Render list ───────────────────────────────────────────────────────────────

function renderList(prompts: PromptEntry[]): void {
  // Remove existing items (keep stateMsg)
  const items = listWrap.querySelectorAll('.prompt-item');
  items.forEach((el) => el.remove());

  if (prompts.length === 0) {
    stateMsg.style.display = 'block';
    stateMsg.innerHTML = '<div>No prompts found.</div>';
    return;
  }

  stateMsg.style.display = 'none';

  prompts.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'prompt-item';

    const meta = document.createElement('div');
    meta.className = 'prompt-meta';

    const title = document.createElement('div');
    title.className = 'prompt-title';
    title.title = p.title;
    title.textContent = p.title;

    const tags = document.createElement('div');
    tags.className = 'prompt-tags';
    tags.textContent = p.tags?.length ? p.tags.join(', ') : p.content_md.slice(0, 60);

    meta.appendChild(title);
    meta.appendChild(tags);

    const btn = document.createElement('button');
    btn.className = 'insert-btn';
    btn.textContent = 'Insert';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      void insertPrompt(p);
    });

    item.appendChild(meta);
    item.appendChild(btn);
    item.addEventListener('click', () => void insertPrompt(p));
    listWrap.appendChild(item);
  });
}

// ── Insert prompt into active tab ─────────────────────────────────────────────

async function insertPrompt(p: PromptEntry): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showToast('No active tab');
      return;
    }

    // Ping content script to check if it's loaded
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
    } catch {
      // Content script not injected — inject it now
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
    }

    const text = p.content_md || p.title;
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_PROMPT',
      text,
    }) as { inserted: boolean } | undefined;

    if (response?.inserted) {
      showToast('Inserted!');
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Insert failed';
    showToast(msg);
  }
}

// ── Load prompts ───────────────────────────────────────────────────────────────

async function loadPrompts(): Promise<void> {
  stateMsg.style.display = 'block';
  stateMsg.innerHTML = '<div class="spinner"></div><div>Loading…</div>';

  // Check auth first
  const authResp = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }) as
    | { ok: boolean }
    | undefined;

  if (!authResp?.ok) {
    const host = await getHost();
    openAppLink.href = host;
    authBanner.classList.add('visible');
    stateMsg.style.display = 'none';
    renderList([]);
    return;
  }

  authBanner.classList.remove('visible');

  const resp = await chrome.runtime.sendMessage({ type: 'GET_PROMPTS' }) as
    | { data: PromptEntry[] }
    | undefined;

  allPrompts = resp?.data ?? [];
  renderList(allPrompts);
}

// ── Search filter ─────────────────────────────────────────────────────────────

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) {
    renderList(allPrompts);
    return;
  }
  const filtered = allPrompts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q)) ||
      p.content_md.toLowerCase().includes(q),
  );
  renderList(filtered);
});

// ── Buttons ────────────────────────────────────────────────────────────────────

refreshBtn.addEventListener('click', () => void loadPrompts());

optionsBtn.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});

// ── Init ───────────────────────────────────────────────────────────────────────

void loadPrompts();
