
/**
 * Created: 2025-08-26
 * Transaction logger service for tracking application transactions
 */

import { supabase } from '@/integrations/supabase/client';
import { TransactionDetails, TransactionStatus } from './types';

export interface SystemLogRecord {
  id: string;
  log_type: string;
  message: string;
  details: Record<string, any>;
  error_message: string;
  correlation_id: string;
  created_at: string;
}

class TransactionLoggerService {
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          log_type: transaction.status === TransactionStatus.ERROR ? 'ERROR' : 'SUCCESS',
          message: transaction.name || 'Transaction',
          details: {
            transaction_id: transaction.id,
            transaction_type: transaction.type,
            steps: transaction.steps || [],
            metadata: transaction.metadata || {}
          },
          error_message: transaction.errorDetails || transaction.error || '',
          correlation_id: transaction.id
        });

      if (error) {
        console.error('Failed to log transaction:', error);
      }
    } catch (error) {
      console.error('Error in transaction logger:', error);
    }
  }

  async getTransactionHistory(userId: string, limit = 20): Promise<TransactionDetails[]> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('details->user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch transaction history:', error);
        return [];
      }

      // Transform system logs to transaction details
      return (data || []).map((record: SystemLogRecord) => this.transformLogToTransaction(record));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  private transformLogToTransaction(record: SystemLogRecord): TransactionDetails {
    const details = record.details || {};
    
    return {
      id: details.transaction_id || record.id,
      type: details.transaction_type || 'CUSTOM',
      name: record.message,
      status: record.log_type === 'ERROR' ? TransactionStatus.ERROR : TransactionStatus.SUCCESS,
      startTime: record.created_at,
      steps: details.steps || [],
      metadata: details.metadata || {},
      error: record.error_message,
      errorDetails: record.error_message
    };
  }
}

export const transactionLogger = new TransactionLoggerService();
