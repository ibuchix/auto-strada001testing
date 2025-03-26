
/**
 * Transaction service for tracking application transactions
 */

import { v4 as uuidv4 } from 'uuid';
import { Session } from '@supabase/supabase-js';
import { 
  TransactionDetails, 
  TransactionMetadata,
  TransactionOptions,
  TransactionStatus,
  TransactionType
} from './types';
import { supabase } from '@/integrations/supabase/client';
import { transactionLogger } from './loggerService';

export class TransactionService {
  private session: Session | null = null;

  setSession(session: Session | null) {
    this.session = session;
  }

  async createTransaction(
    operation: string,
    type: TransactionType = TransactionType.GENERAL,
    options?: TransactionOptions
  ): Promise<TransactionDetails> {
    const userId = this.session?.user?.id;
    const id = uuidv4();
    const startTime = new Date().toISOString();
    
    const transaction: TransactionDetails = {
      id,
      operation,
      type,
      status: TransactionStatus.PENDING,
      startTime,
      userId,
      metadata: options?.metadata || {}
    };

    if (options?.entityId) {
      transaction.entityId = options.entityId;
    }

    if (options?.entityType) {
      transaction.entityType = options.entityType;
    }

    // Log the transaction start
    await transactionLogger.logTransaction(transaction);

    return transaction;
  }

  async updateTransaction(
    transaction: TransactionDetails,
    status: TransactionStatus,
    metadata?: TransactionMetadata,
    error?: any
  ): Promise<TransactionDetails> {
    const updatedTransaction = { ...transaction };
    
    updatedTransaction.status = status;
    
    if (status === TransactionStatus.SUCCESS || status === TransactionStatus.ERROR) {
      updatedTransaction.endTime = new Date().toISOString();
    }
    
    if (metadata) {
      updatedTransaction.metadata = {
        ...updatedTransaction.metadata,
        ...metadata
      };
    }
    
    if (error) {
      updatedTransaction.error = typeof error === 'string' 
        ? error 
        : error.message || JSON.stringify(error);
    }
    
    // Log the transaction update
    await transactionLogger.logTransaction(updatedTransaction);
    
    return updatedTransaction;
  }

  async getTransactionHistory(limit = 20): Promise<TransactionDetails[]> {
    if (!this.session?.user?.id) return [];
    
    return transactionLogger.getTransactionHistory(this.session.user.id, limit);
  }
}
