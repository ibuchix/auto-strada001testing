
/**
 * Image Association Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed toast API usage
 * Updated: 2025-05-24 - Enhanced to support immediate uploads
 * Updated: 2025-05-20 - Added debouncing and better error handling
 * Updated: 2025-06-02 - Fixed toast API usage to use Sonner format and improved error handling
 * Updated: 2025-06-03 - Added retry capability and bypass for throttling
 * Updated: 2025-05-20 - Integrated with standardized photo field naming
 */

import { useState, useRef, useCallback } from 'react';
import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';
import { toast } from 'sonner';
import { standardizePhotoCategory } from '@/utils/photoMapping';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

// Define the TempFileMetadata interface with standardized category field
interface TempFileMetadata {
  filePath: string;
  publicUrl: string;
  category: string;  // Will be standardized during association
  uploadId: string;
  timestamp: string;
}

export const useImageAssociation = (retryConfig: RetryConfig = { maxRetries: 3, delayMs: 1000 }) => {
  const [isAssociating, setIsAssociating] = useState(false);
  const retryAttemptsRef = useRef<Record<string, number>>({});
  
  // Sleep helper function for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const associateImages = async (carId: string, submissionId: string): Promise<number> => {
    // Set associating state
    setIsAssociating(true);
    
    try {
      console.log(`[ImageAssociation][${submissionId}] Starting image association process for car ${carId}`);
      
      // Check if we have any temporary uploads in localStorage
      const tempUploadsStr = localStorage.getItem('tempFileUploads');
      if (!tempUploadsStr) {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads found in localStorage`);
        return 0;
      }
      
      // Parse the temporary uploads
      let tempUploads: TempFileMetadata[];
      try {
        tempUploads = JSON.parse(tempUploadsStr);
        
        // Standardize categories for all temp uploads
        tempUploads = tempUploads.map(upload => ({
          ...upload,
          category: standardizePhotoCategory(upload.category)
        }));
        
        console.log(`[ImageAssociation][${submissionId}] Standardized categories for ${tempUploads.length} uploads`);
      } catch (error) {
        console.error(`[ImageAssociation][${submissionId}] Error parsing temp uploads:`, error);
        toast("There was an issue with your uploaded images. They may need to be uploaded again.");
        return 0;
      }
      
      // Validate temp uploads data
      if (!Array.isArray(tempUploads) || tempUploads.length === 0) {
        console.log(`[ImageAssociation][${submissionId}] No valid uploads found in localStorage`);
        return 0;
      }
      
      // Add a small delay to ensure database consistency
      console.log(`[ImageAssociation][${submissionId}] Found ${tempUploads.length} temp uploads in localStorage, associating with car ${carId}`);
      
      // Try to associate temp uploads with the new car ID with retry logic
      let associatedCount = 0;
      let currentRetry = retryAttemptsRef.current[carId] || 0;
      
      while (currentRetry <= retryConfig.maxRetries) {
        try {
          associatedCount = await associateTempUploadsWithCar(carId);
          
          // If successful, break the retry loop
          if (associatedCount > 0) {
            console.log(`[ImageAssociation][${submissionId}] Successfully associated ${associatedCount} images on attempt ${currentRetry + 1}`);
            break;
          } 
          
          // If no images were associated but there was no error, still try again
          console.log(`[ImageAssociation][${submissionId}] No images associated on attempt ${currentRetry + 1}, retrying...`);
          currentRetry++;
          retryAttemptsRef.current[carId] = currentRetry;
          
          if (currentRetry <= retryConfig.maxRetries) {
            // Wait before retrying
            await sleep(retryConfig.delayMs);
          }
        } catch (error) {
          console.error(`[ImageAssociation][${submissionId}] Error associating images on attempt ${currentRetry + 1}:`, error);
          
          // Increment retry counter
          currentRetry++;
          retryAttemptsRef.current[carId] = currentRetry;
          
          if (currentRetry <= retryConfig.maxRetries) {
            // Wait before retrying
            console.log(`[ImageAssociation][${submissionId}] Retrying in ${retryConfig.delayMs}ms...`);
            await sleep(retryConfig.delayMs);
          } else {
            // Max retries reached, rethrow the error
            throw error;
          }
        }
      }
      
      if (associatedCount > 0) {
        toast.success(`Successfully associated ${associatedCount} images with your listing.`);
        
        // Clear the temp uploads from localStorage after successful association
        localStorage.removeItem('tempFileUploads');
      } else {
        if (currentRetry > retryConfig.maxRetries) {
          toast.error("Could not associate images after multiple attempts. Please contact support.");
        } else {
          console.log(`[ImageAssociation][${submissionId}] No temp uploads were associated`);
        }
      }
      
      return associatedCount;
    } catch (error) {
      // Non-fatal error - log but continue
      console.error('[ImageAssociation] Error associating uploads:', error);
      console.log(`[ImageAssociation][${submissionId}] Association error:`, { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Only show toast for critical errors
      if (error instanceof Error && (error.message.includes('database') || error.message.includes('permission'))) {
        toast.error("Some images may not have been properly associated with your listing.");
      }
      
      return 0;
    } finally {
      setIsAssociating(false);
    }
  };
  
  const resetRetryState = useCallback((carId: string) => {
    if (retryAttemptsRef.current[carId]) {
      delete retryAttemptsRef.current[carId];
    }
  }, []);
  
  return {
    associateImages,
    isAssociating,
    resetRetryState
  };
};
