import { join } from 'node:path';
import { ApiClient } from '../lib/api-client.js';
import { requireApiKey } from '../lib/config.js';
import { serializePromptFile, writePromptFile } from '../lib/file-parser.js';

export async function pullCommand(
  id: string,
  options: { env?: string; output?: string },
): Promise<void> {
  const apiKey = requireApiKey();
  const client = new ApiClient(apiKey);
  const env = options.env ?? 'dev';

  try {
    const prompt = await client.getPrompt(id, env);
    const content = serializePromptFile(prompt, env);

    const slug = prompt.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const filePath = options.output ?? join(process.cwd(), `${slug}.md`);
    writePromptFile(filePath, content);

    console.log(`✓ Downloaded "${prompt.title}" (${env}) → ${filePath}`);
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
