
/**
 * Transaction Types
 * Created: 2025-05-03
 * Updated: 2025-06-15 - Added TransactionType enum
 * Updated: 2025-06-16 - Exported TransactionType enum properly
 * 
 * Types for transaction status tracking
 */

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum TransactionType {
  BID = 'BID',
  LISTING = 'LISTING',
  PAYMENT = 'PAYMENT',
  VERIFICATION = 'VERIFICATION'
}
