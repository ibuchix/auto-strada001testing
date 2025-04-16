
/**
 * Hook for managing valuation error dialog state and actions
 * Created: 2025-04-16
 * Updated: 2025-04-18 - Improved error state management and callback handling
 */

import { useCallback, useState } from 'react';
import { useValuationStore } from '@/hooks/store/useValuationStore';
import { toast } from 'sonner';

export const useValuationErrorDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { resetForm, setError, resetState } = useValuationStore();

  // Enhanced close handler with explicit state cleanup
  const handleClose = useCallback(() => {
    console.log('Dialog close handler executed with new implementation');
    setIsOpen(false);
    setError(null);
  }, [setError]);

  // Enhanced retry handler with proper state reset sequence
  const handleRetry = useCallback(() => {
    console.log('Retry handler executed with new implementation, resetting form...');
    setIsOpen(false);
    setError(null);
    
    // Allow UI to update before resetting the form
    setTimeout(() => {
      resetForm();
      toast.info('Ready for new valuation attempt');
    }, 100);
  }, [resetForm, setError]);

  return {
    isOpen,
    setIsOpen,
    handleClose,
    handleRetry
  };
};
