import { ApiClient } from '../lib/api-client.js';
import { requireApiKey } from '../lib/config.js';
import { parsePromptFile, serializePromptFile, writePromptFile } from '../lib/file-parser.js';

export async function pushCommand(
  filePath: string,
  options: { env?: string },
): Promise<void> {
  const apiKey = requireApiKey();
  const client = new ApiClient(apiKey);

  try {
    const { frontmatter, content } = parsePromptFile(filePath);

    if (!frontmatter.title) {
      console.error('✗ Missing "title" in frontmatter');
      process.exit(1);
    }

    const promptData = {
      title: frontmatter.title,
      description: frontmatter.description,
      content_md: content,
      tags: frontmatter.tags ?? [],
      is_public: frontmatter.is_public ?? false,
      blocks: [{ id: 'main', section_slug: 'task', content, order_index: 0 }],
    };

    let result;
    if (frontmatter.id) {
      // Update existing
      result = await client.updatePrompt(frontmatter.id, promptData);
      console.log(`✓ Updated prompt "${result.title}" (id: ${result.id})`);
    } else {
      // Create new
      result = await client.createPrompt(promptData);
      // Write back the id to the file
      const updated = serializePromptFile(result, options.env ?? 'dev');
      writePromptFile(filePath, updated);
      console.log(`✓ Created prompt "${result.title}" (id: ${result.id})`);
    }
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
