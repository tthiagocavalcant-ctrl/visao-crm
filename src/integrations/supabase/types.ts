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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          api_key: string | null
          created_at: string | null
          email: string
          evolution_instance: string | null
          evolution_key: string | null
          evolution_url: string | null
          facebook_pixel: string | null
          followup_webhook: string | null
          google_ads_tag: string | null
          id: string
          logo_url: string | null
          max_users: number | null
          n8n_webhook: string | null
          name: string
          permissions: Json | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          responsible_name: string | null
          sale_webhook: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          timezone: string | null
          whatsapp_link: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          email: string
          evolution_instance?: string | null
          evolution_key?: string | null
          evolution_url?: string | null
          facebook_pixel?: string | null
          followup_webhook?: string | null
          google_ads_tag?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          n8n_webhook?: string | null
          name: string
          permissions?: Json | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          responsible_name?: string | null
          sale_webhook?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          timezone?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          email?: string
          evolution_instance?: string | null
          evolution_key?: string | null
          evolution_url?: string | null
          facebook_pixel?: string | null
          followup_webhook?: string | null
          google_ads_tag?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          n8n_webhook?: string | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          responsible_name?: string | null
          sale_webhook?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          timezone?: string | null
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          account_id: string
          assigned_to: string | null
          contact_avatar_url: string | null
          contact_name: string
          contact_phone: string
          created_at: string | null
          id: string
          is_online: boolean | null
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          unread_count: number | null
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          contact_avatar_url?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          unread_count?: number | null
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          contact_avatar_url?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_configs: {
        Row: {
          account_id: string
          active: boolean
          created_at: string | null
          id: string
          pipeline_status: string
        }
        Insert: {
          account_id: string
          active?: boolean
          created_at?: string | null
          id?: string
          pipeline_status: string
        }
        Update: {
          account_id?: string
          active?: boolean
          created_at?: string | null
          id?: string
          pipeline_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_configs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_messages: {
        Row: {
          account_id: string
          created_at: string | null
          delay_minutes: number
          followup_config_id: string
          id: string
          media_type: string | null
          media_url: string | null
          message: string
          position: number | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          delay_minutes?: number
          followup_config_id: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string
          position?: number | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          delay_minutes?: number
          followup_config_id?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_messages_followup_config_id_fkey"
            columns: ["followup_config_id"]
            isOneToOne: false
            referencedRelation: "followup_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          lead_id: string
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          lead_id: string
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          lead_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          account_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          account_id: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reminders: {
        Row: {
          account_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          scheduled_at: string
          status: string
          type: string
        }
        Insert: {
          account_id: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          scheduled_at: string
          status?: string
          type?: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          scheduled_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_reminders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          account_id: string
          canal: Database["public"]["Enums"]["lead_canal"] | null
          cargo: string | null
          created_at: string | null
          email: string | null
          empresa: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          pipeline_status: string
          scheduled_at: string | null
          tags: string[] | null
          temperature: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          canal?: Database["public"]["Enums"]["lead_canal"] | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          pipeline_status?: string
          scheduled_at?: string | null
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          canal?: Database["public"]["Enums"]["lead_canal"] | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          pipeline_status?: string
          scheduled_at?: string | null
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          account_id: string
          content: string
          conversation_id: string
          created_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_url: string | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          sent_by: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id: string | null
        }
        Insert: {
          account_id: string
          content: string
          conversation_id: string
          created_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id?: string | null
        }
        Update: {
          account_id?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_statuses: {
        Row: {
          account_id: string
          color: string
          created_at: string | null
          id: string
          name: string
          position: number | null
          slug: string
          visible: boolean | null
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          slug: string
          visible?: boolean | null
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          slug?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_statuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_id: string | null
          active: boolean | null
          cargo: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          cargo?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          completed_tasks: number | null
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"] | null
          total_tasks: number | null
        }
        Insert: {
          account_id: string
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"] | null
          total_tasks?: number | null
        }
        Update: {
          account_id?: string
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          total_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_categories: {
        Row: {
          account_id: string
          color: string
          created_at: string | null
          id: string
          name: string
          position: number | null
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "script_categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          account_id: string
          category_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          media_type: string | null
          media_url: string | null
          position: number | null
          title: string
        }
        Insert: {
          account_id: string
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          media_type?: string | null
          media_url?: string | null
          position?: number | null
          title: string
        }
        Update: {
          account_id?: string
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          media_type?: string | null
          media_url?: string | null
          position?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "script_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activities: {
        Row: {
          action: string
          created_at: string | null
          description: string
          id: string
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          id?: string
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          id?: string
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          account_id: string
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          account_id: string
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          responsible: string | null
          state: string | null
          status: Database["public"]["Enums"]["account_status"] | null
        }
        Insert: {
          account_id: string
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
        }
        Update: {
          account_id?: string
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "units_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_account_id: { Args: never; Returns: string }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      account_status: "active" | "inactive"
      conversation_status: "active" | "archived" | "blocked"
      lead_canal:
        | "whatsapp"
        | "instagram"
        | "trafego_pago"
        | "google"
        | "facebook"
        | "indicacao"
        | "outro"
      lead_temperature: "frio" | "morno" | "quente"
      message_direction: "inbound" | "outbound"
      message_status: "sent" | "delivered" | "read"
      message_type: "text" | "image" | "audio" | "document" | "system"
      plan_type: "basico" | "profissional" | "enterprise"
      project_status: "active" | "completed" | "archived"
      task_priority: "alta" | "media" | "baixa"
      task_status: "a_fazer" | "em_andamento" | "concluido"
      user_role: "ADMIN_GERAL" | "ADMIN" | "FUNCIONARIO"
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
    Enums: {
      account_status: ["active", "inactive"],
      conversation_status: ["active", "archived", "blocked"],
      lead_canal: [
        "whatsapp",
        "instagram",
        "trafego_pago",
        "google",
        "facebook",
        "indicacao",
        "outro",
      ],
      lead_temperature: ["frio", "morno", "quente"],
      message_direction: ["inbound", "outbound"],
      message_status: ["sent", "delivered", "read"],
      message_type: ["text", "image", "audio", "document", "system"],
      plan_type: ["basico", "profissional", "enterprise"],
      project_status: ["active", "completed", "archived"],
      task_priority: ["alta", "media", "baixa"],
      task_status: ["a_fazer", "em_andamento", "concluido"],
      user_role: ["ADMIN_GERAL", "ADMIN", "FUNCIONARIO"],
    },
  },
} as const
