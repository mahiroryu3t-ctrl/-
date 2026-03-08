import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'main_user' | 'supporter';
  partner_id?: string;
  target_weight?: number;
  start_date?: string;
  target_date?: string;
  height?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseRecord {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  partner_steps: number;
  exercises: Array<{
    type: string;
    reps: number;
    notes?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface MealRecord {
  id: string;
  user_id: string;
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
  created_at: string;
  updated_at: string;
}

export interface WeightRecord {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
}

export interface SupportRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: 'like' | 'comment';
  message?: string;
  date: string;
  likes: number;
  liked_by: string[];
  created_at: string;
}

export interface DailyMessage {
  id: string;
  user_id: string;
  date: string;
  message: string;
  created_at: string;
  updated_at: string;
}