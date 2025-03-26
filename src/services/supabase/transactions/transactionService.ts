
/**
 * Transaction service for tracking application transactions
 * 
 * Changes made:
 * - 2024-10-25: Standardized error property to use errorDetails instead of error
 * - 2025-12-01: Fixed typings and method signatures
 * - 2025-12-12: Added executeTransaction method to match hook usage
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
    type: TransactionType = TransactionType.OTHER,
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
      updatedTransaction.errorDetails = typeof error === 'string' 
        ? error 
        : error.message || JSON.stringify(error);
    }
    
    // Log the transaction update
    await transactionLogger.logTransaction(updatedTransaction);
    
    return updatedTransaction;
  }

  // Add executeTransaction method to match hook expectations
  async executeTransaction<T>(
    operation: string,
    type: TransactionType,
    callback: (transactionId: string) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const transaction = await this.createTransaction(operation, type, options);
    
    try {
      const result = await callback(transaction.id);
      
      await this.updateTransaction(
        transaction,
        TransactionStatus.SUCCESS,
        {
          completedAt: new Date().toISOString(),
          result: typeof result === 'object' ? JSON.stringify(result) : String(result)
        }
      );
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error: any) {
      await this.updateTransaction(
        transaction,
        TransactionStatus.ERROR,
        { failedAt: new Date().toISOString() },
        error
      );
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      if (options?.onComplete) {
        options.onComplete(transaction);
      }
    }
  }

  async getTransactionHistory(limit = 20): Promise<TransactionDetails[]> {
    if (!this.session?.user?.id) return [];
    
    return transactionLogger.getTransactionHistory(this.session.user.id, limit);
  }
}
