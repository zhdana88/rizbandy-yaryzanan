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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabase = getSupabaseSetupError()
  ? null
  : createClient<Database>(supabaseUrl, supabaseAnonKey);

export function getSupabaseSetupError(): string | null {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  if (missing.length > 0) {
    return `Missing required deployment settings: ${missing.join(', ')}`;
  }

  try {
    const url = new URL(supabaseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      return 'VITE_SUPABASE_URL must be a valid HTTP or HTTPS URL.';
    }
  } catch {
    return 'VITE_SUPABASE_URL must be a valid HTTP or HTTPS URL.';
  }

  if (/(?:your[-_ ]?project|placeholder|example\.com|لینکەکە)/i.test(supabaseUrl)) {
    return 'Replace the placeholder VITE_SUPABASE_URL with your Supabase project URL.';
  }

  if (/(?:your[-_ ]|placeholder|example|کلیلی)/i.test(supabaseAnonKey)) {
    return 'Replace the placeholder VITE_SUPABASE_ANON_KEY with your public anon or publishable key.';
  }

  return null;
}
