
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
 * Updated: 2025-06-21 - Completely refactored to use direct DB inserts with new RLS policies
 * Updated: 2025-05-21 - Updated to work with enhanced RLS policy framework
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
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
      
      // Use the direct DB insert approach for association with enhanced RLS policies
      let successCount = 0;
      let retryCount = 0;
      
      while (retryCount <= retryConfig.maxRetries) {
        try {
          // Use our associateTempUploadsWithCar function from uploadService.ts
          successCount = await associateTempUploadsWithCar(carId);
          
          if (successCount > 0) break; // Exit retry loop if successful
          
          // If no success but no error thrown, we might just not have any temp uploads
          // Still exit the loop to avoid unnecessary retries
          if (retryCount === 0) break;
          
          retryCount++;
          
          // Wait before retrying
          if (retryCount <= retryConfig.maxRetries) {
            const delayMs = retryConfig.delayMs * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(`[ImageAssociation][${submissionId}] Retrying in ${delayMs}ms (attempt ${retryCount})`);
            await sleep(delayMs);
          }
        } catch (err) {
          console.error(`[ImageAssociation][${submissionId}] Error during attempt ${retryCount}:`, err);
          
          retryCount++;
          
          // Wait before retrying, with exponential backoff
          if (retryCount <= retryConfig.maxRetries) {
            const delayMs = retryConfig.delayMs * Math.pow(2, retryCount - 1);
            console.log(`[ImageAssociation][${submissionId}] Retrying in ${delayMs}ms (attempt ${retryCount})`);
            await sleep(delayMs);
          } else {
            // Last retry failed
            throw err; // Re-throw to be caught by outer catch
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully associated ${successCount} images with your listing.`);
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
      
      toast.error("Some images may not have been properly associated with your listing.");
      
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
