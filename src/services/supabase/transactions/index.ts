
/**
 * Export transaction services
 * Changes made:
 * - 2025-12-01: Fixed export structure to properly export both types and values
 * - 2025-12-12: Ensured consistent exports between types and implementation
 */

import { TransactionService } from './transactionService';
import { transactionLogger } from './loggerService';
import { TransactionType, TransactionStatus } from './types';

export const transactionService = new TransactionService();

export {
  transactionLogger,
  TransactionType,
  TransactionStatus
};

export * from './types';
