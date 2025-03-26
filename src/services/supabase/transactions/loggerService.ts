
/**
 * Updated: 2024-09-08
 * Fixed type issues with transaction logger
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseClient } from '@/integrations/supabase/client';
import { TransactionStatus, TransactionType, TransactionStep, TransactionDetails } from './types';

export class TransactionLoggerService {
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  async logTransaction(
    transactionId: string,
    transactionType: TransactionType,
    steps: TransactionStep[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await supabaseClient
        .from('transaction_logs')
        .insert({
          id: uuidv4(),
          log_type: 'transaction',
          message: `Transaction ${transactionId} of type ${transactionType}`,
          details: JSON.stringify({
            transaction_id: transactionId,
            transaction_type: transactionType,
            steps: steps,
            metadata: metadata
          })
        });

      if (error) {
        console.error('Error logging transaction:', error);
      }
    } catch (err) {
      console.error('Failed to log transaction:', err);
    }
  }

  async getTransactionLogs(limit: number = 50): Promise<TransactionDetails[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await supabaseClient
        .from('transaction_logs')
        .select('*')
        .eq('log_type', 'transaction')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction logs:', error);
        return [];
      }

      return data.map(log => {
        try {
          const details = JSON.parse(log.details);
          return {
            id: details.transaction_id || log.id,
            type: details.transaction_type as TransactionType,
            name: details.name || 'Unknown Transaction',
            status: details.status as TransactionStatus,
            startTime: details.startTime || log.created_at,
            endTime: details.endTime,
            steps: details.steps || [],
            metadata: details.metadata,
            error: log.error_message
          };
        } catch (err) {
          // Fallback for malformed log entries
          return {
            id: log.id,
            type: TransactionType.OTHER,
            name: 'Malformed Log Entry',
            status: TransactionStatus.ERROR,
            startTime: log.created_at,
            steps: [],
            error: 'Failed to parse log entry'
          };
        }
      });
    } catch (err) {
      console.error('Failed to get transaction logs:', err);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await supabaseClient
        .from('transaction_logs')
        .delete()
        .eq('log_type', 'transaction');

      if (error) {
        console.error('Error clearing transaction logs:', error);
      }
    } catch (err) {
      console.error('Failed to clear transaction logs:', err);
    }
  }
}

export const transactionLogger = new TransactionLoggerService();
