
/**
 * Form Submit Handler Component
 * Updated: 2025-05-30 - Integrated proper image upload handling through Supabase Storage
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateRequiredPhotos } from "./utils/photoValidator";
import { prepareFormDataForSubmission } from "./utils/submission";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { standardizePhotoCategory, PHOTO_FIELD_MAP } from "@/utils/photoMapping";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/components/AuthProvider";
import { createCarListing } from "./services/submissionService";

export interface FormSubmitHandlerProps {
  onSuccess?: (data: any) => void;
  showAlerts?: boolean;
  userId?: string;
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
  carId?: string;
}

export const FormSubmitHandler: React.FC<FormSubmitHandlerProps> = ({ 
  onSuccess, 
  showAlerts = true,
  userId,
  onSubmitSuccess,
  onSubmitError,
  carId
}) => {
  const formContext = useFormContext<CarListingFormData>();
  
  if (!formContext) {
    console.error("FormSubmitHandler must be used within a FormProvider");
    return (
      <Button className="px-6" type="button" disabled>
        Submit Listing
      </Button>
    );
  }
  
  const { handleSubmit, formState } = formContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      const submissionId = uuidv4().slice(0, 8);
      console.log(`[FormSubmission][${submissionId}] Starting listing submission with image upload...`);
      
      // Validate required photos (files or URLs)
      const missingPhotoFields = validateRequiredPhotos(formData);
      
      if (missingPhotoFields.length > 0) {
        const formattedFields = missingPhotoFields.map(field => {
          const camelKey = Object.entries(PHOTO_FIELD_MAP).find(([_, v]) => v === field)?.[0];
          const displayName = camelKey || field;
          
          return displayName
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/\s(.)/g, (_, c) => ' ' + c.toUpperCase())
            .trim();
        });
        
        const errorMessage = `Missing required photos: ${formattedFields.join(', ')}`;
        console.error("Validation failed:", errorMessage);
        
        if (showAlerts) {
          toast.error("Missing Required Photos", {
            description: errorMessage,
          });
        }
        
        setIsSubmitting(false);
        return false;
      }
      
      // Prepare form data
      const preparedData = prepareFormDataForSubmission(formData);

      // Process valuation data and set reserve price
      if (formData.fromValuation || formData.valuationData) {
        console.log(`[FormSubmission][${submissionId}] Processing valuation data`);
        
        let valuationData = formData.valuationData;
        if (!valuationData) {
          try {
            const storedValuation = localStorage.getItem('valuationData');
            if (storedValuation) {
              valuationData = JSON.parse(storedValuation);
            }
          } catch (error) {
            console.error(`[FormSubmission][${submissionId}] Error parsing stored valuation:`, error);
          }
        }
        
        if (valuationData) {
          let reservePrice = valuationData.reservePrice || valuationData.reserve_price || valuationData.valuation;
          
          if (reservePrice && reservePrice > 0) {
            preparedData.reservePrice = reservePrice;
            console.log(`[FormSubmission][${submissionId}] Set reserve price:`, reservePrice);
          }
          
          preparedData.valuationData = {
            ...valuationData,
            reservePrice: reservePrice || valuationData.reservePrice
          };
        }
      }
      
      // Validate reserve price
      if (!preparedData.reservePrice || preparedData.reservePrice <= 0) {
        const errorMessage = "Reserve price must be greater than 0.";
        console.error(`[FormSubmission][${submissionId}] ${errorMessage}`);
        
        if (showAlerts) {
          toast.error("Invalid Reserve Price", {
            description: errorMessage,
          });
        }
        
        setIsSubmitting(false);
        return false;
      }
      
      const currentUserId = userId || session?.user?.id;
      
      if (!currentUserId) {
        toast.error("Authentication Error", {
          description: "Please log in to submit a listing",
        });
        setIsSubmitting(false);
        return false;
      }
      
      // Set seller ID
      preparedData.sellerId = currentUserId;
      
      console.log(`[FormSubmission][${submissionId}] Submitting listing with image upload handling...`);
      
      // Submit using the new service with image upload handling
      const result = await createCarListing(preparedData, currentUserId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }
      
      const newCarId = result.id;
      console.log(`[FormSubmission][${submissionId}] ✓ Listing created successfully with images:`, newCarId);
      
      // Success notification
      if (showAlerts) {
        toast.success("Listing Submitted Successfully", {
          description: "Your car listing with images is now available to dealers.",
        });
      }
      
      // Handle success callbacks
      if (onSuccess) {
        onSuccess(preparedData);
      } else if (onSubmitSuccess) {
        onSubmitSuccess(newCarId);
      } else {
        navigate("/dashboard/seller");
      }
      
      return true;
    } catch (error) {
      console.error("Error submitting car listing:", error);
      
      if (showAlerts) {
        toast.error("Submission Failed", {
          description: "There was an error submitting your car listing. Please try again.",
        });
      }
      
      if (onSubmitError && error instanceof Error) {
        onSubmitError(error);
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Button
      className="px-6"
      type="button"
      disabled={isSubmitting || formState.isSubmitting}
      onClick={handleSubmit(onSubmit)}
    >
      {isSubmitting || formState.isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading & Submitting...
        </>
      ) : (
        "Submit Listing"
      )}
    </Button>
  );
};
