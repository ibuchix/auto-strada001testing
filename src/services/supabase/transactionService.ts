/**
 * Changes made:
 * - 2024-10-16: Created transaction service for reliable Supabase operations tracking and confirmation
 * - 2024-10-24: Fixed type issues with audit log entries and Date objects
 * - 2024-10-25: Fixed Date object serialization for database inserts
 * - 2024-10-27: Fixed type mismatch with audit_logs action field and user_id property
 * - 2024-10-28: Refactored into smaller files, this file now re-exports from new location
 * - Updated TransactionStatus type to handle string comparison
 */

// Re-export everything from the new location for backward compatibility
export * from './transactions';

// Provide the main service as default export
import { transactionService } from './transactions';
export default transactionService;

// Add or update existing code
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'ERROR' | 'WARNING';
