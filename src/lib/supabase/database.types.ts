/**
 * Supabase Database Types
 * Auto-generated types for Supabase tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dao: {
        Row: {
          dao_id: number
          dao_name: string
          dao_content: string | null
          created_at: string
          updated_at: string | null
          start_date: string | null
          end_date: string | null
          dao_type: number | null
          scoring: string | null
          proposal_id: number | null
          id: number | null
          ca_base: string | null
          ca_arb: string | null
          ca_lisk: string | null
          ca_manta: string | null
        }
        Insert: {
          dao_id?: number
          dao_name: string
          dao_content?: string | null
          created_at?: string
          updated_at?: string | null
          start_date?: string | null
          end_date?: string | null
          dao_type?: number | null
          scoring?: string | null
          proposal_id?: number | null
          id?: number | null
          ca_base?: string | null
          ca_arb?: string | null
          ca_lisk?: string | null
          ca_manta?: string | null
        }
        Update: {
          dao_id?: number
          dao_name?: string
          dao_content?: string | null
          created_at?: string
          updated_at?: string | null
          start_date?: string | null
          end_date?: string | null
          dao_type?: number | null
          scoring?: string | null
          proposal_id?: number | null
          id?: number | null
          ca_base?: string | null
          ca_arb?: string | null
          ca_lisk?: string | null
          ca_manta?: string | null
        }
      }
      dao_type: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      proposal: {
        Row: {
          id: number
        }
        Insert: {
          id?: number
        }
        Update: {
          id?: number
        }
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
  }
}

// Convenience types
export type DaoRow = Database['public']['Tables']['dao']['Row']
export type DaoInsert = Database['public']['Tables']['dao']['Insert']
export type DaoUpdate = Database['public']['Tables']['dao']['Update']
export type DaoTypeRow = Database['public']['Tables']['dao_type']['Row']
