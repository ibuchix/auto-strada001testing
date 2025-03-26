
/**
 * Changes made:
 * - 2024-10-28: Created separate logger service for transaction logging
 * - 2024-08-04: Fixed handling of string dates in logger service
 */

import { BaseService } from "../baseService";
import { TransactionDetails } from "./types";

class TransactionLoggerService extends BaseService {
  /**
   * Log a transaction to the database for audit purposes
   */
  public async logTransaction(transaction: TransactionDetails): Promise<void> {
    try {
      await this.supabase.from('transaction_logs').insert({
        transaction_id: transaction.id,
        operation: transaction.operation,
        type: transaction.type,
        status: transaction.status,
        entity_id: transaction.entityId,
        entity_type: transaction.entityType,
        start_time: transaction.startTime,
        end_time: transaction.endTime,
        error_details: transaction.errorDetails,
        metadata: transaction.metadata,
        user_id: transaction.userId
      });
      
      console.log(`Transaction logged: ${transaction.id} (${transaction.operation})`);
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  }
  
  /**
   * Get transaction logs for a specific entity
   */
  public async getEntityTransactionLogs(
    entityType: string, 
    entityId: string
  ): Promise<TransactionDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('transaction_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      return data.map(log => ({
        id: log.transaction_id,
        operation: log.operation,
        type: log.type,
        status: log.status,
        entityId: log.entity_id,
        entityType: log.entity_type,
        startTime: log.start_time,
        endTime: log.end_time,
        errorDetails: log.error_details,
        metadata: log.metadata,
        userId: log.user_id
      }));
    } catch (error) {
      console.error('Failed to get transaction logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const transactionLogger = new TransactionLoggerService();
