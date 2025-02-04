import { createContext, useContext, ReactNode } from "react";
import { useFormSubmission } from "../hooks/useFormSubmission";

type FormSubmissionContextType = ReturnType<typeof useFormSubmission>;

const FormSubmissionContext = createContext<FormSubmissionContextType | null>(null);

export const useFormSubmissionContext = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error("useFormSubmissionContext must be used within a FormSubmissionProvider");
  }
  return context;
};

export const FormSubmissionProvider = ({ 
  children,
  userId 
}: { 
  children: ReactNode;
  userId?: string;
}) => {
  const submissionContext = useFormSubmission(userId);

  return (
    <FormSubmissionContext.Provider value={submissionContext}>
      {children}
    </FormSubmissionContext.Provider>
  );
};