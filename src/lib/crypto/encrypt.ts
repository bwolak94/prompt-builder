/**
 * AES-256-GCM encryption for BYOK API keys.
 *
 * Keys are never stored in plaintext. The encrypted value is:
 *   base64(iv[12 bytes] + ciphertext + authTag[16 bytes])
 *
 * The ENCRYPTION_KEY env var must be a 32-byte hex string (64 hex chars).
 */

function getEncryptionKey(): string {
  const key = import.meta.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return key;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(hexKey);
  return crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypts plaintext with AES-256-GCM. Returns base64(iv + ciphertext+tag). */
export async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await importKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  // Concatenate iv + ciphertext+authTag
  const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

/** Decrypts a value encrypted by encryptApiKey. */
export async function decryptApiKey(encrypted: string): Promise<string> {
  const key = await importKey(getEncryptionKey());
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/** Creates a display hint: first 3 chars + "..." + last 4 chars */
export function makeKeyHint(plaintext: string): string {
  if (plaintext.length <= 7) return '***';
  return plaintext.slice(0, 3) + '...' + plaintext.slice(-4);
}
