
/**
 * Form Data Context
 * Created: 2025-05-12
 * Updated: 2025-05-06 - Enhanced context to include isSubmitting state
 * Updated: 2025-05-15 - Added safety checks for form availability and error handling
 * Updated: 2025-07-24 - Improved error recovery and added safe access methods
 * Updated: 2025-08-18 - Enhanced useResilientFormData with better error messaging
 * Purpose: Provides form context for car listing forms
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface FormDataContextValue {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  isFormReady: boolean;
}

const FormDataContext = createContext<FormDataContextValue | undefined>(undefined);

export const FormDataProvider: React.FC<{
  children: React.ReactNode;
  form: UseFormReturn<any>;
}> = ({ children, form }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormReady = !!form && !!form.register;
  
  // Safety check to ensure form is properly initialized before rendering children
  if (!isFormReady) {
    console.error("FormDataProvider: Form is not properly initialized");
    
    // Return loading state instead of error to allow recovery
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-md">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }
  
  return (
    <FormDataContext.Provider value={{
      form,
      isSubmitting,
      setIsSubmitting,
      isFormReady
    }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = (): FormDataContextValue => {
  const context = useContext(FormDataContext);
  
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  
  return context;
};

// Safe version that doesn't throw errors, returns null if context is unavailable
export const useSafeFormData = (): FormDataContextValue | null => {
  try {
    return useContext(FormDataContext) || null;
  } catch (error) {
    console.error("Error accessing form context:", error);
    return null;
  }
};

/**
 * Hook that tries multiple approaches to get form data
 * providing the most resilient form context access
 */
export const useResilientFormData = (showToastOnError = false): FormDataContextValue | null => {
  // Memoize toast display function to avoid showing multiple toasts
  const showErrorToast = useCallback(() => {
    if (showToastOnError) {
      toast.error("Form context error", {
        description: "This section might not work properly. Try refreshing the page.",
        duration: 5000
      });
    }
  }, [showToastOnError]);

  try {
    // First try the standard context
    const context = useContext(FormDataContext);
    
    if (context) {
      return context;
    }
    
    // If no context, check localStorage for emergency backup (future functionality)
    // This is just a placeholder - we'll implement if needed in the future
    const emergencyBackup = null;
    
    // Log the error but don't throw
    console.warn("Form context not found - component may be outside FormDataProvider");
    
    if (showToastOnError) {
      showErrorToast();
    }
    
    return emergencyBackup || null;
  } catch (error) {
    console.error("Error in useResilientFormData:", error);
    if (showToastOnError) {
      showErrorToast();
    }
    return null;
  }
};
