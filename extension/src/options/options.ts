// Options page script.

import { getHost, setHost } from '../shared/api';

const DEFAULT_HOST = 'http://localhost:3000';

// ── DOM refs ───────────────────────────────────────────────────────────────────

const hostInput = document.getElementById('hostInput') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn')!;
const resetBtn = document.getElementById('resetBtn')!;
const saveFeedback = document.getElementById('saveFeedback')!;

const statusDot = document.getElementById('statusDot')!;
const statusText = document.getElementById('statusText')!;
const openAppBtn = document.getElementById('openAppBtn') as HTMLAnchorElement;
const recheckBtn = document.getElementById('recheckBtn')!;

// ── Helpers ────────────────────────────────────────────────────────────────────

function showFeedback(msg: string, isError = false): void {
  saveFeedback.textContent = msg;
  saveFeedback.className = `feedback${isError ? ' error' : ''}`;
  setTimeout(() => { saveFeedback.textContent = ''; }, 3000);
}

function setStatus(state: 'checking' | 'ok' | 'error', msg: string): void {
  statusDot.className = `dot ${state}`;
  statusText.textContent = msg;
}

// ── Load current host ──────────────────────────────────────────────────────────

async function loadHost(): Promise<void> {
  const host = await getHost();
  hostInput.value = host;
  openAppBtn.href = host;
}

// ── Check auth ─────────────────────────────────────────────────────────────────

async function checkAuth(): Promise<void> {
  setStatus('checking', 'Checking…');
  const resp = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }) as
    | { ok: boolean }
    | undefined;

  if (resp?.ok) {
    setStatus('ok', 'Signed in');
  } else {
    setStatus('error', 'Not signed in — open the app and log in.');
  }
}

// ── Save host ──────────────────────────────────────────────────────────────────

saveBtn.addEventListener('click', async () => {
  const raw = hostInput.value.trim().replace(/\/$/, '');
  if (!raw) {
    showFeedback('URL cannot be empty.', true);
    return;
  }
  try {
    new URL(raw); // validate
  } catch {
    showFeedback('Invalid URL.', true);
    return;
  }
  await setHost(raw);
  openAppBtn.href = raw;
  showFeedback('Saved!');
  void checkAuth();
});

resetBtn.addEventListener('click', async () => {
  await setHost(DEFAULT_HOST);
  hostInput.value = DEFAULT_HOST;
  openAppBtn.href = DEFAULT_HOST;
  showFeedback('Reset to default.');
  void checkAuth();
});

recheckBtn.addEventListener('click', () => void checkAuth());

// ── Init ───────────────────────────────────────────────────────────────────────

void loadHost();
void checkAuth();
