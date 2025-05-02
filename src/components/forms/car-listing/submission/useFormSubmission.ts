
/**
 * Updated submission hook with proper type returns for FormSubmissionProvider
 * - 2025-04-03: Added missing properties for FormSubmissionContextType
 * - 2025-04-03: Fixed TransactionStatus enum usage to use proper type
 * - 2025-04-06: Fixed error code type comparisons
 * - 2025-05-02: Updated to upload temporary files when form is submitted
 * - 2025-05-03: Fixed carId type error by adding field to submission result interface
 */

import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { validateSubmission } from "./services/validationService";
import { submitCarListing } from "./services/submissionService";
import { ValidationError } from "./errors";
import { ErrorCode } from "@/errors/types";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { tempFileStorage, TempStoredFile } from "@/services/temp-storage/tempFileStorageService";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Define submission result interface with carId
interface SubmissionResult {
  carId: string;
  [key: string]: any;
}

// Create a simple validation function to replace the missing import
const validateFormData = (data: CarListingFormData): string[] => {
  const errors: string[] = [];
  
  // Add basic validation checks
  if (!data.make) errors.push("Make is required");
  if (!data.model) errors.push("Model is required");
  if (!data.year) errors.push("Year is required");
  if (!data.mileage) errors.push("Mileage is required");
  
  return errors;
};

export const useFormSubmission = (userId: string) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const resetTransaction = () => {
    setError(null);
    setTransactionStatus(null);
    setUploadProgress(0);
  };
  
  // Helper function to upload a single file to Supabase Storage
  const uploadFileToStorage = async (file: TempStoredFile, carId: string): Promise<string | null> => {
    try {
      // Create unique file path
      const fileExt = file.file.name.split('.').pop();
      const fileName = `${carId}/${file.category}/${uuidv4()}.${fileExt}`;
      
      // Upload to the car-images bucket with proper categorization
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(fileName, file.file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${file.category} file:`, error);
      return null;
    }
  };
  
  // Upload all temporary files to Supabase Storage
  const uploadAllFiles = async (carId: string): Promise<Record<string, any>> => {
    const allFiles = tempFileStorage.getAllFiles();
    const totalFiles = allFiles.length;
    
    if (totalFiles === 0) {
      return {};
    }
    
    const uploadedFiles: Record<string, any> = {
      requiredPhotos: {},
      damagePhotos: [],
      serviceHistoryFiles: [],
      rimPhotos: {},
      additionalPhotos: []
    };
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const publicUrl = await uploadFileToStorage(file, carId);
      
      // Update progress
      setUploadProgress(Math.round((i + 1) / totalFiles * 100));
      
      if (!publicUrl) continue;
      
      // Organize files by category
      if (file.category.startsWith('required_')) {
        const photoType = file.category.replace('required_', '');
        uploadedFiles.requiredPhotos[photoType] = publicUrl;
      } else if (file.category === 'damage_photos') {
        uploadedFiles.damagePhotos.push(publicUrl);
      } else if (file.category === 'service_history') {
        uploadedFiles.serviceHistoryFiles.push(publicUrl);
      } else if (file.category.startsWith('rim_')) {
        const rimPosition = file.category.replace('rim_', '');
        uploadedFiles.rimPhotos[rimPosition] = publicUrl;
      } else if (file.category === 'additional_photos') {
        uploadedFiles.additionalPhotos.push(publicUrl);
      }
    }
    
    return uploadedFiles;
  };
  
  const handleSubmit = async (data: CarListingFormData, carId?: string): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    setTransactionStatus(TransactionStatus.PENDING);
    setUploadProgress(0);
    
    try {
      // Validate the form data before submitting
      const clientSideErrors = validateFormData(data);
      
      if (clientSideErrors.length > 0) {
        console.error("Form validation errors:", clientSideErrors);
        toast.error("Please fix the following errors before submitting", {
          description: clientSideErrors.join(", ")
        });
        setIsSubmitting(false);
        setError("Validation failed");
        setTransactionStatus(TransactionStatus.ERROR);
        return;
      }
      
      // Add required fields
      data.seller_id = userId;
      
      // First submit the form data to get a car ID
      toast.info("Submitting your listing...", {
        description: "This may take a few moments. Please don't close this page."
      });
      
      // Perform server-side validation
      await validateSubmission(data, userId);
      
      // Submit the car listing to get an ID (or use existing ID)
      const submissionResult = await submitCarListing(data, userId, carId) as SubmissionResult;
      const submittedCarId = submissionResult.carId || carId;
      
      if (!submittedCarId) {
        throw new Error("Failed to create car listing. No car ID returned.");
      }
      
      // Now upload all files
      toast.info("Uploading photos and documents...", {
        description: "This may take several minutes depending on the number and size of files."
      });
      
      const uploadedFiles = await uploadAllFiles(submittedCarId);
      
      // Update the car record with the uploaded files
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          required_photos: uploadedFiles.requiredPhotos,
          damage_photos: uploadedFiles.damagePhotos,
          service_history_files: uploadedFiles.serviceHistoryFiles,
          rim_photos: uploadedFiles.rimPhotos,
          additional_photos: uploadedFiles.additionalPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', submittedCarId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Clear temporary storage after successful submission
      tempFileStorage.clearAll();
      localStorage.removeItem('car_form_data');
      
      // Show success message
      toast.success("Car listing submitted successfully!");
      setTransactionStatus(TransactionStatus.SUCCESS);
      
      // Navigate to success page or dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting car listing:", error);
      setTransactionStatus(TransactionStatus.ERROR);
      
      if (error instanceof ValidationError) {
        setError(error.message);
        
        // Use direct comparisons with ErrorCode enum for proper TypeScript checking
        switch (error.code) {
          case ErrorCode.SCHEMA_VALIDATION_ERROR:
            toast.error("Form validation failed", { description: error.description });
            break;
          case ErrorCode.INCOMPLETE_FORM:
            toast.error("Form incomplete", { description: error.description });
            break;
          case ErrorCode.RATE_LIMIT_EXCEEDED:
            toast.error("Submission limit reached", { description: error.description });
            break;
          case ErrorCode.SERVER_VALIDATION_FAILED:
            toast.error("Validation failed", { description: error.description });
            break;
          default:
            toast.error("An error occurred", { description: error.description });
        }
      } else {
        setError("Unknown error");
        toast.error(
          "Failed to submit car listing", 
          { description: "Please try again later." }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { 
    handleSubmit, 
    isSubmitting,
    uploadProgress,
    error, 
    transactionStatus,
    showSuccessDialog, 
    setShowSuccessDialog,
    resetTransaction 
  };
};
