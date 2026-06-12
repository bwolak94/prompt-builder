import matter from 'gray-matter';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Prompt } from './api-client.js';

export interface PromptFrontmatter {
  id?: string;
  title: string;
  description?: string;
  tags?: string[];
  is_public?: boolean;
  env?: string;
  version?: number;
}

export interface PromptFile {
  frontmatter: PromptFrontmatter;
  content: string;
}

export function parsePromptFile(filePath: string): PromptFile {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { frontmatter: data as unknown as PromptFrontmatter, content };
}

export function serializePromptFile(prompt: Prompt, env?: string): string {
  return matter.stringify(prompt.content_md, {
    id: prompt.id,
    title: prompt.title,
    ...(prompt.description && { description: prompt.description }),
    tags: prompt.tags,
    is_public: prompt.is_public,
    env: env ?? 'dev',
  });
}

export function writePromptFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}
