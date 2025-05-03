
/**
 * Changes made:
 * - 2024-07-30: Created form submission hook to handle car listing submissions
 * - 2024-08-14: Added error handling and transaction status tracking
 * - 2025-04-03: Fixed TypeScript errors with missing properties 
 * - 2025-07-01: Fixed TransactionStatus import and references
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTransaction } from "@/hooks/useTransaction";
import { uploadImagesForCar } from "@/services/supabase/uploadService";
import { saveCarListing, updateCarListing } from "@/services/supabase/carService";
import { CarListingFormData } from "@/types/forms";
import { SubmissionError } from "./errors";
import { ErrorCode } from "@/errors/types";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { tempFileStorage, TempStoredFile } from "@/services/temp-storage/tempFileStorageService";
import { supabase } from "@/integrations/supabase/client";

export const useFormSubmission = (userId: string) => {
  const navigate = useNavigate();
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const { startTransaction, completeTransaction, failTransaction } = useTransaction();
  
  const resetTransaction = useCallback(() => {
    setTransactionStatus(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = useCallback(
    async (data: CarListingFormData, carId?: string) => {
      if (!userId) {
        setError("User ID is required. Please sign in and try again.");
        return;
      }

      if (isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);
        setTransactionStatus(TransactionStatus.PENDING);
        setError(null);

        const transactionId = await startTransaction({
          entityType: "car_listing",
          userId: userId,
          metadata: { formData: { make: data.make, model: data.model } },
        });

        let carDataToSave = { ...data, seller_id: userId };
        console.log("Processing form submission:", {
          isUpdate: !!carId,
          dataSnapshot: { make: data.make, model: data.model, year: data.year },
        });

        // Step 1: Upload photos if they exist as File objects
        const photoFields = [
          "exteriorPhotos",
          "interiorPhotos",
          "damagePhotos",
          "documentPhotos",
          "serviceHistoryPhotos",
        ];

        const uploadPromises: Promise<any>[] = [];
        const uploadedImagePaths: Record<string, string[]> = {};

        console.log("Checking for photos to upload...");

        // Find temp photos that need to be processed
        for (const field of photoFields) {
          const photos = tempFileStorage.getFilesForField(field);
          if (photos && photos.length > 0) {
            console.log(`Found ${photos.length} photos for ${field}`);
            uploadPromises.push(
              processPhotosForField(field, photos, carId || "new", userId)
                .then((paths) => {
                  uploadedImagePaths[field] = paths;
                })
                .catch((err) => {
                  console.error(`Error uploading ${field}:`, err);
                  throw new SubmissionError(
                    `Failed to upload ${field.replace("Photos", "")} photos.`,
                    { code: ErrorCode.FILE_UPLOAD_ERROR }
                  );
                })
            );
          }
        }

        if (uploadPromises.length > 0) {
          console.log(`Uploading ${uploadPromises.length} photo sets...`);
          await Promise.all(uploadPromises);
          console.log("All photos uploaded successfully");

          // Merge uploaded image paths into form data
          for (const [field, paths] of Object.entries(uploadedImagePaths)) {
            if (paths.length > 0) {
              carDataToSave = {
                ...carDataToSave,
                [field]: paths,
              };
            }
          }
        }

        // Step 2: Save/update the car data
        let savedCarId: string;
        if (carId) {
          console.log(`Updating existing car listing: ${carId}`);
          savedCarId = await updateCarListing(carId, carDataToSave);
        } else {
          console.log("Creating new car listing");
          savedCarId = await saveCarListing(carDataToSave);
        }

        console.log(`Car listing ${carId ? "updated" : "created"} with ID: ${savedCarId}`);

        // Step 3: Complete transaction and show success state
        await completeTransaction(transactionId, { carId: savedCarId });
        setTransactionStatus(TransactionStatus.SUCCESS);
        setShowSuccessDialog(true);
        console.log("Form submission completed successfully");

      } catch (err) {
        console.error("Form submission failed:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setTransactionStatus(TransactionStatus.ERROR);

        // Attempt to get the transaction ID from the transaction context
        const transactionId = window.__transactionId;
        if (transactionId) {
          await failTransaction(transactionId, { 
            error: err instanceof Error ? err.message : "Unknown error"
          });
        }

      } finally {
        setIsSubmitting(false);
        // Clear temporary storage after submission (regardless of outcome)
        tempFileStorage.clearAll();
      }
    },
    [userId, isSubmitting, startTransaction, completeTransaction, failTransaction]
  );

  return {
    handleSubmit,
    isSubmitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    resetTransaction,
  };
};

// Helper function to process and upload photos for a specific field
async function processPhotosForField(
  fieldName: string,
  photos: TempStoredFile[],
  carId: string,
  userId: string
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];

  console.log(`Processing ${photos.length} photos for ${fieldName}`);
  const category = fieldName.replace("Photos", "").toLowerCase();
  
  try {
    const paths = await uploadImagesForCar(
      photos.map((p) => p.file),
      carId,
      category,
      userId
    );
    console.log(`Successfully uploaded ${paths.length} ${category} photos`);
    return paths;
  } catch (err) {
    console.error(`Failed to upload ${category} photos:`, err);
    throw err;
  }
}
