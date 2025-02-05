
import { createContext, useContext } from "react";
import { FormSubmissionContextType, FormSubmissionProviderProps } from "./types";
import { useFormSubmission } from "./useFormSubmission";

const FormSubmissionContext = createContext<FormSubmissionContextType | null>(null);

export const useFormSubmissionContext = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error("useFormSubmissionContext must be used within a FormSubmissionProvider");
  }
  return context;
};

export const FormSubmissionProvider = ({ children, userId }: FormSubmissionProviderProps) => {
  const formSubmission = useFormSubmission(userId);

  return (
    <FormSubmissionContext.Provider value={formSubmission}>
      {children}
    </FormSubmissionContext.Provider>
  );
};
