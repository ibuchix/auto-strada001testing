
/**
 * Supabase Client
 * Created: 2025-05-03
 * Updated: 2025-05-02 - Fixed missing URL and key error handling
 * 
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with proper error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sdvakfhmoaoucmhbhwvy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M';

// Validate configuration before client creation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Make sure environment variables are set correctly.',
    { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey }
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Log initialization status
console.log('Supabase client initialized with URL:', 
  supabaseUrl.substring(0, 15) + '...'
);

