
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
 * Updated: 2025-05-31 - Integrated with database security definer functions for reliable image association
 * Updated: 2025-06-10 - Fixed UUID handling and improved direct database error handling
 * Updated: 2025-06-15 - Updated to work with improved RLS policies for image association
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
      
      // Validate car ID is a proper UUID
      if (!carId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carId)) {
        console.error(`[ImageAssociation][${submissionId}] Invalid carId format:`, carId);
        toast.error("Invalid car ID format - please contact support");
        return 0;
      }
      
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
      
      console.log(`[ImageAssociation][${submissionId}] Found ${tempUploads.length} temp uploads in localStorage, associating with car ${carId}`);
      
      // Get current car data to update
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos, additional_photos')
        .eq('id', carId)
        .single();
      
      if (getError) {
        console.error(`[ImageAssociation][${submissionId}] Error getting car data:`, getError);
        throw new Error(`Error getting car data: ${getError.message}`);
      }
      
      // Initialize photo containers
      const requiredPhotos = car?.required_photos || {};
      const additionalPhotos = car?.additional_photos || [];
      
      // Process each upload
      let successCount = 0;
      for (const upload of tempUploads) {
        try {
          // 1. First insert into car_file_uploads table directly
          // This should work with our new RLS policies where the user owns the car
          const { error: fileUploadError } = await supabase
            .from('car_file_uploads')
            .insert({
              car_id: carId,
              file_path: upload.filePath,
              file_type: 'image/jpeg', // Default assumption
              category: upload.category,
              upload_status: 'completed',
              image_metadata: {
                uploadId: upload.uploadId,
                publicUrl: upload.publicUrl,
                timestamp: upload.timestamp
              }
            });
            
          if (fileUploadError) {
            console.error(`[ImageAssociation][${submissionId}] Error inserting file upload record:`, fileUploadError);
            // Continue with photo updates anyway
          }

          // 2. Update photo data based on category
          if (upload.category === 'additional_photos' || upload.category.includes('additional')) {
            // Add to additional photos array
            if (Array.isArray(additionalPhotos)) {
              additionalPhotos.push(upload.filePath);
            }
          } else {
            // Add to required photos object
            requiredPhotos[upload.category] = upload.filePath;
          }
          successCount++;
        } catch (err) {
          console.error(`[ImageAssociation][${submissionId}] Error processing upload ${upload.category}:`, err);
          // Continue with next upload
        }
      }
      
      // Update the car record with new photo data if any uploads were processed
      if (successCount > 0) {
        const { error: updateError } = await supabase
          .from('cars')
          .update({
            required_photos: requiredPhotos,
            additional_photos: additionalPhotos
          })
          .eq('id', carId);
        
        if (updateError) {
          console.error(`[ImageAssociation][${submissionId}] Error updating car photos:`, updateError);
          throw new Error(`Error updating car photos: ${updateError.message}`);
        }
        
        console.log(`[ImageAssociation][${submissionId}] Successfully updated car with ${successCount} photos`);
      }
      
      if (successCount > 0) {
        toast.success(`Successfully associated ${successCount} images with your listing.`);
        
        // Clear the temp uploads from localStorage after successful association
        localStorage.removeItem('tempFileUploads');
      } else {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads were associated`);
      }
      
      return successCount;
    } catch (error) {
      // Non-fatal error - log but continue
      console.error('[ImageAssociation] Error associating uploads:', error);
      console.log(`[ImageAssociation][${submissionId}] Association error:`, { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Only show toast for critical errors
      if (error instanceof Error) {
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
