
/**
 * Hook for transaction management
 */
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  TRANSACTION_STATUS, 
  TransactionStatus, 
  TransactionOptions,
  safeJsonify
} from "@/services/supabase/transactionService";

interface UseTransactionOptions {
  showToast?: boolean;
  retryCount?: number;
  logToDb?: boolean;
}

interface TransactionState<T = any> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  transactionId: string | null;
  transactionStatus: TransactionStatus;
}

export const useCreateTransaction = (options: UseTransactionOptions = {}) => {
  const { 
    showToast = true, 
    retryCount = 0,
    logToDb = false
  } = options;
  
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    data: null,
    transactionId: null,
    transactionStatus: TRANSACTION_STATUS.IDLE
  });
  
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      transactionId: null,
      transactionStatus: TRANSACTION_STATUS.IDLE
    });
  }, []);
  
  const logTransaction = async <T>(
    transactionId: string,
    transactionName: string,
    status: TransactionStatus,
    result: T,
    error: any = null,
    options: TransactionOptions = {}
  ) => {
    if (!logToDb) return;
    
    try {
      // Log to system_logs table instead of transaction_logs
      await supabase.from('system_logs').insert({
        id: uuidv4(),
        log_type: 'transaction',
        message: `Transaction ${transactionName} (${status})`,
        details: safeJsonify({
          transaction_id: transactionId,
          transaction_name: transactionName,
          status,
          result,
          error,
          description: options.description,
          metadata: options.metadata
        }),
        correlation_id: transactionId
      });
    } catch (err) {
      console.error('Failed to log transaction:', err);
    }
  };
  
  const execute = async <T>(
    name: string,
    operation: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T | null> => {
    const transactionId = uuidv4();
    let retries = 0;
    const maxRetries = retryCount;
    
    setState({
      isLoading: true,
      error: null,
      data: null,
      transactionId,
      transactionStatus: TRANSACTION_STATUS.PENDING
    });
    
    const executeWithRetry = async (): Promise<T | null> => {
      try {
        const result = await operation();
        
        setState({
          isLoading: false,
          error: null,
          data: result,
          transactionId,
          transactionStatus: TRANSACTION_STATUS.SUCCESS
        });
        
        if (showToast) {
          toast.success(`${name} completed successfully`);
        }
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        await logTransaction(transactionId, name, TRANSACTION_STATUS.SUCCESS, result, null, options);
        
        return result;
      } catch (error: any) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Retrying transaction (${retries}/${maxRetries})...`);
          return executeWithRetry();
        }
        
        setState({
          isLoading: false,
          error: error instanceof Error ? error : new Error(error?.message || 'Unknown error'),
          data: null,
          transactionId,
          transactionStatus: TRANSACTION_STATUS.ERROR
        });
        
        if (showToast) {
          toast.error(`${name} failed: ${error?.message || 'Unknown error'}`);
        }
        
        if (options.onError) {
          options.onError(error);
        }
        
        await logTransaction(transactionId, name, TRANSACTION_STATUS.ERROR, null, error, options);
        
        return null;
      }
    };
    
    return executeWithRetry();
  };
  
  return {
    ...state,
    execute,
    reset
  };
};
