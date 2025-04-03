
/**
 * Updated FormSections component
 * - Updated to use FormDataContext
 * - Removed direct form prop dependency
 */
import { memo } from "react";
import { useFormData } from "./context/FormDataContext";

export const FormSections = memo(() => {
  // Get form from context instead of props
  const { form } = useFormData();
  
  return (
    <div className="form-sections">
      {/* Form section content goes here */}
    </div>
  );
});

FormSections.displayName = 'FormSections';
