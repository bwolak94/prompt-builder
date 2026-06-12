import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR  = join(homedir(), '.promptbase');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  apiKey?: string;
  baseUrl: string;
  defaultEnv: string;
}

const DEFAULT_CONFIG: CliConfig = {
  baseUrl: 'https://promptbase.app',
  defaultEnv: 'dev',
};

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as CliConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<CliConfig>): void {
  const current = loadConfig();
  const updated = { ...current, ...config };
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
}

export function requireApiKey(): string {
  const config = loadConfig();
  if (!config.apiKey) {
    console.error('No API key found. Run: npx promptbase login --key pb_live_...');
    process.exit(1);
  }
  return config.apiKey;
}
