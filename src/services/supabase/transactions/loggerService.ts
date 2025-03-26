
/**
 * Transaction logger service for tracking transaction events
 * 
 * Changes made:
 * - 2024-10-25: Standardized error property to use errorDetails instead of error
 * - 2024-12-05: Fixed type instantiation issue in logger
 * - 2025-12-12: Resolved type depth issues and switched to system_logs table
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { TransactionDetails, TransactionStatus, SystemLogRecord } from './types';

// Interface for minimal log entry
interface LogEntry {
  id: string;
  operation: string;
  status: string;
  timestamp: string;
  details?: any;
  error?: string;
  user_id?: string;
}

class TransactionLoggerService {
  // Log a transaction to the system_logs table
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      // Prepare log data in the format expected by system_logs
      const logData = {
        message: `Transaction: ${transaction.operation}`,
        log_type: `transaction_${transaction.status.toLowerCase()}`,
        details: {
          transactionId: transaction.id,
          operation: transaction.operation,
          type: transaction.type,
          status: transaction.status,
          startTime: transaction.startTime,
          endTime: transaction.endTime,
          metadata: transaction.metadata || {},
          entityId: transaction.entityId,
          entityType: transaction.entityType,
          userId: transaction.userId
        },
        correlation_id: transaction.id,
        error_message: transaction.errorDetails || null
      };
      
      // Insert into system_logs table
      const { error } = await supabase
        .from('system_logs')
        .insert(logData);
        
      if (error) {
        console.error('Error logging transaction:', error);
      }
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  }

  // Get transaction history for a specific user
  async getTransactionHistory(userId: string, limit: number = 20): Promise<TransactionDetails[]> {
    try {
      // Query system_logs table with relevant filters
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('details->userId', userId)
        .ilike('log_type', 'transaction_%')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error || !data) {
        console.error('Error fetching transaction history:', error);
        return [];
      }
      
      // Map system logs to transaction details format
      return data.map((record) => {
        const details = record.details as Record<string, any>;
        return {
          id: details.transactionId || record.id,
          operation: details.operation || '',
          type: details.type || 'OTHER',
          status: (details.status || 'ERROR') as TransactionStatus,
          startTime: details.startTime || record.created_at,
          endTime: details.endTime,
          metadata: details.metadata,
          errorDetails: record.error_message,
          userId: details.userId,
          entityId: details.entityId,
          entityType: details.entityType
        };
      });
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
}

export const transactionLogger = new TransactionLoggerService();
