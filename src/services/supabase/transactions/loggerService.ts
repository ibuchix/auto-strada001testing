
/**
 * Updated: 2025-08-27
 * Fixed TransactionLoggerService to properly export the class
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

export class TransactionLoggerService {
  async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      // Convert complex objects to simpler structures for JSON serialization
      const simplifiedDetails = {
        transaction_id: transaction.id,
        transaction_type: transaction.type,
        steps: transaction.steps ? transaction.steps.map(step => ({
          id: step.id,
          name: step.name,
          status: step.status,
          startTime: step.startTime,
          endTime: step.endTime,
          duration: step.duration,
          error: step.error ? String(step.error) : undefined
        })) : [],
        metadata: transaction.metadata || {}
      };

      const { error } = await supabase
        .from('system_logs')
        .insert({
          log_type: transaction.status === TransactionStatus.ERROR ? 'ERROR' : 'SUCCESS',
          message: transaction.name || 'Transaction',
          details: simplifiedDetails,
          error_message: transaction.error ? String(transaction.error) : '',
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch transaction history:', error);
        return [];
      }

      // Transform system logs to transaction details - using a simpler approach to avoid deep instantiation
      return (data || []).map((record: any) => {
        const details = record.details || {};
        
        return {
          id: details.transaction_id || record.id,
          type: details.transaction_type || 'OTHER',
          name: record.message,
          status: record.log_type === 'ERROR' ? TransactionStatus.ERROR : TransactionStatus.SUCCESS,
          startTime: record.created_at,
          steps: Array.isArray(details.steps) ? details.steps : [],
          metadata: details.metadata || {},
          error: record.error_message
        };
      });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
}

export const transactionLogger = new TransactionLoggerService();
