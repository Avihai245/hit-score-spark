export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          changes: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          status: string | null
          target_id: string | null
          target_table: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          changes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          status?: string | null
          target_id?: string | null
          target_table: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          changes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          status?: string | null
          target_id?: string | null
          target_table?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "viralize_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          customer_id: string
          ended_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          reason: string | null
          session_token: string
          starts_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          customer_id: string
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          reason?: string | null
          session_token: string
          starts_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          customer_id?: string
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          reason?: string | null
          session_token?: string
          starts_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "viralize_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_impersonation_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "viralize_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      viral_dna_cache: {
        Row: {
          dna: Json
          genre: string
          id: number
          updated_at: string | null
        }
        Insert: {
          dna: Json
          genre: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          dna?: Json
          genre?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      viralize_analyses: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number | null
          full_result: Json | null
          genre: string | null
          goal: string | null
          id: string
          score: number | null
          thumbnail_url: string | null
          title: string | null
          user_id: string | null
          verdict: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          full_result?: Json | null
          genre?: string | null
          goal?: string | null
          id?: string
          score?: number | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string | null
          verdict?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          full_result?: Json | null
          genre?: string | null
          goal?: string | null
          id?: string
          score?: number | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      viralize_credits: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          stripe_payment_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          stripe_payment_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          stripe_payment_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      viralize_remixes: {
        Row: {
          analysis_id: string | null
          audio_url: string | null
          created_at: string | null
          duration: number | null
          genre: string | null
          id: string
          image_url: string | null
          original_title: string | null
          remix_title: string | null
          status: string | null
          suno_task_id: string | null
          user_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          image_url?: string | null
          original_title?: string | null
          remix_title?: string | null
          status?: string | null
          suno_task_id?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          image_url?: string | null
          original_title?: string | null
          remix_title?: string | null
          status?: string | null
          suno_task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viralize_remixes_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "viralize_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      viralize_users: {
        Row: {
          analyses_this_month: number | null
          analyses_used: number | null
          api_key: string | null
          created_at: string | null
          credits: number | null
          display_name: string | null
          email: string
          id: string
          is_admin: boolean | null
          plan: string | null
          plan_expires_at: string | null
          remixes_this_month: number | null
          remixes_used: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          analyses_this_month?: number | null
          analyses_used?: number | null
          api_key?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          plan?: string | null
          plan_expires_at?: string | null
          remixes_this_month?: number | null
          remixes_used?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          analyses_this_month?: number | null
          analyses_used?: number | null
          api_key?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          plan?: string | null
          plan_expires_at?: string | null
          remixes_this_month?: number | null
          remixes_used?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_audit_logs_detailed: {
        Row: {
          action: string | null
          admin_email: string | null
          admin_id: string | null
          changes: Json | null
          created_at: string | null
          error_message: string | null
          id: string | null
          ip_address: unknown
          status: string | null
          target_id: string | null
          target_table: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "viralize_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      validate_impersonation_token: {
        Args: { token: string }
        Returns: {
          admin_id: string
          customer_id: string
          is_valid: boolean
        }[]
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
