
/**
 * Changes made:
 * - 2024-10-28: Created separate logger service for transactions
 * - 2025-06-22: Fixed missing entityType property in TransactionDetails
 * - 2025-07-02: Ensured proper entityType handling
 */

import { supabase } from "@/integrations/supabase/client";
import { TransactionDetails, AuditLogAction } from "./types";
import { BaseService } from "../baseService";

export class TransactionLogger extends BaseService {
  /**
   * Log transaction to Supabase for auditing and troubleshooting
   */
  public async logTransaction(details: TransactionDetails): Promise<void> {
    try {
      // Format dates as ISO strings for JSON compatibility
      const formattedDetails = {
        transaction_id: details.id,
        status: details.status,
        start_time: details.startTime.toISOString(),
        end_time: details.endTime ? details.endTime.toISOString() : null,
        metadata: details.metadata || {},
        error: details.errorDetails || null
      };

      // Map operation string to valid audit_log_type enum value
      const actionType = this.mapOperationToAuditLogType(details.operation);

      await this.supabase.from('audit_logs').insert({
        action: actionType,
        entity_type: details.entityType || String(details.type),
        entity_id: details.entityId,
        details: formattedDetails,
        user_id: details.userId
      });
    } catch (error) {
      // Just log to console if we can't log to db - don't throw
      console.error('Failed to log transaction to audit_logs:', error);
    }
  }
  
  /**
   * Map operation string to valid audit_log_type enum value
   * This ensures compatibility with the database enum type
   */
  private mapOperationToAuditLogType(operation: string): AuditLogAction {
    // Map our operation to one of the valid enum values
    // Default to "create" if no match is found
    const operationMap: Record<string, AuditLogAction> = {
      'create': 'create',
      'update': 'update',
      'delete': 'delete',
      'login': 'login',
      'logout': 'logout',
      'upload': 'create',
      'auction': 'auction_closed',
      'payment': 'update',
      'authentication': 'login',
      // Add more mappings as needed
    };
    
    // Return the mapped value or default to "create"
    return operationMap[operation.toLowerCase()] || 'create';
  }
}

// Export a singleton instance
export const transactionLogger = new TransactionLogger();
