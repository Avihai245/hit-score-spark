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
          created_at: string | null
          credits: number | null
          email: string
          id: string
          is_admin: boolean | null
          plan: string | null
          plan_expires_at: string | null
          remixes_this_month: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          analyses_this_month?: number | null
          analyses_used?: number | null
          created_at?: string | null
          credits?: number | null
          email: string
          id: string
          is_admin?: boolean | null
          plan?: string | null
          plan_expires_at?: string | null
          remixes_this_month?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          analyses_this_month?: number | null
          analyses_used?: number | null
          created_at?: string | null
          credits?: number | null
          email?: string
          id?: string
          is_admin?: boolean | null
          plan?: string | null
          plan_expires_at?: string | null
          remixes_this_month?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
