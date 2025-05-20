
/**
 * Image Association Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed toast API usage
 * Updated: 2025-05-24 - Enhanced to support immediate uploads
 * Updated: 2025-05-20 - Added debouncing and better error handling
 * Updated: 2025-06-02 - Fixed toast API usage to use Sonner format and improved error handling
 * Updated: 2025-06-03 - Added retry capability and bypass for throttling
 * Updated: 2025-05-20 - Integrated with standardized photo field naming
 * Updated: 2025-05-20 - Fixed image association with real car IDs and improved error handling
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Associate temp uploads with car ID manually instead of using service
      let associatedCount = 0;
      let currentRetry = retryAttemptsRef.current[carId] || 0;
      
      // Create database entries for car_file_uploads
      try {
        for (const upload of tempUploads) {
          console.log(`[ImageAssociation][${submissionId}] Associating upload: category=${upload.category}, path=${upload.filePath}`);
          
          // Insert record directly through Supabase client
          const { error } = await supabase
            .from('car_file_uploads')
            .insert({
              car_id: carId,
              file_path: upload.filePath,
              file_type: 'image/jpeg', // Default assumption
              upload_status: 'completed',
              category: upload.category,
              image_metadata: {
                publicUrl: upload.publicUrl
              }
            });
          
          if (error) {
            console.error(`[ImageAssociation][${submissionId}] Database error associating file ${upload.filePath}:`, error);
            throw new Error(`Database error associating file: ${error.message}`);
          } else {
            console.log(`[ImageAssociation][${submissionId}] Successfully added file record for ${upload.category}`);
            associatedCount++;
          }
          
          // Also update the car record with the photo information
          await updateCarPhotoRecord(carId, upload.category, upload.filePath);
        }
        
        console.log(`[ImageAssociation][${submissionId}] Successfully processed ${associatedCount} uploads`);
      } catch (error) {
        // Handle errors during association
        console.error(`[ImageAssociation][${submissionId}] Error during association:`, error);
        
        // Increment retry counter
        currentRetry++;
        retryAttemptsRef.current[carId] = currentRetry;
        
        if (currentRetry <= retryConfig.maxRetries) {
          // Wait before retrying
          console.log(`[ImageAssociation][${submissionId}] Retrying in ${retryConfig.delayMs}ms...`);
          await sleep(retryConfig.delayMs);
          
          // Try one more time with direct SQL using RPC if available
          try {
            console.log(`[ImageAssociation][${submissionId}] Attempting emergency association via RPC...`);
            const { data, error } = await supabase.rpc(
              'associate_temp_uploads_with_car',
              { p_car_id: carId }
            );
            
            if (!error && data > 0) {
              console.log(`[ImageAssociation][${submissionId}] RPC association successful, associated ${data} files`);
              associatedCount = data;
            } else if (error) {
              console.error(`[ImageAssociation][${submissionId}] RPC association error:`, error);
              throw error;
            }
          } catch (rpcError) {
            console.error(`[ImageAssociation][${submissionId}] RPC association failed:`, rpcError);
            // Just log this error, we've tried our best
          }
        } else {
          // Max retries reached
          console.error(`[ImageAssociation][${submissionId}] Max retries (${retryConfig.maxRetries}) reached`);
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
  
  // Helper function to update car photo records
  const updateCarPhotoRecord = async (carId: string, category: string, filePath: string) => {
    try {
      // First get current car data
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos, additional_photos')
        .eq('id', carId)
        .single();
      
      if (getError) {
        console.error(`Error fetching car ${carId} data:`, getError);
        return;
      }
      
      // Determine if this is a required photo or additional photo
      if (category === 'additional_photos' || category.includes('additional')) {
        // For additional photos, add to the array
        const currentPhotos = car?.additional_photos || [];
        const updatedPhotos = Array.isArray(currentPhotos) 
          ? [...currentPhotos, filePath] 
          : [filePath];
        
        await supabase
          .from('cars')
          .update({ additional_photos: updatedPhotos })
          .eq('id', carId);
      } else {
        // For required photos, add to the required_photos object
        const requiredPhotos = car?.required_photos || {};
        requiredPhotos[category] = filePath;
        
        await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
      }
    } catch (error) {
      console.error(`Error updating car ${carId} with photo ${category}:`, error);
      // Non-fatal error, continue
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
