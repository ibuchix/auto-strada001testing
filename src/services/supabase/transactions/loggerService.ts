
/**
 * Transaction Logger Service
 * Created: 2025-04-20 - Handle logging transaction events
 * Updated: 2025-05-24 - Fixed action type casting for audit logs
 */

import { supabase } from '@/integrations/supabase/client';
import { toSupabaseObject } from '@/utils/supabaseTypeUtils';

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
      // Convert action to string explicitly to avoid type issues
      const actionString = action as string;
      
      // Create log entry with proper type conversion
      await supabase.from('audit_logs').insert(toSupabaseObject({
        action: actionString,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        details: details || {}
      }));
      
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
      await supabase.from('system_logs').insert(toSupabaseObject({
        log_type: 'error',
        message: errorMessage,
        details: {
          entity_type: entityType,
          entity_id: entityId,
          ...details
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to log system error:', error);
      return false;
    }
  }
}

export const transactionLogger = new TransactionLogger();
