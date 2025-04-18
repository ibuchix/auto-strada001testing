
/**
 * Changes made:
 * - 2025-04-18: Updated to use shared logging module
 */

// Import from shared module
import { logOperation as sharedLogOperation, LogLevel } from '../_shared/logging.ts';

// Production environment detection
const isProduction = Deno.env.get("ENVIRONMENT") === "production";

/**
 * Log operations with severity-based details
 */
export function logOperation(operation: string, details: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info'): void {
  // In production, only log warnings and errors with minimal details
  if (isProduction && level === 'info') {
    return;
  }
  
  sharedLogOperation(operation, details, level as LogLevel);
}
