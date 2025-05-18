/**
 * FormDataContext
 * Created: 2025-04-01
 * Updated: 2025-04-20 - Added support for saving draft state
 * Updated: 2025-04-30 - Fixed null reference errors
 * Updated: 2025-08-28 - Added resilient form data access for error prevention
 * 
 * This context provides the form data and methods to all components in the form.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

interface FormDataContextValue {
  form: UseFormReturn<CarListingFormData>;
  loading: boolean;
  error: Error | null;
}

const FormDataContext = createContext<FormDataContextValue | null>(null);

export const useFormData = (): FormDataContextValue => {
  const context = useContext(FormDataContext);
  
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  
  return context;
};

// Enhanced hook that tries multiple approaches to get form context
export const useResilientFormData = (allowNull = false): FormDataContextValue | null => {
  const context = useContext(FormDataContext);
  const [retriesLeft, setRetriesLeft] = useState(3);
  const [lastError, setLastError] = useState<Error | null>(null);
  const contextRef = useRef<FormDataContextValue | null>(null);
  
  // Keep the latest successful context in a ref
  useEffect(() => {
    if (context) {
      contextRef.current = context;
    }
  }, [context]);
  
  // If context is null but we have a previous context, use that
  if (!context && contextRef.current) {
    console.info('FormDataContext: Using cached context');
    return contextRef.current;
  }
  
  // If context is null and we're not allowing null, throw error
  // But only after retries are exhausted
  if (!context && !allowNull) {
    if (retriesLeft > 0) {
      console.warn(`FormDataContext: Context not available, retrying... (${retriesLeft} attempts left)`);
      setRetriesLeft(prev => prev - 1);
      
      // Schedule a retry
      setTimeout(() => {
        setRetriesLeft(prev => Math.min(prev + 1, 3)); // Restore one retry attempt
      }, 500);
      
      // Return dummy context to prevent errors
      return {
        form: {} as UseFormReturn<CarListingFormData>,
        loading: true,
        error: new Error('Form context temporarily unavailable')
      };
    }
    
    const error = new Error('useFormData must be used within a FormDataProvider');
    setLastError(error);
    throw error;
  }
  
  return context;
};

export const FormDataProvider: React.FC<{
  form: UseFormReturn<CarListingFormData>;
  loading?: boolean;
  error?: Error | null;
  children: React.ReactNode;
}> = ({
  form,
  loading = false,
  error = null,
  children
}) => {
  const [innerLoading, setInnerLoading] = useState(loading);
  const [innerError, setInnerError] = useState<Error | null>(error);
  const contextInitialized = useRef(false);
  
  useEffect(() => {
    if (!contextInitialized.current) {
      console.log('FormDataContext initialized');
      contextInitialized.current = true;
    }
    
    setInnerLoading(loading);
    setInnerError(error);
  }, [loading, error]);
  
  const value = {
    form,
    loading: innerLoading,
    error: innerError
  };
  
  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
};
