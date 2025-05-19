
/**
 * Submission Logger Hook
 * Created: 2025-05-20
 * 
 * Provides consistent logging for form submissions with timestamp and formatting
 */

import { useCallback } from 'react';

export const useSubmissionLogger = () => {
  const logSubmissionEvent = useCallback((message: string, data: Record<string, any> = {}) => {
    const timestamp = new Date().toISOString();
    
    console.log(`[FormSubmission][${timestamp}] ${message}`, {
      ...data,
      timestamp: Date.now()
    });
  }, []);
  
  return {
    logSubmissionEvent
  };
};
