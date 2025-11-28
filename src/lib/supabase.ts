import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
// À remplacer avec vos vraies valeurs depuis le dashboard Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
