
/**
 * Transaction debug panel component (placeholder version with no diagnostics)
 */
import { useState } from 'react';
import { TransactionStatus } from '@/types/forms';

interface TransactionDebugPanelProps {
  transactionId?: string;
  transactionStatus: TransactionStatus | null;
  formData?: any;
}

export const TransactionDebugPanel = ({ 
  transactionId, 
  transactionStatus, 
  formData 
}: TransactionDebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Return empty fragment - no diagnostics
  return null;
};
