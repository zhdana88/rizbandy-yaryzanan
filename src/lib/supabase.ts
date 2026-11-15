import {createClient} from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      app_admins: {
        Row: {user_id: string};
        Insert: {user_id: string};
        Update: {user_id?: string};
        Relationships: [];
      };
      app_state: {
        Row: {id: string; state: Json; updated_at: string};
        Insert: {id: string; state: Json; updated_at?: string};
        Update: {id?: string; state?: Json; updated_at?: string};
        Relationships: [];
      };
    };
    Views: {[_ in never]: never};
    Functions: {[_ in never]: never};
    Enums: {[_ in never]: never};
    CompositeTypes: {[_ in never]: never};
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function getSupabaseSetupError(): string | null {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  return missing.length > 0
    ? `Missing required deployment settings: ${missing.join(', ')}`
    : null;
}
