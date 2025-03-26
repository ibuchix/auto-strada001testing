
/**
 * Central export point for transaction system
 * - Simplified structure
 * - Removed diagnostic dependencies
 */

// Export types
export * from './types';

// Export compatibility types from the transactionService
export {
  TransactionType,
  // Use type-only exports for types when isolatedModules is enabled
  type TransactionStatus,
  type TransactionOptions,
  safeJsonify
} from '../transactionService';

// Create a placeholder transaction service for compatibility
const transactionService = {
  executeTransaction: async (operation: string, type: any, callback: Function, options = {}) => {
    console.log(`Transaction ${operation} started`);
    try {
      const result = await callback();
      console.log(`Transaction ${operation} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Transaction ${operation} failed:`, error);
      throw error;
    }
  }
};

export { transactionService };
export default transactionService;
