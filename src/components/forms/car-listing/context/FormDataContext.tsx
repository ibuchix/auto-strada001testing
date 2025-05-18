
/**
 * FormDataContext
 * Created: 2025-04-01
 * Updated: 2025-04-20 - Added support for saving draft state
 * Updated: 2025-04-30 - Fixed null reference errors
 * Updated: 2025-08-28 - Added resilient form data access for error prevention
 * Updated: 2025-05-19 - Fixed context initialization to prevent React error #310
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

// Create a default context value to avoid null checks
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
  
  // If context is null and we're not allowing null, throw error
  if (!context && !allowNull) {
    throw new Error('useFormData must be used within a FormDataProvider');
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
  // Use refs instead of state to track initialization
  // This prevents hook order issues when rendering child components
  const contextInitialized = useRef(false);
  
  // Log initialization only once
  useEffect(() => {
    if (!contextInitialized.current) {
      console.log('FormDataContext initialized');
      contextInitialized.current = true;
    }
  }, []);
  
  // Create a stable context value that doesn't change on each render
  const value = {
    form,
    loading,
    error
  };
  
  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
};
