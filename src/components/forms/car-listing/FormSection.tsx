
/**
 * Changes made:
 * - Fixed type mismatch between FormSection and FormSectionHeader
 * - Added RequiredFieldsIndicator to form sections
 * - Enhanced section structure with better spacing
 */

import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import { FormSectionHeader } from "./FormSectionHeader";
import { RequiredFieldsIndicator } from "./RequiredFieldsIndicator";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  isOptional?: boolean;
  hasRequiredFields?: boolean;
  subtitle?: string;
  right?: ReactNode;
}

export const FormSection = ({
  title,
  description,
  subtitle,
  right,
  children,
  isOptional,
  hasRequiredFields = true
}: FormSectionProps) => {
  return (
    <Card className="border-none shadow-sm">
      <div className="p-6 space-y-4">
        {title && (
          <div className="space-y-1">
            <FormSectionHeader 
              title={title} 
              description={description}
              subtitle={subtitle}
              right={right}
            />
            {hasRequiredFields && <RequiredFieldsIndicator className="mt-1" />}
          </div>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </Card>
  );
};
