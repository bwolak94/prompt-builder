/**
 * Database type definitions for Supabase.
 *
 * This file is a placeholder that mirrors the schema from 04-database.md.
 * Replace the full contents by running:
 *   pnpm db:types
 * which executes: supabase gen types typescript --local > src/db/types.ts
 */

// ── JSONB shapes used in prompt blocks / variables ───────────────────────────

export interface PromptBlock {
  id: string;
  section_slug: string;
  content: string;
  order_index: number;
}

export interface PromptVariable {
  name: string;
  label: string;
  defaultValue: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
}

export interface ScoreDimension {
  score: number;
  comment: string;
  suggestions: string[];
}

export interface AIScoreFeedback {
  clarity: ScoreDimension;
  specificity: ScoreDimension;
  structure: ScoreDimension;
  tone: ScoreDimension;
  completeness: ScoreDimension;
}

export interface AIScores {
  clarity: number;
  specificity: number;
  structure: number;
  tone: number;
  completeness: number;
}

export interface UserPreferences {
  defaultModel: 'openai' | 'anthropic';
  language: 'pl' | 'en';
}

// ── Supabase Database type (auto-generated stub) ─────────────────────────────
// Run `pnpm db:types` to replace this with the generated version.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          preferences: UserPreferences;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: UserPreferences;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: UserPreferences;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_sections: {
        Row: {
          id: string;
          name: string;
          name_en: string;
          slug: string;
          description: string;
          description_en: string;
          icon: string;
          color: string;
          placeholder: string | null;
          order_index: number;
          category: 'core' | 'optional' | 'advanced';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en: string;
          slug: string;
          description: string;
          description_en: string;
          icon: string;
          color: string;
          placeholder?: string | null;
          order_index: number;
          category: 'core' | 'optional' | 'advanced';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string;
          slug?: string;
          description?: string;
          description_en?: string;
          icon?: string;
          color?: string;
          placeholder?: string | null;
          order_index?: number;
          category?: 'core' | 'optional' | 'advanced';
          created_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          content_md: string;
          blocks: PromptBlock[];
          variables: PromptVariable[];
          tags: string[];
          is_public: boolean;
          slug: string | null;
          fork_of: string | null;
          deleted_at: string | null;
          view_count: number;
          fork_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          content_md: string;
          blocks?: PromptBlock[];
          variables?: PromptVariable[];
          tags?: string[];
          is_public?: boolean;
          slug?: string | null;
          fork_of?: string | null;
          deleted_at?: string | null;
          view_count?: number;
          fork_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          content_md?: string;
          blocks?: PromptBlock[];
          variables?: PromptVariable[];
          tags?: string[];
          is_public?: boolean;
          slug?: string | null;
          fork_of?: string | null;
          deleted_at?: string | null;
          view_count?: number;
          fork_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          content_md: string;
          blocks: PromptBlock[];
          variables: PromptVariable[];
          tags: string[];
          category: 'coding' | 'writing' | 'analysis' | 'roleplay';
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          ai_score: number | null;
          fork_count: number;
          order_index: number;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          content_md: string;
          blocks?: PromptBlock[];
          variables?: PromptVariable[];
          tags?: string[];
          category: 'coding' | 'writing' | 'analysis' | 'roleplay';
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          ai_score?: number | null;
          fork_count?: number;
          order_index?: number;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          content_md?: string;
          blocks?: PromptBlock[];
          variables?: PromptVariable[];
          tags?: string[];
          category?: 'coding' | 'writing' | 'analysis' | 'roleplay';
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          ai_score?: number | null;
          fork_count?: number;
          order_index?: number;
          is_featured?: boolean;
          created_at?: string;
        };
      };
      prompt_ratings: {
        Row: {
          id: string;
          prompt_id: string;
          overall_score: number;
          scores: AIScores;
          feedback: AIScoreFeedback;
          model_used: string;
          provider: 'openai' | 'anthropic';
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          overall_score: number;
          scores: AIScores;
          feedback: AIScoreFeedback;
          model_used: string;
          provider: 'openai' | 'anthropic';
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          overall_score?: number;
          scores?: AIScores;
          feedback?: AIScoreFeedback;
          model_used?: string;
          provider?: 'openai' | 'anthropic';
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_view_count: {
        Args: { prompt_id: string };
        Returns: void;
      };
      increment_fork_count: {
        Args: { prompt_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
