
/**
 * Form State Context for managing global form state
 * Created: 2025-04-17
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormState {
  isSubmitted: boolean;
  lastSubmitted: string | null;
  [key: string]: any;
}

interface FormStateContextType {
  formState: FormState;
  updateFormState: (updates: Partial<FormState>) => void;
}

const defaultFormState: FormState = {
  isSubmitted: false,
  lastSubmitted: null
};

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

export const FormStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  
  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  return (
    <FormStateContext.Provider value={{ formState, updateFormState }}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormState = (): FormStateContextType => {
  const context = useContext(FormStateContext);
  
  if (context === undefined) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  
  return context;
};
