
/**
 * Updated: 2024-09-08
 * Fixed type issues with transaction logger
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { TransactionStatus, TransactionType, TransactionStep, TransactionDetails } from './types';

export class TransactionLoggerService {
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  async logTransaction(transaction: TransactionDetails): Promise<void> {
    if (!this.enabled) return;

    try {
      const serializedDetails = {
        transaction_id: transaction.id,
        transaction_type: transaction.type,
        name: transaction.name,
        status: transaction.status,
        startTime: transaction.startTime,
        endTime: transaction.endTime,
        steps: JSON.stringify(transaction.steps || []),
        metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : null
      };

      const { error } = await supabase
        .from('transaction_logs')
        .insert({
          id: uuidv4(),
          log_type: 'transaction',
          message: `Transaction ${transaction.id} of type ${transaction.type}`,
          details: JSON.stringify(serializedDetails)
        });

      if (error) {
        console.error('Error logging transaction:', error);
      }
    } catch (err) {
      console.error('Failed to log transaction:', err);
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<TransactionDetails[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await supabase
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
          const rawDetails = JSON.parse(log.details);
          const parsedSteps = rawDetails.steps ? JSON.parse(rawDetails.steps) : [];
          const parsedMetadata = rawDetails.metadata ? JSON.parse(rawDetails.metadata) : undefined;
          
          return {
            id: rawDetails.transaction_id || log.id,
            type: rawDetails.transaction_type as TransactionType,
            name: rawDetails.name || 'Unknown Transaction',
            status: rawDetails.status as TransactionStatus,
            startTime: rawDetails.startTime || log.created_at,
            endTime: rawDetails.endTime,
            steps: parsedSteps,
            metadata: parsedMetadata,
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
      const { error } = await supabase
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
