
/**
 * Updated logger service to use system_logs table instead of transaction_logs
 */

import { supabase } from "@/integrations/supabase/client";
import { TransactionDetails } from "./types";

/**
 * Logs a transaction event to the database for audit purposes
 */
export const logTransactionToDb = async (transaction: TransactionDetails): Promise<void> => {
  try {
    await supabase
      .from('system_logs')
      .insert({
        log_type: transaction.status,
        message: transaction.operation,
        details: {
          transaction_id: transaction.id,
          operation: transaction.operation,
          type: transaction.type,
          status: transaction.status,
          entity_id: transaction.entityId,
          entity_type: transaction.entityType,
          start_time: transaction.startTime,
          end_time: transaction.endTime,
          error_details: transaction.errorDetails,
          metadata: transaction.metadata,
          user_id: transaction.userId
        },
        correlation_id: transaction.id,
        error_message: transaction.errorDetails
      });
  } catch (error) {
    console.error("Failed to log transaction:", error);
  }
};

/**
 * Retrieves transaction logs for a specific transaction ID
 */
export const getTransactionLogs = async (transactionId: string): Promise<TransactionDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('correlation_id', transactionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) return [];

    return data.map(log => {
      const details = log.details || {};
      
      return {
        id: log.correlation_id || '',
        operation: details.operation || log.message || '',
        type: details.type || 'other',
        entityId: details.entity_id,
        entityType: details.entity_type,
        status: details.status || log.log_type,
        startTime: details.start_time || log.created_at,
        endTime: details.end_time,
        errorDetails: details.error_details || log.error_message,
        metadata: details.metadata,
        userId: details.user_id
      };
    });
  } catch (error) {
    console.error("Failed to get transaction logs:", error);
    return [];
  }
};
