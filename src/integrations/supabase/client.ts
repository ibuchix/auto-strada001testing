import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdvakfhmoaoucmhbhwvy.supabase.co';
// Replace the text between the quotes with your anon key from your Supabase dashboard
const supabaseAnonKey = 'PASTE_YOUR_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});