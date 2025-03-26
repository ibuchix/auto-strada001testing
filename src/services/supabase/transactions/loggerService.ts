
/**
 * Transaction logger service for tracking transaction events
 */

import { supabase } from "@/integrations/supabase/client";
import { TransactionMetadata, TransactionDetails } from "./types";

// Create a new transaction logger instance
export const transactionLoggerService = {
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      // Use system_logs table instead of transaction_logs
      const { error } = await supabase
        .from('system_logs')
        .insert({
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
            error_details: transaction.error,
            metadata: transaction.metadata,
            user_id: transaction.userId
          },
          correlation_id: transaction.id
        });

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

      // Map the system logs to transaction details format
      return (data || []).map((log: any) => {
        const details = log.details || {};
        
        return {
          id: log.correlation_id || '',
          operation: details.operation || '',
          type: details.type || 'GENERAL',
          status: details.status || 'ERROR',
          entityId: details.entity_id || null,
          entityType: details.entity_type || null,
          startTime: details.start_time || log.created_at,
          endTime: details.end_time || null,
          error: details.error_details || null,
          metadata: details.metadata || null,
          userId: details.user_id || null,
          timestamp: log.created_at
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
