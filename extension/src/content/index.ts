// Content script — runs in page context.
// Handles: injecting prompt text into focused input, floating "Save" button.

import type { ExtensionMessage, InsertPromptMessage } from '../shared/messages';

// ── Insert prompt into focused element ────────────────────────────────────────

function insertTextIntoFocused(text: string): boolean {
  const el = document.activeElement;
  if (!el) return false;

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // contenteditable (used by ChatGPT / Claude / Gemini)
  if ((el as HTMLElement).isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      (el as HTMLElement).focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    document.execCommand('insertText', false, text);
    return true;
  }

  return false;
}

// ── Floating "Save" button ─────────────────────────────────────────────────────

let floatingBtn: HTMLButtonElement | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function createFloatingButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = '__promptbase_save_btn__';
  btn.textContent = 'Save to PromptBase';
  btn.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    padding: 6px 12px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-family: system-ui, sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transition: opacity 0.15s;
    pointer-events: all;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = '#4f46e5'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#6366f1'; });
  btn.addEventListener('mousedown', (e) => { e.preventDefault(); });
  btn.addEventListener('click', () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) return;
    btn.textContent = 'Saving…';
    btn.disabled = true;

    chrome.runtime.sendMessage(
      { type: 'SAVE_SELECTION', text: selection },
      (response: { type: string; promptId: string | null; error?: string }) => {
        if (response?.error) {
          btn.textContent = 'Error — try again';
          btn.disabled = false;
          setTimeout(hideFloatingButton, 2000);
        } else {
          btn.textContent = 'Saved!';
          setTimeout(hideFloatingButton, 1200);
        }
      },
    );
  });
  return btn;
}

function showFloatingButton(x: number, y: number): void {
  if (!floatingBtn) {
    floatingBtn = createFloatingButton();
    document.body.appendChild(floatingBtn);
  }
  // Reset state
  floatingBtn.textContent = 'Save to PromptBase';
  floatingBtn.disabled = false;

  // Position above the selection
  const btnWidth = 160;
  const btnHeight = 32;
  const left = Math.min(x, window.innerWidth - btnWidth - 8);
  const top = Math.max(y - btnHeight - 8, 8);
  floatingBtn.style.left = `${left}px`;
  floatingBtn.style.top = `${top}px`;
  floatingBtn.style.opacity = '1';
  floatingBtn.style.display = 'block';
}

function hideFloatingButton(): void {
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

document.addEventListener('mouseup', (e) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  // Don't trigger if clicking the button itself
  if ((e.target as HTMLElement)?.id === '__promptbase_save_btn__') return;

  saveTimeout = setTimeout(() => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 10) {
      showFloatingButton(e.clientX, e.clientY);
    } else {
      hideFloatingButton();
    }
  }, 100);
});

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection()?.toString().trim();
  if (!selection) {
    setTimeout(hideFloatingButton, 200);
  }
});

// ── Message listener ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (r: unknown) => void) => {
    if (message.type === 'INSERT_PROMPT') {
      const inserted = insertTextIntoFocused((message as InsertPromptMessage).text);
      sendResponse({ inserted });
      return false;
    }
    if (message.type === 'GET_SELECTION') {
      const text = window.getSelection()?.toString().trim() ?? '';
      sendResponse({ type: 'SELECTION_RESULT', text });
      return false;
    }
    if (message.type === 'PING') {
      sendResponse({ pong: true });
      return false;
    }
    return false;
  },
);
