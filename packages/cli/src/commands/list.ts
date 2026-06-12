import { ApiClient } from '../lib/api-client.js';
import { requireApiKey } from '../lib/config.js';

export async function listCommand(options: { format?: string }): Promise<void> {
  const apiKey = requireApiKey();
  const client = new ApiClient(apiKey);

  try {
    const result = await client.listPrompts({ limit: 50 });

    if (options.format === 'json') {
      console.log(JSON.stringify(result.data, null, 2));
      return;
    }

    if (result.data.length === 0) {
      console.log('No prompts found.');
      return;
    }

    // Table output
    const idWidth    = 38;
    const titleWidth = 30;
    const tagsWidth  = 20;

    const header = [
      'ID'.padEnd(idWidth),
      'Title'.padEnd(titleWidth),
      'Tags'.padEnd(tagsWidth),
    ].join('  ');

    console.log(header);
    console.log('-'.repeat(header.length));

    for (const p of result.data) {
      const row = [
        p.id.padEnd(idWidth),
        p.title.slice(0, titleWidth - 1).padEnd(titleWidth),
        (p.tags ?? []).join(', ').slice(0, tagsWidth - 1).padEnd(tagsWidth),
      ].join('  ');
      console.log(row);
    }

    console.log(`\nTotal: ${result.total}`);
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
