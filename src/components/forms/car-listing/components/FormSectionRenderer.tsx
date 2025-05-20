
/**
 * FormSectionRenderer Component
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useValuationData } from "@/hooks/useValuationData";

interface FormSectionRendererProps {
  sections: {
    name: string;
    component: React.ComponentType<any>;
    condition?: (data: any) => boolean;
  }[];
}

export const FormSectionRenderer = ({ sections }: FormSectionRendererProps) => {
  const { form } = useFormData();
  const [isVoluntaryValuation, setIsVoluntaryValuation] = useState(false);
  const { getValuationData } = useValuationData();
  
  // Check if this form is coming from valuation
  useEffect(() => {
    const formData = form.getValues();
    const valuationData = getValuationData();
    
    // Check if form is from valuation
    const isFromValuation = formData.fromValuation === true || 
                           (valuationData !== null && Object.keys(valuationData).length > 0);
    
    setIsVoluntaryValuation(isFromValuation);
  }, [form, getValuationData]);
  
  return (
    <div className="space-y-8">
      {isVoluntaryValuation && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your vehicle information has been pre-filled based on your valuation. 
            Please review and confirm the details.
          </AlertDescription>
        </Alert>
      )}
      
      {sections.map((section, index) => {
        // Check if section should be rendered based on condition
        if (section.condition && !section.condition(form.getValues())) {
          return null;
        }
        
        return (
          <Card key={index} className="p-6">
            <section.component />
          </Card>
        );
      })}
    </div>
  );
};
