
/**
 * Image Association Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed toast API usage
 * 
 * Handles associating temporary uploads with a car ID after successful submission
 */

import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';
import { toast } from '@/hooks/use-toast';

export const useImageAssociation = () => {
  const associateImages = async (carId: string, submissionId: string): Promise<number> => {
    try {
      // Try to associate temp uploads with the new car ID
      const associatedCount = await associateTempUploadsWithCar(carId);
      
      if (associatedCount > 0) {
        console.log(`[ImageAssociation][${submissionId}] Successfully associated ${associatedCount} images`);
        
        toast({
          variant: "default",
          description: `Successfully associated ${associatedCount} images with your listing.`
        });
      } else {
        console.log(`[ImageAssociation][${submissionId}] No temp uploads to associate`);
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
