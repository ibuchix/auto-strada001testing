
/**
 * Transaction Logger Service
 * Created: 2025-04-20 - Handle logging transaction events
 * Updated: 2025-05-24 - Fixed action type casting for audit logs
 * Updated: 2025-05-25 - Fixed type issues with Supabase insertions and added logTransaction method
 */

import { supabase } from '@/integrations/supabase/client';
import { toSupabaseObject } from '@/utils/supabaseTypeUtils';
import { TransactionDetails } from './types';

// Define the allowed action types as a string union type
type AuditLogAction = 
  | 'login' 
  | 'logout' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'suspend' 
  | 'reinstate' 
  | 'verify' 
  | 'reject' 
  | 'approve' 
  | 'process_auctions' 
  | 'auction_closed' 
  | 'auto_proxy_bid' 
  | 'start_auction' 
  | 'admin_action' 
  | 'bid_process' 
  | 'payment_process' 
  | 'system_repair' 
  | 'system_alert';

export class TransactionLogger {
  /**
   * Log a transaction to audit_logs
   */
  async logTransaction(transaction: TransactionDetails): Promise<boolean> {
    try {
      // Create a formatted log entry for the transaction
      const logEntry = {
        action: transaction.type.toLowerCase() as AuditLogAction,
        entity_type: transaction.entityType || 'transaction',
        entity_id: transaction.entityId || transaction.id,
        user_id: transaction.userId,
        details: {
          operation: transaction.operation,
          status: transaction.status,
          duration: transaction.endTime 
            ? (transaction.endTime - transaction.startTime) 
            : undefined,
          error: transaction.errorDetails,
          ...transaction.metadata
        }
      };
      
      await this.logEvent(
        logEntry.action,
        logEntry.entity_type,
        logEntry.entity_id || 'unknown',
        logEntry.details,
        logEntry.user_id
      );
      
      return true;
    } catch (error) {
      console.error('Failed to log transaction:', error);
      return false;
    }
  }

  /**
   * Log a transaction event to the audit logs
   */
  async logEvent(
    action: AuditLogAction,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
    userId?: string
  ) {
    try {
      // Ensure we have the required properties directly in the object
      const logEntry = {
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        details: details || {}
      };
      
      // Insert with proper conversion for Supabase
      await supabase.from('audit_logs').insert(toSupabaseObject(logEntry));
      
      return true;
    } catch (error) {
      console.error('Failed to log transaction event:', error);
      return false;
    }
  }
  
  /**
   * Log a system error
   */
  async logError(
    errorMessage: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ) {
    try {
      // Ensure we have the required properties directly in the object
      const logEntry = {
        log_type: 'error',
        message: errorMessage,
        details: {
          entity_type: entityType,
          entity_id: entityId,
          ...details
        }
      };
      
      // Insert with proper conversion for Supabase
      await supabase.from('system_logs').insert(toSupabaseObject(logEntry));
      
      return true;
    } catch (error) {
      console.error('Failed to log system error:', error);
      return false;
    }
  }
}

export const transactionLogger = new TransactionLogger();
