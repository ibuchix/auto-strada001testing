
/**
 * Created 2028-05-15: Form error context for centralized error handling
 * Provides centralized error tracking and recovery options for form components
 */

import { 
  createContext, 
  useContext, 
  useCallback, 
  useState, 
  useMemo, 
  ReactNode 
} from "react";
import { toast } from "sonner";

interface FormError {
  id: string;
  message: string;
  componentName?: string;
  timestamp: number;
  details?: any;
  recovered?: boolean;
}

interface FormErrorContextValue {
  errors: FormError[];
  hasErrors: boolean;
  captureError: (error: Error | string, componentName?: string, details?: any) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  markErrorRecovered: (id: string) => void;
}

const FormErrorContext = createContext<FormErrorContextValue | null>(null);

interface FormErrorProviderProps {
  children: ReactNode;
  showToasts?: boolean;
  formId?: string;
}

export const FormErrorProvider = ({
  children,
  showToasts = true,
  formId = 'default'
}: FormErrorProviderProps) => {
  const [errors, setErrors] = useState<FormError[]>([]);
  
  const captureError = useCallback((
    error: Error | string, 
    componentName?: string,
    details?: any
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    console.error(`[FormError:${formId}] Error in ${componentName || 'unknown'}:`, errorMessage, details || '');
    
    const newError: FormError = {
      id: errorId,
      message: errorMessage,
      componentName,
      timestamp: Date.now(),
      details: details || (error instanceof Error ? { stack: error.stack } : undefined),
    };
    
    setErrors(prev => [...prev, newError]);
    
    if (showToasts) {
      toast.error(`Form Error${componentName ? ` in ${componentName}` : ''}`, {
        description: errorMessage.substring(0, 100) + (errorMessage.length > 100 ? '...' : '')
      });
    }
    
    return errorId;
  }, [formId, showToasts]);
  
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);
  
  const markErrorRecovered = useCallback((id: string) => {
    setErrors(prev => 
      prev.map(e => e.id === id ? { ...e, recovered: true } : e)
    );
  }, []);
  
  const contextValue = useMemo(() => ({
    errors,
    hasErrors: errors.length > 0,
    captureError,
    clearErrors,
    clearError,
    markErrorRecovered
  }), [errors, captureError, clearErrors, clearError, markErrorRecovered]);
  
  return (
    <FormErrorContext.Provider value={contextValue}>
      {children}
    </FormErrorContext.Provider>
  );
};

export const useFormError = () => {
  const context = useContext(FormErrorContext);
  if (!context) {
    throw new Error('useFormError must be used within a FormErrorProvider');
  }
  return context;
};
