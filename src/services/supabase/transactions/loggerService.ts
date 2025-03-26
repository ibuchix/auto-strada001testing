
/**
 * Updated: 2025-08-28
 * Fixed JSON serialization in transaction logger
 */

import { v4 as uuidv4 } from 'uuid';
import { TransactionDetails, TransactionStatus, TransactionStep } from './types';
import { supabase } from '@/integrations/supabase/client';

// Define a record type for system logs
interface SystemLogRecord {
  id: string;
  correlation_id: string;
  message: string;
  log_type: string;
  created_at: string;
  details: Record<string, any>;
  error_message?: string;
}

export class TransactionLoggerService {
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      // Serialize steps and metadata for safe storage
      const serializedTransaction = {
        transaction_id: transaction.id,
        transaction_type: transaction.type,
        transaction_name: transaction.name,
        transaction_status: transaction.status,
        steps: JSON.stringify(transaction.steps || []),
        metadata: JSON.stringify(transaction.metadata || {})
      };

      // Insert into system_logs table
      const { error } = await supabase
        .from('system_logs')
        .insert({
          id: uuidv4(),
          correlation_id: transaction.id,
          message: `Transaction: ${transaction.name}`,
          log_type: 'transaction',
          details: serializedTransaction
        });

      if (error) {
        console.error('Error logging transaction:', error);
      }
    } catch (error) {
      console.error('Error in transaction logger:', error);
    }
  }

  async logStep(
    transactionId: string,
    step: TransactionStep
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          id: uuidv4(),
          correlation_id: transactionId,
          message: `Step: ${step.name}`,
          log_type: 'transaction_step',
          details: {
            step_id: step.id,
            step_name: step.name,
            step_status: step.status,
            step_metadata: step.metadata || {}
          }
        });

      if (error) {
        console.error('Error logging step:', error);
      }
    } catch (error) {
      console.error('Error in step logger:', error);
    }
  }

  async getTransactionHistory(userId: string, limit = 20): Promise<TransactionDetails[]> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('log_type', 'transaction')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      // Transform the records into TransactionDetails objects
      return (data as SystemLogRecord[]).map(record => {
        try {
          const details = record.details as any;
          return {
            id: record.correlation_id,
            type: details.transaction_type,
            name: details.transaction_name || 'Unnamed Transaction',
            status: details.transaction_status as TransactionStatus,
            startTime: record.created_at,
            steps: JSON.parse(details.steps || '[]'),
            metadata: JSON.parse(details.metadata || '{}'),
            error: record.error_message
          };
        } catch (err) {
          console.error('Error parsing transaction record:', err);
          return {
            id: record.correlation_id,
            type: 'OTHER',
            name: 'Error parsing transaction',
            status: TransactionStatus.ERROR,
            startTime: record.created_at,
            steps: [],
            error: 'Error parsing transaction data'
          };
        }
      });
    } catch (error) {
      console.error('Error in getTransactionHistory:', error);
      return [];
    }
  }
}

// Export an instance of the logger for use throughout the application
export const transactionLogger = new TransactionLoggerService();
