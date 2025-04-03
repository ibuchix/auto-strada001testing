/**
 * Updated FormSections component
 * - Added proper typings for props
 * - Fixed type issues with form prop
 */
import { memo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface FormSectionsProps {
  form: UseFormReturn<CarListingFormData>;
  // Add any other props needed
}

export const FormSections = memo(({ form }: FormSectionsProps) => {
  return (
    <div className="form-sections">
      {/* Form section content goes here */}
    </div>
  );
});

FormSections.displayName = 'FormSections';
