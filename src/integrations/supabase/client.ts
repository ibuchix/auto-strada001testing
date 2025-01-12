import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdvakfhmoaoucmhbhwvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUwNzg5NzAsImV4cCI6MjAyMDY1NDk3MH0.FInynnxxzlgQyYYkGlW9_GD_ggcZNM5hHxj7FFtlG44';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});