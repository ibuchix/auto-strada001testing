
/**
 * Image Association Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed toast API usage
 * Updated: 2025-05-24 - Enhanced to support immediate uploads
 * Updated: 2025-05-20 - Added debouncing and better error handling
 * Updated: 2025-06-02 - Fixed toast API usage to use Sonner format and improved error handling
 * 
 * Handles associating temporary uploads with a car ID after successful submission
 */

import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';
import { toast } from 'sonner';

export const useImageAssociation = () => {
  const associateImages = async (carId: string, submissionId: string): Promise<number> => {
    try {
      console.log(`[ImageAssociation][${submissionId}] Starting image association process for car ${carId}`);
      
      // Check if we have any temporary uploads in localStorage
      const tempUploadsStr = localStorage.getItem('tempFileUploads');
      if (!tempUploadsStr) {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads found in localStorage`);
        return 0;
      }
      
      // Parse the temporary uploads
      let tempUploads;
      try {
        tempUploads = JSON.parse(tempUploadsStr);
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
      
      // Try to associate temp uploads with the new car ID
      const associatedCount = await associateTempUploadsWithCar(carId);
      
      if (associatedCount > 0) {
        console.log(`[ImageAssociation][${submissionId}] Successfully associated ${associatedCount} images`);
        
        toast(`Successfully associated ${associatedCount} images with your listing.`);
        
        // Clear the temp uploads from localStorage after successful association
        localStorage.removeItem('tempFileUploads');
      } else {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads were associated`);
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
        toast("Some images may not have been properly associated with your listing.");
      }
      
      return 0;
    }
  };
  
  return {
    associateImages
  };
};
