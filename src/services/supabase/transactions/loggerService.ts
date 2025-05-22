
/**
 * Transaction Logger Service
 * Created: 2025-04-20 - Handle logging transaction events
 * Updated: 2025-05-24 - Fixed action type casting for audit logs
 * Updated: 2025-05-25 - Fixed type issues with Supabase insertions and added logTransaction method
 * Updated: 2025-05-26 - Fixed database insertion type safety issues
 * Updated: 2025-05-26 - Aligned AuditLogAction type with database schema
 * Updated: 2025-05-27 - Fixed action type mapping and casting for database compatibility
 * Updated: 2025-05-28 - Resolved type compatibility issues with the database schema
 * Updated: 2025-05-29 - Updated mapTransactionTypeToAction to map to database-compatible types
 * Updated: 2025-05-30 - Fixed type issues with action mapping by using type assertions
 */

import { supabase } from '@/integrations/supabase/client';
import { AuditLogAction, TransactionDetails } from './types';

export class TransactionLogger {
  /**
   * Log a transaction to audit_logs
   */
  async logTransaction(transaction: TransactionDetails): Promise<boolean> {
    try {
      // Create a formatted log entry for the transaction
      const logEntry = {
        action: this.mapTransactionTypeToAction(transaction.type),
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
   * Map transaction type to a valid audit log action
   * This ensures type safety when sending actions to the database
   */
  private mapTransactionTypeToAction(transactionType: string): AuditLogAction {
    // Map each transaction type to a valid database audit_log_type
    switch (transactionType.toLowerCase()) {
      case 'create': return 'create';
      case 'update': return 'update';
      case 'delete': return 'delete';
      case 'authentication': return 'login';
      case 'auction': return 'process_auctions';
      case 'payment': return 'payment_process';
      case 'upload': return 'create'; // Map upload to a valid database type
      case 'query': return 'system_health_check'; // Map query to a valid database type
      default: return 'system_alert';
    }
  }

  /**
   * Log a transaction event to the audit logs
   */
  async logEvent(
    actionType: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
    userId?: string
  ) {
    try {
      // Convert the actionType to a valid AuditLogAction
      const action = this.ensureValidAction(actionType);
      
      // Insert with explicit type for database compatibility
      // Using explicit casting to the valid literals
      await supabase
        .from('audit_logs')
        .insert({
          action: action as AuditLogAction,
          entity_type: entityType,
          entity_id: entityId,
          user_id: userId,
          details: details || {}
        });
      
      return true;
    } catch (error) {
      console.error('Failed to log transaction event:', error);
      return false;
    }
  }
  
  /**
   * Ensure the action is a valid AuditLogAction supported by the database
   */
  private ensureValidAction(action: string): AuditLogAction {
    // Define all valid actions that match our AuditLogAction type
    const validActions: AuditLogAction[] = [
      'login', 'logout', 'create', 'update', 'delete',
      'verify', 'reject', 'approve', 'suspend', 'reinstate',
      'process_auctions', 'auction_closed', 'auto_proxy_bid',
      'start_auction', 'payment_process',
      'system_repair', 'system_alert', 'system_health_check',
      'auction_recovery'
    ];
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedAction = action.toLowerCase();
    
    // Check if the action is valid
    for (const validAction of validActions) {
      if (normalizedAction === validAction) {
        return validAction;
      }
    }
    
    // Default to system_alert for unknown actions
    return 'system_alert';
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
      // Create a properly typed object to insert directly
      const insertData = {
        log_type: 'error',
        message: errorMessage,
        details: {
          entity_type: entityType,
          entity_id: entityId,
          ...details
        }
      };
      
      // Insert with proper conversion for Supabase
      await supabase
        .from('system_logs')
        .insert(insertData);
      
      return true;
    } catch (error) {
      console.error('Failed to log system error:', error);
      return false;
    }
  }
}

export const transactionLogger = new TransactionLogger();
