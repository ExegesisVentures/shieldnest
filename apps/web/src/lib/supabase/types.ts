// apps/web/src/lib/supabase/types.ts
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
      public_users: {
        Row: {
          id: string
          email: string | null
          notify_opt_in: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          notify_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          notify_opt_in?: boolean
          updated_at?: string
        }
      }
      private_users: {
        Row: {
          id: string
          public_user_id: string
          pma_status: 'none' | 'pending' | 'signed'
          pma_pdf_url: string | null
          pma_hash_onchain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          public_user_id: string
          pma_status?: 'none' | 'pending' | 'signed'
          pma_pdf_url?: string | null
          pma_hash_onchain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pma_status?: 'none' | 'pending' | 'signed'
          pma_pdf_url?: string | null
          pma_hash_onchain?: string | null
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          chain_id: string
          address: string
          label: string | null
          read_only: boolean
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chain_id: string
          address: string
          label?: string | null
          read_only?: boolean
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string | null
          read_only?: boolean
          is_primary?: boolean
        }
      }
      portfolio_addresses: {
        Row: {
          id: string
          user_id: string
          chain_id: string
          address: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chain_id: string
          address: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          label?: string | null
        }
      }
      nft_holdings_cache: {
        Row: {
          id: string
          user_id: string
          contract: string
          token_class: string | null
          balance: number
          metadata: Json | null
          last_checked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contract: string
          token_class?: string | null
          balance?: number
          metadata?: Json | null
          last_checked_at?: string
          created_at?: string
        }
        Update: {
          balance?: number
          metadata?: Json | null
          last_checked_at?: string
        }
      }
      pma_agreements: {
        Row: {
          id: string
          user_id: string
          pdf_url: string
          hash: string
          signed_at: string
          signature_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pdf_url: string
          hash: string
          signed_at?: string
          signature_metadata?: Json | null
          created_at?: string
        }
        Update: {
          signature_metadata?: Json | null
        }
      }
      tokens: {
        Row: {
          symbol: string
          denom: string
          decimals: number
          logo_url: string | null
          source: string
          last_updated_at: string
          created_at: string
        }
        Insert: {
          symbol: string
          denom: string
          decimals?: number
          logo_url?: string | null
          source?: string
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          decimals?: number
          logo_url?: string | null
          source?: string
          last_updated_at?: string
        }
      }
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string
          total_value_usd: number
          snapshot_at: string
          breakdown: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_value_usd?: number
          snapshot_at?: string
          breakdown?: Json | null
          created_at?: string
        }
        Update: {
          total_value_usd?: number
          breakdown?: Json | null
        }
      }
      shield_settings: {
        Row: {
          id: number
          image_url: string
          min_usd: number
          max_usd: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: number
          image_url?: string
          min_usd?: number
          max_usd?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          image_url?: string
          min_usd?: number
          max_usd?: number
          updated_at?: string
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
      pma_status_enum: 'none' | 'pending' | 'signed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type PublicUser = Database['public']['Tables']['public_users']['Row'];
export type PrivateUser = Database['public']['Tables']['private_users']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type PortfolioAddress = Database['public']['Tables']['portfolio_addresses']['Row'];
export type NftHolding = Database['public']['Tables']['nft_holdings_cache']['Row'];
export type PmaAgreement = Database['public']['Tables']['pma_agreements']['Row'];
export type Token = Database['public']['Tables']['tokens']['Row'];
export type PortfolioSnapshot = Database['public']['Tables']['portfolio_snapshots']['Row'];
export type ShieldSettings = Database['public']['Tables']['shield_settings']['Row'];
