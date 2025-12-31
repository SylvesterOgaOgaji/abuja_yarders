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
      bid_notifications: {
        Row: {
          bid_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_notifications_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_offers: {
        Row: {
          bid_id: string
          created_at: string
          id: string
          offer_amount: number
          user_id: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          id?: string
          offer_amount: number
          user_id: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          id?: string
          offer_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_offers_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          created_at: string
          current_price: number
          ends_at: string
          group_id: string
          id: string
          item_description: string | null
          item_image_url: string | null
          item_name: string
          payment_deadline: string | null
          starting_price: number
          status: string
          updated_at: string
          user_id: string
          verification_status: string | null
          verification_url: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_price?: number
          ends_at: string
          group_id: string
          id?: string
          item_description?: string | null
          item_image_url?: string | null
          item_name: string
          payment_deadline?: string | null
          starting_price?: number
          status?: string
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verification_url?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_price?: number
          ends_at?: string
          group_id?: string
          id?: string
          item_description?: string | null
          item_image_url?: string | null
          item_name?: string
          payment_deadline?: string | null
          starting_price?: number
          status?: string
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verification_url?: string | null
          winner_id?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_content: {
        Row: {
          key: string
          value: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exco_members: {
        Row: {
          id: string
          name: string
          role: string
          image_url: string | null
          bio: string | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          image_url?: string | null
          bio?: string | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          image_url?: string | null
          bio?: string | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
          area_council: string | null
          is_active: boolean | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          area_council?: string | null
          is_active?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          area_council?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      media_uploads: {
        Row: {
          file_url: string
          group_id: string
          id: string
          media_type: string
          message_id: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_url: string
          group_id: string
          id?: string
          media_type: string
          message_id?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_url?: string
          group_id?: string
          id?: string
          media_type?: string
          message_id?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_council: string | null
          avatar_url: string | null
          birth_day: number | null
          birth_month: number | null
          created_at: string
          currency: string
          full_name: string
          id: string
          is_banned: boolean
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          town: string | null
          updated_at: string
          years_in_yard: string | null
        }
        Insert: {
          area_council?: string | null
          avatar_url?: string | null
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          currency?: string
          full_name: string
          id: string
          is_banned?: boolean | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          town?: string | null
          updated_at?: string
          years_in_yard?: string | null
        }
        Update: {
          area_council?: string | null
          avatar_url?: string | null
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          currency?: string
          full_name?: string
          id?: string
          is_banned?: boolean | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          town?: string | null
          updated_at?: string
          years_in_yard?: string | null
        }
        Relationships: []
      }
      seller_requests: {
        Row: {
          admin_message: string | null
          admin_message_sent_at: string | null
          created_at: string
          id: string
          photo_url: string | null
          request_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          vnin_share_code: string | null
        }
        Insert: {
          admin_message?: string | null
          admin_message_sent_at?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          request_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          vnin_share_code?: string | null
        }
        Update: {
          admin_message?: string | null
          admin_message_sent_at?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          request_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          vnin_share_code?: string | null
        }
        Relationships: []
      }
      support_calls: {
        Row: {
          category: "financial" | "medical" | "volunteering" | "other"
          contact_info: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          raised_amount: number | null
          target_amount: number | null
          title: string
          urgency: "low" | "medium" | "high" | "critical"
        }
        Insert: {
          category?: "financial" | "medical" | "volunteering" | "other"
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          raised_amount?: number | null
          target_amount?: number | null
          title: string
          urgency?: "low" | "medium" | "high" | "critical"
        }
        Update: {
          category?: "financial" | "medical" | "volunteering" | "other"
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          raised_amount?: number | null
          target_amount?: number | null
          title?: string
          urgency?: "low" | "medium" | "high" | "critical"
        }
        Relationships: [
          {
            foreignKeyName: "support_calls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      user_commitments: {
        Row: {
          amount_paid: number
          amount_pledged: number
          commitment_type: string
          created_at: string
          description: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          amount_pledged?: number
          commitment_type?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          amount_pledged?: number
          commitment_type?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_commitments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_group_name_for_town: { Args: { town_name: string }; Returns: string }
      get_user_media_count_today: {
        Args: { p_media_type: string; p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_subadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "seller" | "buyer" | "sub_admin"
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
      app_role: ["admin", "user", "seller", "buyer", "sub_admin"],
    },
  },
} as const
