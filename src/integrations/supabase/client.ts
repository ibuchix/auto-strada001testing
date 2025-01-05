import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdvakfhmoaoucmhbhwvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ0MDI5NzcsImV4cCI6MjAxOTk3ODk3N30.OkqDhXF6enzE3QSTtGNkL8yWXMVWw0-F77i3-IRuQXk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});