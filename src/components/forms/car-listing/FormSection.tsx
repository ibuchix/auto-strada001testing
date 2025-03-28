
/**
 * Changes made:
 * - Added RequiredFieldsIndicator to form sections
 * - Enhanced section structure with better spacing
 */

import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import { FormSectionHeader } from "./FormSectionHeader";
import { RequiredFieldsIndicator } from "./RequiredFieldsIndicator";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isOptional?: boolean;
  hasRequiredFields?: boolean;
}

export const FormSection = ({
  title,
  description,
  children,
  isOptional,
  hasRequiredFields = true
}: FormSectionProps) => {
  return (
    <Card className="border-none shadow-sm">
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <FormSectionHeader title={title} description={description} isOptional={isOptional} />
          {hasRequiredFields && <RequiredFieldsIndicator className="mt-1" />}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </Card>
  );
};
