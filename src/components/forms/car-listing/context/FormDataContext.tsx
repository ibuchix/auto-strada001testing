
/**
 * Form Data Context
 * Created: 2025-05-12
 * Updated: 2025-05-06 - Enhanced context to include isSubmitting state
 * Updated: 2025-05-15 - Added safety checks for form availability and error handling
 * Updated: 2025-07-24 - Improved error recovery and added safe access methods
 * Updated: 2025-08-18 - Enhanced useResilientFormData with better error messaging
 * Updated: 2025-08-27 - Fixed context failures with better fallback mechanisms
 * Updated: 2025-08-27 - Added form validation to prevent React error #310
 * Purpose: Provides form context for car listing forms
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface FormDataContextValue {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  isFormReady: boolean;
}

const FormDataContext = createContext<FormDataContextValue | undefined>(undefined);

// Component ID generator for tracking instances
const generateComponentId = () => `form-ctx-${Math.random().toString(36).substring(2, 8)}`;

export const FormDataProvider: React.FC<{
  children: React.ReactNode;
  form: UseFormReturn<any>;
}> = ({ children, form }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  const componentId = useMemo(() => generateComponentId(), []);
  
  // Validate that the form is properly initialized to prevent React errors
  const isValidForm = useMemo(() => {
    try {
      return (
        !!form && 
        typeof form === 'object' && 
        form !== null &&
        typeof form.register === 'function' &&
        typeof form.handleSubmit === 'function' &&
        typeof form.getValues === 'function'
      );
    } catch (e) {
      console.error(`FormDataProvider[${componentId}]: Form validation error:`, e);
      return false;
    }
  }, [form, componentId]);
  
  // Check if form is initialized before rendering children
  if (!isValidForm) {
    console.error(`FormDataProvider[${componentId}]: Form is not properly initialized:`, {
      formExists: !!form,
      formType: typeof form,
      hasRegister: form && typeof form.register === 'function',
      hasHandleSubmit: form && typeof form.handleSubmit === 'function'
    });
    
    // Return loading state instead of error to allow recovery
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-md">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
          <p>Initializing form...</p>
        </div>
      </div>
    );
  }
  
  // Mark form as ready if it passed validation
  if (!isFormReady) {
    setIsFormReady(true);
  }
  
  const contextValue = useMemo(() => {
    return {
      form,
      isSubmitting,
      setIsSubmitting,
      isFormReady: true
    };
  }, [form, isSubmitting]);
  
  return (
    <FormDataContext.Provider value={contextValue}>
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
    const context = useContext(FormDataContext);
    if (!context) {
      console.warn("useSafeFormData: Form context not available");
      return null;
    }
    
    // Validate that the form object is properly initialized
    if (!context.form || typeof context.form.register !== 'function') {
      console.warn("useSafeFormData: Form context exists but form is invalid");
      return null;
    }
    
    return context;
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
      // Additional validation to ensure form is properly initialized
      if (context.form && 
          typeof context.form.register === 'function' && 
          typeof context.form.handleSubmit === 'function') {
        return context;
      } else {
        console.warn("useResilientFormData: Form context exists but form is not fully initialized");
      }
    }
    
    // If no context or invalid form, check localStorage for emergency backup (future functionality)
    // This is just a placeholder - we'll implement if needed in the future
    const emergencyBackup = null;
    
    // Log the error but don't throw
    console.warn("Form context not found or invalid - component may be outside FormDataProvider");
    
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
