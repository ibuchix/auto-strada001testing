
/**
 * Hook to manage retry logic for failed uploads
 */
import { useRef, useCallback } from 'react';

export const useRetryLogic = (maxRetries: number = 2) => {
  const attemptIdRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);

  // Log event information
  const logEvent = useCallback((event: string, data: any = {}) => {
    console.log(`[usePhotoUpload] ${event}:`, {
      ...data,
      timestamp: new Date().toISOString(),
      retryCount: retryCountRef.current
    });
  }, []);

  const resetRetryState = useCallback(() => {
    retryCountRef.current = 0;
    attemptIdRef.current = null;
  }, []);

  const incrementRetryCount = useCallback(() => {
    retryCountRef.current++;
  }, []);

  const resetUploadState = useCallback(() => {
    logEvent('resetUploadState', { message: 'Reset upload state' });
    resetRetryState();
  }, [logEvent, resetRetryState]);

  return {
    attemptIdRef,
    retryCountRef,
    resetRetryState,
    incrementRetryCount,
    logEvent,
    resetUploadState
  };
};
