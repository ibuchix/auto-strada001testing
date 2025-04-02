
/**
 * Changes made:
 * - 2024-06-10: Extracted form state management from FormContent.tsx
 * - Created a provider component to manage form state
 */

import { createContext, useContext, useState, ReactNode } from "react";

interface FormState {
  isInitializing: boolean;
  currentStep: number;
  lastSaved: Date | null;
  carId?: string;
  draftLoadError: Error | null;
  filteredStepsArray: Array<any>;
  totalSteps: number;
  hasInitializedHooks: boolean;
}

interface FormStateContextType {
  formState: FormState;
  updateFormState: (updater: (prev: FormState) => FormState) => void;
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

interface FormStateProviderProps {
  children: ReactNode;
  initialState?: Partial<FormState>;
}

export const FormStateProvider = ({ children, initialState = {} }: FormStateProviderProps) => {
  const [formState, setFormState] = useState<FormState>({
    isInitializing: true,
    currentStep: 0,
    lastSaved: null,
    carId: undefined,
    draftLoadError: null,
    filteredStepsArray: [],
    totalSteps: 1,
    hasInitializedHooks: false,
    ...initialState
  });

  const updateFormState = (updater: (prev: FormState) => FormState) => {
    setFormState(updater);
  };

  return (
    <FormStateContext.Provider value={{ formState, updateFormState }}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormState = () => {
  const context = useContext(FormStateContext);
  if (context === undefined) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
};
