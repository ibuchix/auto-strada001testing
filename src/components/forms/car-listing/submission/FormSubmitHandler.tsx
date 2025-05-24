
/**
 * Form Submit Handler Component
 * Updated: 2025-05-24 - COMPLETELY REMOVED ALL DRAFT LOGIC - All submissions are immediate
 * Updated: 2025-05-24 - SIMPLIFIED image handling with direct storage in required_photos
 * Updated: 2025-05-24 - ENHANCED valuation data preservation to fix reserve price display
 * Updated: 2025-05-24 - Fixed naming convention consistency for reserve price display
 * Updated: 2025-05-24 - Fixed price setting to use reserve price as listed price for valuation-based listings
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
  
  const { handleSubmit, formState, getValues } = formContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      const submissionId = uuidv4().slice(0, 8);
      console.log(`[FormSubmission][${submissionId}] Starting IMMEDIATE listing submission...`);
      
      // ENHANCED LOGGING: Track valuation data through the entire process
      console.log(`[FormSubmission][${submissionId}] Valuation data tracking:`, {
        formData_reservePrice: formData.reservePrice,
        valuationData_reservePrice: formData.valuationData?.reservePrice,
        valuationData_reserve_price: formData.valuationData?.reserve_price,
        valuationData_valuation: formData.valuationData?.valuation,
        valuationData_exists: !!formData.valuationData,
        valuationData_keys: formData.valuationData ? Object.keys(formData.valuationData) : [],
        fromValuation: formData.fromValuation
      });
      
      // Validate required photos
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
      
      // Prepare form data - NO DRAFT LOGIC
      const preparedData = prepareFormDataForSubmission(formData);

      // CRITICAL: Process valuation data and set pricing correctly
      if (formData.fromValuation || formData.valuationData) {
        console.log(`[FormSubmission][${submissionId}] Processing valuation data`);
        
        // Get valuation data from form or localStorage if not present
        let valuationData = formData.valuationData;
        if (!valuationData) {
          try {
            const storedValuation = localStorage.getItem('valuationData');
            if (storedValuation) {
              valuationData = JSON.parse(storedValuation);
              console.log(`[FormSubmission][${submissionId}] Retrieved valuation from localStorage`);
            }
          } catch (error) {
            console.error(`[FormSubmission][${submissionId}] Error parsing stored valuation:`, error);
          }
        }
        
        if (valuationData) {
          // CRITICAL: Get reserve price - handle multiple naming conventions
          let reservePrice = null;
          if (valuationData.reservePrice) {
            reservePrice = valuationData.reservePrice;
          } else if (valuationData.reserve_price) {
            reservePrice = valuationData.reserve_price;
          } else if (valuationData.valuation) {
            reservePrice = valuationData.valuation;
          }
          
          if (reservePrice && reservePrice > 0) {
            // CRITICAL: Set BOTH price and reserve price to the same value
            preparedData.price = reservePrice;
            preparedData.reservePrice = reservePrice;
            console.log(`[FormSubmission][${submissionId}] Set both price and reserve price from valuation:`, {
              price: preparedData.price,
              reservePrice: preparedData.reservePrice
            });
          }
          
          // CRITICAL: Preserve complete valuation data object with camelCase structure
          preparedData.valuationData = {
            ...valuationData,
            // Ensure reservePrice is in camelCase for consistency
            reservePrice: reservePrice || valuationData.reservePrice
          };
          console.log(`[FormSubmission][${submissionId}] Preserved complete valuation data with camelCase structure`);
        }
      }
      
      // Validate that price is set and greater than 0
      if (!preparedData.price || preparedData.price <= 0) {
        const errorMessage = "Price must be greater than 0. Please ensure valuation data is properly loaded.";
        console.error(`[FormSubmission][${submissionId}] ${errorMessage}`, {
          price: preparedData.price,
          hasValuationData: !!preparedData.valuationData
        });
        
        if (showAlerts) {
          toast.error("Invalid Price", {
            description: errorMessage,
          });
        }
        
        setIsSubmitting(false);
        return false;
      }
      
      // ENHANCED LOGGING: Track final prepared data
      console.log(`[FormSubmission][${submissionId}] Final prepared data:`, {
        price: preparedData.price,
        reservePrice: preparedData.reservePrice,
        hasValuationData: !!preparedData.valuationData,
        valuationDataKeys: preparedData.valuationData ? Object.keys(preparedData.valuationData) : [],
        valuationDataReservePrice: preparedData.valuationData?.reservePrice
      });
      
      const currentUserId = userId || session?.user?.id;
      
      if (!currentUserId) {
        toast.error("Authentication Error", {
          description: "Please log in to submit a listing",
        });
        setIsSubmitting(false);
        return false;
      }
      
      // Set seller ID for ownership
      preparedData.sellerId = currentUserId;
      
      console.log(`[FormSubmission][${submissionId}] Submitting IMMEDIATE listing:`, {
        dataKeys: Object.keys(preparedData),
        userId: currentUserId,
        price: preparedData.price,
        reservePrice: preparedData.reservePrice,
        hasRequiredPhotos: !!preparedData.requiredPhotos,
        hasValuationData: !!preparedData.valuationData,
        valuationDataStructure: preparedData.valuationData ? Object.keys(preparedData.valuationData) : 'none'
      });
      
      // Submit directly - NO DRAFT STATUS
      let result;
      try {
        console.log(`[FormSubmission][${submissionId}] Creating IMMEDIATE available listing...`);
        result = await createCarListing(preparedData, currentUserId);
        console.log(`[FormSubmission][${submissionId}] ✓ Listing created successfully, car ID: ${result.id}`);
      } catch (submissionError) {
        console.error(`[FormSubmission][${submissionId}] ✗ Submission failed:`, submissionError);
        throw submissionError;
      }
      
      const newCarId = result.id;
      
      // Success notification
      if (showAlerts) {
        toast.success("Listing Submitted Successfully", {
          description: "Your car listing is now available to dealers.",
        });
      }
      
      // Handle success callbacks
      if (onSuccess) {
        onSuccess(preparedData);
      } else if (onSubmitSuccess) {
        onSubmitSuccess(newCarId);
      } else {
        // Default: redirect to seller dashboard
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
          Submitting...
        </>
      ) : (
        "Submit Listing"
      )}
    </Button>
  );
};
