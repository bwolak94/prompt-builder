import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { ApiClient, type Prompt } from '../lib/api-client.js';
import { requireApiKey } from '../lib/config.js';
import { parsePromptFile, serializePromptFile, writePromptFile } from '../lib/file-parser.js';

interface Change {
  type: 'pull' | 'push' | 'skip';
  filePath: string;
  prompt?: Partial<Prompt>;
  reason: string;
}

async function computeChanges(
  client: ApiClient,
  directory: string,
): Promise<{ localFiles: Map<string, { filePath: string; frontmatter: { id?: string; title: string } }>; remotePrompts: Map<string, Prompt>; changes: Change[] }> {
  // Get all .md files
  const files = readdirSync(directory)
    .filter((f) => extname(f) === '.md')
    .map((f) => join(directory, f));

  const localFiles = new Map<string, { filePath: string; frontmatter: { id?: string; title: string } }>();
  for (const fp of files) {
    try {
      const { frontmatter } = parsePromptFile(fp);
      if (frontmatter.id) {
        localFiles.set(frontmatter.id, { filePath: fp, frontmatter });
      }
    } catch {
      // skip invalid files
    }
  }

  // Get remote prompts
  const result = await client.listPrompts({ limit: 100 });
  const remotePrompts = new Map<string, Prompt>(result.data.map((p) => [p.id, p]));

  const changes: Change[] = [];

  // Check local vs remote
  for (const [id, local] of localFiles) {
    const remote = remotePrompts.get(id);
    if (remote) {
      changes.push({ type: 'skip', filePath: local.filePath, reason: 'up to date' });
    }
  }

  // New local files (no id in frontmatter)
  for (const fp of files) {
    try {
      const { frontmatter } = parsePromptFile(fp);
      if (!frontmatter.id) {
        changes.push({ type: 'push', filePath: fp, reason: 'new local file' });
      }
    } catch {
      // skip
    }
  }

  // Remote prompts not in local
  for (const [id, remote] of remotePrompts) {
    if (!localFiles.has(id)) {
      const slug = remote.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      changes.push({
        type: 'pull',
        filePath: join(directory, `${slug}.md`),
        prompt: remote,
        reason: 'remote only',
      });
    }
  }

  return { localFiles, remotePrompts, changes };
}

export async function syncCommand(
  directory: string,
  options: { watch?: boolean; env?: string; dryRun?: boolean },
): Promise<void> {
  const apiKey = requireApiKey();
  const client = new ApiClient(apiKey);
  const env = options.env ?? 'dev';

  console.log('Analyzing changes...');

  try {
    const { changes } = await computeChanges(client, directory);

    const toPull = changes.filter((c) => c.type === 'pull');
    const toPush = changes.filter((c) => c.type === 'push');
    const toSkip = changes.filter((c) => c.type === 'skip');

    for (const c of toPull) {
      console.log(`  ↓ pull  ${basename(c.filePath)}`);
    }
    for (const c of toPush) {
      console.log(`  ↑ push  ${basename(c.filePath)}`);
    }
    for (const c of toSkip) {
      console.log(`  ✓ skip  ${basename(c.filePath)}`);
    }

    if (toPull.length === 0 && toPush.length === 0) {
      console.log('\nEverything up to date.');
      return;
    }

    if (options.dryRun) {
      console.log(`\nDry run: ${toPull.length + toPush.length} changes would be applied.`);
      return;
    }

    // Apply changes
    for (const c of toPull) {
      if (c.prompt) {
        const content = serializePromptFile(c.prompt as Prompt, env);
        writePromptFile(c.filePath, content);
        console.log(`  ✓ pulled ${basename(c.filePath)}`);
      }
    }

    for (const c of toPush) {
      const { frontmatter, content } = parsePromptFile(c.filePath);
      const promptData = {
        title: frontmatter.title,
        content_md: content,
        tags: frontmatter.tags ?? [],
        is_public: frontmatter.is_public ?? false,
        blocks: [{ id: 'main', section_slug: 'task', content, order_index: 0 }],
      };
      const created = await client.createPrompt(promptData);
      const updated = serializePromptFile(created, env);
      writePromptFile(c.filePath, updated);
      console.log(`  ✓ pushed ${basename(c.filePath)} (id: ${created.id})`);
    }

    console.log('\n✓ Sync complete');
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
