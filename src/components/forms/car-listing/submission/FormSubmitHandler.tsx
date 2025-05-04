
/**
 * Form Submit Handler
 * Created: 2025-06-17
 * Updated: 2025-06-21 - Fixed data handling and null checks
 * Updated: 2025-06-22 - Fixed type error with Supabase response handling
 * Updated: 2025-08-24 - Fixed damagePhotos mapping to additional_photos field
 * Updated: 2025-05-04 - Fixed has_finance error by removing field and using finance_amount
 * 
 * Component to handle form submission logic
 */

import { useState } from "react";
import { FormSubmitButton } from "../FormSubmitButton";
import { useFormData } from "../context/FormDataContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { tempFileStorage } from "@/services/temp-storage/tempFileStorageService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { transformFormToDbRecord } from "../utils/formDataTransformers";
import { resetSchemaValidationCache } from "@/utils/validation/schema";

interface FormSubmitHandlerProps {
  carId?: string;
  userId?: string;
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const FormSubmitHandler = ({
  carId,
  userId,
  onSubmitSuccess,
  onSubmitError
}: FormSubmitHandlerProps) => {
  const { form } = useFormData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      console.log("Starting form submission process...");
      
      // Validate form data
      const isValid = await form.trigger();
      if (!isValid) {
        setSubmitError("Please complete all required fields before submitting.");
        return;
      }
      
      const formValues = form.getValues();
      console.log("Form validation passed, preparing data for submission");
      
      // Check for required fields
      if (!formValues.make || !formValues.model || !formValues.year || !formValues.mileage) {
        setSubmitError("Please complete all required vehicle information.");
        return;
      }
      
      // Check if photos are uploaded
      if (!formValues.vehiclePhotos?.frontView) {
        setSubmitError("Please upload at least the front view photo of your vehicle.");
        return;
      }
      
      // Reset schema validation cache to prevent stale schema errors
      try {
        resetSchemaValidationCache('cars');
        console.log("Schema validation cache reset");
      } catch (cacheError) {
        console.error("Failed to reset schema cache:", cacheError);
        // Continue despite cache reset error
      }
      
      // Transform form data to database format with proper field mapping
      const transformedData = transformFormToDbRecord(formValues);
      
      // Process rim photos and add them to additional_photos if they exist
      if (formValues.rimPhotos) {
        // Create array if it doesn't exist
        if (!transformedData.additional_photos) {
          transformedData.additional_photos = [];
        }
        
        // Add each rim photo with metadata to identify it as a rim photo
        Object.entries(formValues.rimPhotos).forEach(([position, photoUrl]) => {
          if (photoUrl) {
            transformedData.additional_photos.push({
              url: photoUrl,
              type: 'rim_photo',
              position: position,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
      // Map damagePhotos to additional_photos since that's the column in the database
      if (formValues.damagePhotos && formValues.damagePhotos.length > 0) {
        if (!transformedData.additional_photos) {
          transformedData.additional_photos = [];
        }
        
        // Add each damage photo with appropriate metadata
        formValues.damagePhotos.forEach((photoUrl) => {
          transformedData.additional_photos.push({
            url: photoUrl,
            type: 'damage_photo',
            timestamp: new Date().toISOString()
          });
        });
        
        // Remove the damagePhotos field to prevent schema validation errors
        delete transformedData.damagePhotos;
      }
      
      // Add metadata fields
      const submissionData = {
        ...transformedData,
        seller_id: userId || formValues.seller_id,
        updated_at: new Date().toISOString(),
        created_at: formValues.created_at ? new Date(formValues.created_at).toISOString() : new Date().toISOString(),
        status: carId ? 'pending' : 'draft'
      };
      
      console.log("Submitting data to database");
      
      // Submit to Supabase
      const { data, error } = await supabase
        .from('cars')
        .upsert(submissionData, { onConflict: 'id' })
        .select('id')
        .single();
      
      if (error) {
        console.error("Database error during submission:", error);
        throw new Error(error.message);
      }
      
      console.log("Form submitted successfully", data);
      
      toast({
        title: "Form Submitted Successfully",
        description: "Your car listing has been submitted and is pending review."
      });
      
      if (onSubmitSuccess && data) {
        onSubmitSuccess(data.id);
      }
      
      // Clear temporary storage
      tempFileStorage.clearAll();
      
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitError(error.message || "Failed to submit form. Please try again.");
      
      if (onSubmitError) {
        onSubmitError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <FormSubmitButton
          isSubmitting={isSubmitting}
          loadingText="Submitting your listing..."
          formId="car-listing-form"
          onSubmitClick={handleSubmit}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90"
        >
          Submit Listing
        </FormSubmitButton>
      </div>
    </div>
  );
};
