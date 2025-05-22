
/**
 * Transaction logging service
 * Created: 2025-07-22
 * Updated: 2025-05-30 - Fixed action validation for logging to database
 */

import { supabase } from '@/integrations/supabase/client';
import { TransactionType, TransactionDetails, AuditLogAction } from './types';

/**
 * Maps transaction types to audit log actions
 */
const mapTransactionTypeToAction = (type: TransactionType, operation?: string): AuditLogAction => {
  // Direct mappings from transaction type to action
  const directMappings: Record<TransactionType, AuditLogAction> = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    AUTHENTICATION: 'login', // Default, can be overridden by operation
    QUERY: 'system_health_check', // Default for queries
    UPLOAD: 'create', // Default for uploads
    AUCTION: 'auction_closed', // Default for auction operations
    PAYMENT: 'system_alert' // Default for payment operations
  };

  // Special case for authentication based on operation
  if (type === TransactionType.AUTHENTICATION) {
    if (operation === 'logout') {
      return 'logout';
    }
    return 'login';
  }

  // Special case for auction operations
  if (type === TransactionType.AUCTION) {
    if (operation === 'start') {
      return 'start_auction';
    } else if (operation === 'recovery') {
      return 'auction_recovery';
    } else if (operation === 'proxy_bid') {
      return 'auto_proxy_bid';
    }
    return 'auction_closed';
  }

  // Use the direct mapping or default to 'system_alert' for any unknown types
  return directMappings[type] || 'system_alert';
};

/**
 * Ensures the action is valid according to the database schema
 */
const ensureValidAction = (action: string): AuditLogAction => {
  // List of valid actions from the database schema
  const validActions: AuditLogAction[] = [
    'login',
    'logout',
    'create',
    'update',
    'delete',
    'verify',
    'reject',
    'approve',
    'suspend',
    'reinstate',
    'process_auctions',
    'auction_closed',
    'auto_proxy_bid',
    'start_auction',
    'system_alert',
    'system_health_check',
    'auction_recovery'
  ];

  // Check if the action is valid
  if (validActions.includes(action as AuditLogAction)) {
    return action as AuditLogAction;
  }

  // Default to system_alert for invalid actions
  console.warn(`Invalid audit log action: ${action}. Using system_alert instead.`);
  return 'system_alert';
};

/**
 * Logs a transaction to the database
 */
export const logTransactionToDatabase = async (
  transaction: TransactionDetails
): Promise<void> => {
  try {
    // Map transaction type to audit log action
    const mappedAction = mapTransactionTypeToAction(transaction.type, transaction.operation);
    
    // Ensure the action is valid
    const validAction = ensureValidAction(mappedAction);

    // Prepare the audit log entry
    const { error } = await supabase.from('audit_logs').insert({
      action: validAction,
      entity_type: transaction.entityType || 'transaction',
      entity_id: transaction.entityId || null,
      user_id: transaction.userId || null,
      details: {
        transaction_id: transaction.id,
        operation: transaction.operation,
        duration_ms: transaction.duration,
        status: transaction.status,
        metadata: transaction.metadata,
        error: transaction.error ? String(transaction.error) : undefined,
        error_details: transaction.errorDetails
      }
    });

    if (error) {
      console.error('Error logging transaction to database:', error);
    }
  } catch (err) {
    console.error('Exception logging transaction to database:', err);
  }
};
