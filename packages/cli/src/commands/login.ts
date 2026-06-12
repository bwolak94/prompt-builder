import { saveConfig } from '../lib/config.js';
import { ApiClient } from '../lib/api-client.js';

export async function loginCommand(options: { key?: string }): Promise<void> {
  const apiKey = options.key;
  if (!apiKey || !apiKey.startsWith('pb_live_')) {
    console.error('Invalid API key format. Expected: pb_live_...');
    process.exit(1);
  }

  // Verify the key works
  try {
    const client = new ApiClient(apiKey);
    const me = await client.getMe();
    saveConfig({ apiKey });
    console.log(`✓ Logged in as ${me.display_name} (${me.plan} plan)`);
    console.log(`  API key saved to ~/.promptbase/config.json`);
  } catch (err) {
    console.error(`✗ Login failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function logoutCommand(): Promise<void> {
  saveConfig({ apiKey: undefined });
  console.log('✓ Logged out. API key removed from ~/.promptbase/config.json');
}
