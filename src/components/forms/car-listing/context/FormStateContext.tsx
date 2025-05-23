
/**
 * FormStateContext for car listing form
 * Created: 2025-07-12
 * Updated: 2025-07-23 - Extended context type definition with additional fields
 * Updated: 2025-05-26 - Enhanced context with better error handling and improved type definitions
 * Provides form state context for the car listing form
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormState {
  isInitializing: boolean;
  currentStep: number;
  lastSaved: Date | null;
  carId?: string;
  draftLoadError: Error | null;
  filteredStepsArray: Array<any>;
  totalSteps: number;
  hasInitializedHooks: boolean;
  lastStep?: number;
  isComplete?: boolean;
  isSubmitted?: boolean;
  lastSubmitted?: string | null;
}

interface FormStateContextType {
  formState: FormState;
  updateFormState: (updater: Partial<FormState> | ((prev: FormState) => FormState)) => void;
}

const defaultFormState: FormState = {
  isInitializing: true,
  currentStep: 0,
  lastSaved: null,
  carId: undefined,
  draftLoadError: null,
  filteredStepsArray: [],
  totalSteps: 1,
  hasInitializedHooks: false,
  isSubmitted: false,
  lastSubmitted: null
};

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

export const FormStateProvider = ({ children, initialState = {} }: { children: ReactNode, initialState?: Partial<FormState> }) => {
  const [formState, setFormState] = useState<FormState>({
    ...defaultFormState,
    ...initialState
  });
  
  const updateFormState = (updater: Partial<FormState> | ((prev: FormState) => FormState)) => {
    if (typeof updater === 'function') {
      setFormState(updater);
    } else {
      setFormState(prev => ({
        ...prev,
        ...updater
      }));
    }
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
    throw new Error('useFormState must be used within a FormStateProvider (car-listing specific version)');
  }
  
  return context;
};
