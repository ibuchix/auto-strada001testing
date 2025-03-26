
/**
 * Transaction logger service for tracking transaction events
 * 
 * Changes made:
 * - 2024-10-25: Standardized error property to use errorDetails instead of error
 * - 2024-12-05: Fixed type instantiation issue in log entries
 * - 2024-12-12: Resolved deep type instantiation with explicit interface typing
 * - 2025-05-16: Enhanced type safety with dedicated interfaces for DB records
 * - 2025-05-17: Fixed Json type incompatibility with Record<string, any>
 * - 2027-08-01: Further improved type safety to prevent excessive type instantiation
 */

import { supabase } from "@/integrations/supabase/client";
import { TransactionMetadata, TransactionDetails } from "./types";

// Type for system log entry to prevent deep instantiation
interface SystemLogEntry {
  log_type: string;
  message: string;
  details: Record<string, any>;
  correlation_id: string;
}

// Interface for database response to avoid excessive type recursion
interface SystemLogRecord {
  correlation_id: string;
  created_at: string;
  details: Record<string, any>;
  id: string;
  log_type: string;
  message: string;
  error_message?: string;
}

// Create a new transaction logger instance
export const transactionLoggerService = {
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      // Create a properly typed system log entry
      const logEntry: SystemLogEntry = {
        log_type: 'transaction',
        message: transaction.operation || 'Unknown operation',
        details: {
          transaction_id: transaction.id,
          operation: transaction.operation,
          type: transaction.type,
          entity_id: transaction.entityId,
          entity_type: transaction.entityType,
          status: transaction.status,
          start_time: transaction.startTime,
          end_time: transaction.endTime,
          error_details: transaction.errorDetails,
          metadata: transaction.metadata,
          user_id: transaction.userId
        },
        correlation_id: transaction.id
      };

      // Use system_logs table instead of transaction_logs
      const { error } = await supabase
        .from('system_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log transaction:', error);
      }
    } catch (e) {
      console.error('Transaction logging error:', e);
    }
  },

  async getTransactionHistory(userId: string, limit = 20): Promise<TransactionDetails[]> {
    try {
      // Fetch from system_logs with transaction type
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('log_type', 'transaction')
        .eq('details->user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch transaction history:', error);
        return [];
      }

      // Use explicit typecasting to avoid deep instantiation
      return (data || []).map((log: any) => {
        const details = log.details || {};
        
        return {
          id: log.correlation_id || '',
          operation: details.operation || '',
          type: details.type || 'OTHER',
          status: details.status || 'ERROR',
          entityId: details.entity_id || null,
          entityType: details.entity_type || null,
          startTime: details.start_time || log.created_at,
          endTime: details.end_time || null,
          errorDetails: details.error_details || null,
          metadata: details.metadata || null,
          userId: details.user_id || null
        };
      });
    } catch (e) {
      console.error('Error fetching transaction history:', e);
      return [];
    }
  }
};

// Export for use in other files
export const transactionLogger = transactionLoggerService;
