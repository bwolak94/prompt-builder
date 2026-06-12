import { loadConfig } from './config.js';

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  content_md: string;
  blocks: unknown[];
  tags: string[];
  is_public: boolean;
  updated_at: string;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl?: string) {
    const config = loadConfig();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl ?? config.baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'promptbase-cli/1.0.0',
        ...options.headers,
      },
    });

    if (res.status === 401) {
      throw new Error('Invalid or expired API key. Run: npx promptbase login --key pb_live_...');
    }
    if (res.status === 429) {
      throw new Error('Rate limit exceeded. Resets at midnight UTC.');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
      throw new Error(`API error ${res.status}: ${body.error}`);
    }

    const json = await res.json() as { data: T };
    return json.data;
  }

  async listPrompts(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Prompt[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.page)   params.set('page', String(options.page));
    if (options?.limit)  params.set('limit', String(options.limit));
    if (options?.search) params.set('search', options.search);
    return this.request<{ data: Prompt[]; total: number }>(`/prompts?${params}`);
  }

  async getPrompt(id: string, env?: string): Promise<Prompt> {
    const q = env ? `?env=${env}` : '';
    return this.request<Prompt>(`/prompts/${id}${q}`);
  }

  async createPrompt(data: Partial<Prompt>): Promise<Prompt> {
    return this.request<Prompt>('/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePrompt(id: string, data: Partial<Prompt>): Promise<Prompt> {
    return this.request<Prompt>(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ id: string; display_name: string; plan: string; stats: Record<string, number> }> {
    return this.request('/me');
  }
}
