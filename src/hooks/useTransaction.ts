
/**
 * Transaction hook for handling complex operations with loading states
 * Created: 2025-07-10
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export type TransactionType = 'create' | 'update' | 'delete' | 'upload' | 'process' | 'submit';

export interface TransactionOptions {
  showToast: boolean;
  toastMessage?: {
    pending?: string;
    success?: string;
    error?: string;
  };
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  errorAction?: {
    label: string;
    onClick: () => void;
  };
}

export function useTransaction() {
  const [transactionStatus, setTransactionStatus] = useState<'idle' | TransactionStatus>(TransactionStatus.IDLE);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setTransactionStatus(TransactionStatus.IDLE);
    setTransactionId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const startTransaction = useCallback(() => {
    const id = Date.now().toString();
    setTransactionStatus(TransactionStatus.PENDING);
    setTransactionId(id);
    setError(null);
    setIsLoading(true);
    
    // For debugging
    if (window) {
      (window as any).__transactionId = id;
    }
    
    return id;
  }, []);

  const completeTransaction = useCallback((id: string, result?: any) => {
    if (id !== transactionId) return;
    
    setTransactionStatus(TransactionStatus.COMPLETED);
    setIsLoading(false);
    
    return result;
  }, [transactionId]);

  const failTransaction = useCallback((id: string, err: any) => {
    if (id !== transactionId) return;
    
    setTransactionStatus(TransactionStatus.ERROR);
    setError(err);
    setIsLoading(false);
    
    return err;
  }, [transactionId]);

  /**
   * Execute a transaction with loading states and error handling
   */
  const executeTransaction = useCallback(async (
    operation: string,
    type: TransactionType,
    callback: () => Promise<any>,
    options: Partial<TransactionOptions> = {}
  ) => {
    const {
      showToast = true,
      toastMessage = {},
      onSuccess,
      onError,
      errorAction
    } = options;
    
    // Generate default messages based on operation and type
    const defaultMessages = {
      pending: `${operation} in progress...`,
      success: `${operation} completed successfully`,
      error: `Failed to ${operation.toLowerCase()}`
    };
    
    const messages = {
      pending: toastMessage.pending || defaultMessages.pending,
      success: toastMessage.success || defaultMessages.success,
      error: toastMessage.error || defaultMessages.error
    };
    
    const txId = startTransaction();
    let toastId;
    
    try {
      // Show pending toast if enabled
      if (showToast) {
        toastId = toast.loading(messages.pending);
      }
      
      // Execute the callback
      const result = await callback();
      
      // Update toast to success
      if (showToast && toastId) {
        toast.success(messages.success, { id: toastId });
      }
      
      // Run success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return completeTransaction(txId, result);
    } catch (err) {
      console.error(`Transaction error (${operation}):`, err);
      
      // Update toast to error
      if (showToast && toastId) {
        toast.error(messages.error, { 
          id: toastId,
          action: errorAction
        });
      }
      
      // Run error callback if provided
      if (onError) {
        onError(err);
      }
      
      return failTransaction(txId, err);
    }
  }, [startTransaction, completeTransaction, failTransaction]);

  return {
    executeTransaction,
    isLoading,
    transactionStatus,
    reset,
    startTransaction,
    completeTransaction,
    failTransaction
  };
}
