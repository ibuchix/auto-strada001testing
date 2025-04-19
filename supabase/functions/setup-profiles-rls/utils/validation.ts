
/**
 * Validation utilities for setup-profiles-rls
 * Created: 2025-04-19
 */

/**
 * Validates that required environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

