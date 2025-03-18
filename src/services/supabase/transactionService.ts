
/**
 * Changes made:
 * - 2024-10-16: Created transaction service for reliable Supabase operations tracking and confirmation
 * - 2024-10-24: Fixed type issues with audit log entries and Date objects
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BaseService } from "./baseService";

// Define transaction types to categorize different operations
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  OTHER = 'other'
}

// Status of the transaction
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

// Interface for transaction details
export interface TransactionDetails {
  id: string;
  operation: string;
  type: TransactionType;
  entityId?: string; 
  entityType?: string;
  status: TransactionStatus;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
  errorDetails?: string;
  userId?: string;
}

// Configuration options for transaction
export interface TransactionOptions {
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryCount?: number;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onComplete?: (details: TransactionDetails) => void;
}

export class TransactionService extends BaseService {
  private activeTransactions: Map<string, TransactionDetails> = new Map();
  
  /**
   * Execute an operation within a tracked transaction
   */
  public async executeTransaction<T>(
    operation: string,
    type: TransactionType,
    callback: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      showToast = true,
      toastDuration = 5000,
      logToDb = true,
      retryCount = 0,
      retryDelay = 1000,
      description = '',
      metadata = {},
      onSuccess,
      onError,
      onComplete
    } = options;

    // Generate unique transaction ID
    const transactionId = crypto.randomUUID();
    
    // Get current user ID if available
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Initialize transaction details
    const transactionDetails: TransactionDetails = {
      id: transactionId,
      operation,
      type,
      status: TransactionStatus.PENDING,
      startTime: new Date(),
      userId,
      metadata: { ...metadata }
    };
    
    // Store in active transactions
    this.activeTransactions.set(transactionId, transactionDetails);
    
    try {
      // Execute operation with retries if specified
      let result: T;
      let lastError: any;
      
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          if (attempt > 0) {
            // Apply exponential backoff for retries
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // Execute the actual operation
          result = await callback();
          
          // Operation succeeded, update details
          transactionDetails.status = TransactionStatus.SUCCESS;
          transactionDetails.endTime = new Date();
          transactionDetails.metadata = { 
            ...(transactionDetails.metadata || {}),
            result: typeof result === 'object' ? 'Object data (not logged)' : result
          };
          
          // Show success toast if configured
          if (showToast) {
            toast.success(`${operation} completed successfully`, {
              description: description || undefined,
              duration: toastDuration
            });
          }
          
          // Call success callback if provided
          if (onSuccess) {
            onSuccess(result);
          }
          
          // Log successful transaction if enabled
          if (logToDb) {
            this.logTransaction(transactionDetails).catch(e => {
              console.error('Failed to log successful transaction:', e);
            });
          }
          
          return result;
        } catch (err) {
          lastError = err;
          console.warn(`Transaction attempt ${attempt + 1}/${retryCount + 1} failed:`, err);
          
          // If we've hit the retry limit, let the error bubble up
          if (attempt === retryCount) {
            throw err;
          }
        }
      }
      
      throw lastError; // Should never reach here but TypeScript wants it
    } catch (error: any) {
      // Update transaction with error details
      transactionDetails.status = TransactionStatus.ERROR;
      transactionDetails.endTime = new Date();
      transactionDetails.errorDetails = error.message || 'Unknown error';
      transactionDetails.metadata = { 
        ...(transactionDetails.metadata || {}),
        error: error.toString(),
        code: error.code,
        stack: error.stack
      };
      
      // Show error toast if configured
      if (showToast) {
        toast.error(`Error during ${operation}`, {
          description: error.message || 'An unexpected error occurred',
          duration: toastDuration,
          action: retryCount > 0 ? {
            label: "Retry",
            onClick: () => this.executeTransaction(operation, type, callback, {
              ...options,
              retryCount: 1 // Provide one more retry on manual action
            })
          } : undefined
        });
      }
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      // Log failed transaction
      if (logToDb) {
        this.logTransaction(transactionDetails).catch(e => {
          console.error('Failed to log error transaction:', e);
        });
      }
      
      throw error;
    } finally {
      // Remove from active transactions
      this.activeTransactions.delete(transactionId);
      
      // Call complete callback regardless of outcome
      if (onComplete) {
        onComplete(transactionDetails);
      }
    }
  }
  
  /**
   * Log transaction to Supabase for auditing and troubleshooting
   */
  private async logTransaction(details: TransactionDetails): Promise<void> {
    try {
      // Format dates as ISO strings for JSON compatibility
      const formattedDetails = {
        transaction_id: details.id,
        status: details.status,
        start_time: details.startTime.toISOString(),
        end_time: details.endTime ? details.endTime.toISOString() : null,
        metadata: details.metadata,
        error: details.errorDetails
      };

      await this.supabase.from('audit_logs').insert({
        user_id: details.userId,
        action: details.operation as any,
        entity_type: details.entityType || details.type,
        entity_id: details.entityId,
        details: formattedDetails
      });
    } catch (error) {
      // Just log to console if we can't log to db - don't throw
      console.error('Failed to log transaction to audit_logs:', error);
    }
  }
  
  /**
   * Get a list of all active transactions
   */
  public getActiveTransactions(): TransactionDetails[] {
    return Array.from(this.activeTransactions.values());
  }
  
  /**
   * Get a specific transaction by ID
   */
  public getTransaction(id: string): TransactionDetails | undefined {
    return this.activeTransactions.get(id);
  }
  
  /**
   * Update metadata for an active transaction
   */
  public updateTransactionMetadata(id: string, metadata: Record<string, any>): boolean {
    const transaction = this.activeTransactions.get(id);
    if (!transaction) return false;
    
    transaction.metadata = {
      ...(transaction.metadata || {}),
      ...metadata
    };
    
    this.activeTransactions.set(id, transaction);
    return true;
  }
}

// Export a singleton instance
export const transactionService = new TransactionService();
