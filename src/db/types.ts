export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          plan: string
          preferences: Json
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          plan?: string
          preferences?: Json
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          plan?: string
          preferences?: Json
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      prompt_ratings: {
        Row: {
          created_at: string
          feedback: Json
          id: string
          model_used: string
          overall_score: number
          prompt_id: string
          provider: string
          scores: Json
        }
        Insert: {
          created_at?: string
          feedback: Json
          id?: string
          model_used: string
          overall_score: number
          prompt_id: string
          provider: string
          scores: Json
        }
        Update: {
          created_at?: string
          feedback?: Json
          id?: string
          model_used?: string
          overall_score?: number
          prompt_id?: string
          provider?: string
          scores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prompt_ratings_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_sections: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string
          description_en: string
          icon: string
          id: string
          name: string
          name_en: string
          order_index: number
          placeholder: string | null
          slug: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          description: string
          description_en: string
          icon: string
          id?: string
          name: string
          name_en: string
          order_index: number
          placeholder?: string | null
          slug: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          description_en?: string
          icon?: string
          id?: string
          name?: string
          name_en?: string
          order_index?: number
          placeholder?: string | null
          slug?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          blocks: Json
          content_md: string
          created_at: string
          deleted_at: string | null
          description: string | null
          fork_count: number
          fork_of: string | null
          id: string
          is_public: boolean
          search_vector: unknown
          slug: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          variables: Json
          view_count: number
        }
        Insert: {
          blocks?: Json
          content_md: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fork_count?: number
          fork_of?: string | null
          id?: string
          is_public?: boolean
          search_vector?: unknown
          slug?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          variables?: Json
          view_count?: number
        }
        Update: {
          blocks?: Json
          content_md?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fork_count?: number
          fork_of?: string | null
          id?: string
          is_public?: boolean
          search_vector?: unknown
          slug?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          variables?: Json
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_fork_of_fkey"
            columns: ["fork_of"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_templates: {
        Row: {
          ai_score: number | null
          blocks: Json
          category: string
          content_md: string
          created_at: string
          description: string
          difficulty: string
          fork_count: number
          id: string
          is_featured: boolean
          order_index: number
          search_vector: unknown
          tags: string[]
          title: string
          variables: Json
        }
        Insert: {
          ai_score?: number | null
          blocks?: Json
          category: string
          content_md: string
          created_at?: string
          description: string
          difficulty: string
          fork_count?: number
          id?: string
          is_featured?: boolean
          order_index?: number
          search_vector?: unknown
          tags?: string[]
          title: string
          variables?: Json
        }
        Update: {
          ai_score?: number | null
          blocks?: Json
          category?: string
          content_md?: string
          created_at?: string
          description?: string
          difficulty?: string
          fork_count?: number
          id?: string
          is_featured?: boolean
          order_index?: number
          search_vector?: unknown
          tags?: string[]
          title?: string
          variables?: Json
        }
        Relationships: []
      }
      run_credits: {
        Row: {
          id: string
          user_id: string
          month: string
          used: number
          monthly_limit: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          used?: number
          monthly_limit?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          used?: number
          monthly_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          provider: string
          key_encrypted: string
          key_hint: string
          label: string
          is_active: boolean
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          key_encrypted: string
          key_hint: string
          label?: string
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          key_encrypted?: string
          key_hint?: string
          label?: string
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      run_logs: {
        Row: {
          id: string
          user_id: string
          prompt_id: string | null
          provider: string
          model: string
          key_source: string
          input_tokens: number | null
          output_tokens: number | null
          status: string
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id?: string | null
          provider: string
          model: string
          key_source: string
          input_tokens?: number | null
          output_tokens?: number | null
          status: string
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string | null
          provider?: string
          model?: string
          key_source?: string
          input_tokens?: number | null
          output_tokens?: number | null
          status?: string
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_fork_count: { Args: { prompt_id: string }; Returns: undefined }
      increment_template_fork_count: {
        Args: { template_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { prompt_id: string }; Returns: undefined }
      check_and_increment_run_credits: {
        Args: { p_user_id: string; p_month: string }
        Returns: { allowed: boolean; remaining: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ── Convenience Row aliases ───────────────────────────────────────────────────
// Use these instead of the verbose Tables<"profiles">["Row"] form.
export type Profile = Tables<'profiles'>
export type Prompt = Tables<'prompts'>
export type PromptSection = Tables<'prompt_sections'>
export type SystemTemplate = Tables<'system_templates'>
export type PromptRating = Tables<'prompt_ratings'>

