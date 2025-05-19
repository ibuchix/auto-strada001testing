
/**
 * Image Association Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed toast API usage
 * Updated: 2025-05-24 - Enhanced to support immediate uploads
 * 
 * Handles associating temporary uploads with a car ID after successful submission
 */

import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';
import { toast } from '@/hooks/use-toast';

export const useImageAssociation = () => {
  const associateImages = async (carId: string, submissionId: string): Promise<number> => {
    try {
      // Check if we have any temporary uploads in localStorage
      const tempUploadsStr = localStorage.getItem('tempFileUploads');
      if (!tempUploadsStr) {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads found in localStorage`);
        return 0;
      }
      
      // Try to associate temp uploads with the new car ID
      console.log(`[ImageAssociation][${submissionId}] Found temp uploads in localStorage, associating with car ${carId}`);
      const associatedCount = await associateTempUploadsWithCar(carId);
      
      if (associatedCount > 0) {
        console.log(`[ImageAssociation][${submissionId}] Successfully associated ${associatedCount} images`);
        
        toast({
          variant: "default",
          description: `Successfully associated ${associatedCount} images with your listing.`
        });
        
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
      
      return 0;
    }
  };
  
  return {
    associateImages
  };
};
