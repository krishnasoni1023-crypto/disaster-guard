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
      alert_responses: {
        Row: {
          alert_id: string
          created_at: string
          id: number
          response: Database["public"]["Enums"]["response_type"]
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: number
          response: Database["public"]["Enums"]["response_type"]
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: number
          response?: Database["public"]["Enums"]["response_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_responses_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          location: string
          message: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          message: string
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          message?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhaar: string | null
          address: string | null
          avatar_url: string | null
          full_name: string | null
          id: string
          mobile: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar?: string | null
          address?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id: string
          mobile?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar?: string | null
          address?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address: string | null
          created_at: string
          description: string
          hashtags: string | null
          id: string
          lat: number
          lng: number
          media_url: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          type: Database["public"]["Enums"]["report_type"]
          user_id: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          created_at?: string
          description: string
          hashtags?: string | null
          id?: string
          lat: number
          lng: number
          media_url?: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          type: Database["public"]["Enums"]["report_type"]
          user_id: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string
          hashtags?: string | null
          id?: string
          lat?: number
          lng?: number
          media_url?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          type?: Database["public"]["Enums"]["report_type"]
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          address: string
          capacity: number
          contact: string | null
          created_at: string
          current_occupancy: number
          facilities: string[] | null
          id: string
          lat: number
          lng: number
          name: string
        }
        Insert: {
          address: string
          capacity?: number
          contact?: string | null
          created_at?: string
          current_occupancy?: number
          facilities?: string[] | null
          id?: string
          lat: number
          lng: number
          name: string
        }
        Update: {
          address?: string
          capacity?: number
          contact?: string | null
          created_at?: string
          current_occupancy?: number
          facilities?: string[] | null
          id?: string
          lat?: number
          lng?: number
          name?: string
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
      report_type:
        | "flood"
        | "storm"
        | "earthquake"
        | "fire"
        | "landslide"
        | "other"
      response_type: "yes" | "no"
      severity_level: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
