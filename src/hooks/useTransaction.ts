
/**
 * Simplified transaction hook for handling operations with consistent error handling
 * - Removed diagnostic dependencies
 * - Streamlined transaction logging
 * - Fixed system_logs table usage
 * - Fixed TypeScript type compatibility issues
 */
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  TRANSACTION_STATUS, 
  TransactionStatus, 
  TransactionOptions,
  TransactionType
} from "@/services/supabase/transactions/types";

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
    transactionStatus: TRANSACTION_STATUS.IDLE as unknown as TransactionStatus // Type assertion to match expected type
  });
  
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      transactionId: null,
      transactionStatus: TRANSACTION_STATUS.IDLE as unknown as TransactionStatus // Type assertion to match expected type
    });
  }, []);
  
  const logTransaction = async <T>(
    transactionId: string,
    transactionName: string,
    status: TransactionStatus,
    result: T | null,
    error: any = null,
    options: TransactionOptions = {}
  ) => {
    if (!logToDb) return;
    
    try {
      // Safely prepare the details object
      const details: Record<string, any> = {
        transaction_id: transactionId,
        transaction_name: transactionName,
        status,
        description: options.description
      };
      
      // Only include result if it exists and can be converted to string
      if (result) {
        try {
          details.result = typeof result === 'object' 
            ? JSON.stringify(result) 
            : String(result);
        } catch (e) {
          details.result = '[Complex object]';
        }
      }
      
      // Only include error if it exists
      if (error) {
        details.error = error.message || String(error);
      }
      
      // Only include metadata if it exists
      if (options.metadata) {
        try {
          details.metadata = typeof options.metadata === 'object'
            ? JSON.stringify(options.metadata)
            : String(options.metadata);
        } catch (e) {
          details.metadata = '[Complex metadata]';
        }
      }
      
      // Log to system_logs table
      await supabase.from('system_logs').insert({
        id: uuidv4(),
        log_type: 'transaction',
        message: `Transaction ${transactionName} (${status})`,
        details,
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
      transactionStatus: TRANSACTION_STATUS.PENDING as unknown as TransactionStatus // Type assertion to match expected type
    });
    
    const executeWithRetry = async (): Promise<T | null> => {
      try {
        const result = await operation();
        
        setState({
          isLoading: false,
          error: null,
          data: result,
          transactionId,
          transactionStatus: TRANSACTION_STATUS.SUCCESS as unknown as TransactionStatus // Type assertion to match expected type
        });
        
        if (showToast) {
          toast.success(`${name} completed successfully`);
        }
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        await logTransaction(
          transactionId, 
          name, 
          TRANSACTION_STATUS.SUCCESS as unknown as TransactionStatus, // Type assertion to match expected type
          result, 
          null, 
          options
        );
        
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
          transactionStatus: TRANSACTION_STATUS.ERROR as unknown as TransactionStatus // Type assertion to match expected type
        });
        
        if (showToast) {
          toast.error(`${name} failed: ${error?.message || 'Unknown error'}`);
        }
        
        if (options.onError) {
          options.onError(error);
        }
        
        await logTransaction(
          transactionId, 
          name, 
          TRANSACTION_STATUS.ERROR as unknown as TransactionStatus, // Type assertion to match expected type
          null, 
          error, 
          options
        );
        
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
