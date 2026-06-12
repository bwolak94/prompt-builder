/**
 * Generates a PromptBase REST API key in the format: pb_live_<base62(32 bytes)>
 * The plaintext key is shown to the user once and never stored.
 */

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function toBase62(bytes: Uint8Array): string {
  let result = '';
  // Process in chunks to convert random bytes to base62
  for (const byte of bytes) {
    result += BASE62[byte % 62];
  }
  return result;
}

export function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return `pb_live_${toBase62(randomBytes)}`;
}

export function getKeyPrefix(): string {
  return 'pb_live_';
}

export function getKeySuffix(key: string): string {
  return key.slice(-4);
}
