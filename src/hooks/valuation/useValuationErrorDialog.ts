
/**
 * Hook for managing valuation error dialog state and actions
 * Created: 2025-04-16
 */

import { useCallback, useState } from 'react';
import { useValuationStore } from '@/hooks/store/useValuationStore';
import { toast } from 'sonner';

export const useValuationErrorDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { resetForm, setError } = useValuationStore();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, [setError]);

  const handleRetry = useCallback(() => {
    console.log('Retrying valuation...');
    setIsOpen(false);
    resetForm();
    toast.info('Ready for new valuation attempt');
  }, [resetForm]);

  return {
    isOpen,
    setIsOpen,
    handleClose,
    handleRetry
  };
};
