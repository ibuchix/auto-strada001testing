
/**
 * Changes made:
 * - Created new ValidationSummary component to display form validation errors
 * - Component shows errors in a clean, organized manner with error icons
 * - Provides clickable errors that focus on the relevant form fields
 */

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCarFormValidationErrors } from "@/validation/carListing";
import { CarListingFormData } from "@/types/forms";

interface ValidationSummaryProps {
  formData: CarListingFormData;
  visible: boolean;
}

export const ValidationSummary = ({ formData, visible }: ValidationSummaryProps) => {
  const errors = getCarFormValidationErrors(formData);
  
  if (!visible || errors.length === 0) {
    return null;
  }
  
  const scrollToField = (fieldId: string) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };
  
  // Map common error texts to field IDs for scrolling
  const errorToFieldMap: Record<string, string> = {
    "VIN is required": "vin",
    "Invalid VIN format": "vin",
    "Car make is required": "make",
    "Car model is required": "model",
    "Year is required": "year",
    "Price must be greater than 0": "price",
    "Mileage cannot be negative": "mileage",
    "At least one photo is required": "photo-upload"
  };
  
  const getFieldId = (error: string): string | undefined => {
    for (const [errorText, fieldId] of Object.entries(errorToFieldMap)) {
      if (error.includes(errorText)) {
        return fieldId;
      }
    }
    return undefined;
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4 mt-0.5" />
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p>Please fix the following issues before submitting:</p>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error, index) => {
              const fieldId = getFieldId(error);
              return (
                <li key={index} className="text-sm">
                  {fieldId ? (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-destructive hover:text-destructive/90 font-normal underline text-left"
                      onClick={() => scrollToField(fieldId)}
                    >
                      {error}
                    </Button>
                  ) : (
                    <span>{error}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
