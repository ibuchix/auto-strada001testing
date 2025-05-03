/**
 * Supabase transaction service index
 * Created: 2025-07-18
 */

import { TransactionStatus, TransactionType } from '@/components/forms/car-listing/types';

export {
  TransactionStatus,
  TransactionType
};

export type { TransactionOptions } from '@/components/forms/car-listing/types';

// Export transaction service singleton (placeholder)
export const transactionService = {
  createTransaction: async () => {},
  updateTransaction: async () => {},
  queryTransaction: async () => {},
  deleteTransaction: async () => {}
};
