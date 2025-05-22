
/**
 * Supabase transaction service index
 * Created: 2025-07-18
 * Updated: 2025-05-25 - Fixed exports and ensured correct implementations
 * Updated: 2025-05-27 - Updated exports to include AuditLogAction type
 * Updated: 2025-05-28 - Ensured all exports are properly typed
 * Updated: 2025-05-29 - Updated AuditLogAction export to match database-compatible type
 * Updated: 2025-05-30 - Fixed export of AuditLogAction to ensure type safety
 * Updated: 2025-05-31 - Added proper export for transactionLogger
 */

// Re-export transaction types
export { TransactionStatus, TransactionType } from './types';
export type { TransactionOptions, TransactionDetails, AuditLogAction } from './types';

// Export transaction service singleton
export { transactionService } from './transactionService';

// Export logger service
export { transactionLogger } from './loggerService';
