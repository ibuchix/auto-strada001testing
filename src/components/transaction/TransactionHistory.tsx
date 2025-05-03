/**
 * Transaction History Component
 * Updated: 2025-06-23 - Fixed TransactionType enum usage
 */

import { useState } from "react";
import { useTransaction } from "./TransactionProvider";
import { TransactionStatusIndicator } from "./TransactionStatusIndicator";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/services/supabase/transactions/types";
import { formatDistanceToNow } from "date-fns";

// Use the TransactionType enum directly instead of accessing properties
const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case TransactionType.CREATE:
      return 'plus-circle';
    case TransactionType.UPDATE:
      return 'pencil';
    case TransactionType.DELETE:
      return 'trash';
    case TransactionType.UPLOAD:
      return 'upload';
    case TransactionType.AUCTION:
      return 'gavel';
    case TransactionType.PAYMENT:
      return 'credit-card';
    case TransactionType.AUTHENTICATION:
      return 'lock';
    default:
      return 'circle';
  }
};

export const TransactionHistory = () => {
  // For now, we're using empty transaction history until we fix the transaction system
  const transactionHistory: any[] = [];
  const clearHistory = () => {};
  const [expanded, setExpanded] = useState(false);

  if (transactionHistory.length === 0) {
    return null;
  }

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.CREATE:
        return "Create";
      case TransactionType.UPDATE:
        return "Update";
      case TransactionType.DELETE:
        return "Delete";
      case TransactionType.UPLOAD:
        return "Upload";
      case TransactionType.AUCTION:
        return "Auction";
      case TransactionType.PAYMENT:
        return "Payment";
      case TransactionType.AUTHENTICATION:
        return "Auth";
      default:
        return "Other";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Recent Transactions</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "View All"}
          </Button>
          {expanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {transactionHistory
          .slice(0, expanded ? undefined : 3)
          .map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <TransactionStatusIndicator status={transaction.status} />
                <span className="font-medium">{transaction.operation}</span>
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-1">
                  {getTypeLabel(transaction.type)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(transaction.startTime), {
                  addSuffix: true,
                })}
              </div>
            </div>
          ))}
      </div>

      {!expanded && transactionHistory.length > 3 && (
        <div className="mt-2 text-center text-xs text-gray-500">
          {transactionHistory.length - 3} more transactions
        </div>
      )}
    </div>
  );
};
