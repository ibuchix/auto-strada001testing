
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
 * Updated: 2025-06-01 - Enhanced image association with better direct association and temp uploads handling
 * Updated: 2025-06-03 - Improved reliability of image association for draft listings
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

export const useImageAssociation = (retryConfig: RetryConfig = { maxRetries: 3, delayMs: 1000 }) => {
  const [isAssociating, setIsAssociating] = useState(false);
  const retryAttemptsRef = useRef<Record<string, number>>({});
  
  // Sleep helper function for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Set temporary uploads data for association
  const setTempUploads = async (uploads: any[]): Promise<boolean> => {
    try {
      console.log('[ImageAssociation] Setting temp uploads:', { count: uploads.length });
      
      const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'set_temp_uploads',
          uploads: uploads
        }
      });
      
      if (error) {
        console.error('Error setting temp uploads:', error);
        return false;
      }
      
      console.log('[ImageAssociation] Temp uploads set successfully');
      
      // Also try to set in local storage as backup mechanism
      try {
        localStorage.setItem('tempUploads', JSON.stringify(uploads));
      } catch (e) {
        console.warn('Failed to set backup temp uploads in localStorage:', e);
      }
      
      return true;
    } catch (err) {
      console.error('Exception setting temp uploads:', err);
      return false;
    }
  };
  
  // Directly associate uploads with a car
  const directAssociate = async (carId: string, uploads: any[]): Promise<number> => {
    try {
      console.log(`[ImageAssociation] Direct association with car ${carId}, ${uploads.length} uploads`);
      
      const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'associate_uploads',
          carId,
          uploads
        }
      });
      
      if (error) {
        console.error('Error in direct association:', error);
        return 0;
      }
      
      return data?.count || 0;
    } catch (err) {
      console.error('Exception in direct association:', err);
      return 0;
    }
  };
  
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
      
      // Try first to use any locally stored uploads as fallback
      let fallbackUploads: any[] = [];
      try {
        const localUploads = localStorage.getItem('tempUploads');
        if (localUploads) {
          fallbackUploads = JSON.parse(localUploads);
          console.log(`[ImageAssociation][${submissionId}] Found ${fallbackUploads.length} fallback uploads in localStorage`);
        }
      } catch (e) {
        console.warn(`[ImageAssociation][${submissionId}] Error parsing local uploads:`, e);
      }
      
      // Use the direct DB insert approach for association with enhanced RLS policies
      let successCount = 0;
      let retryCount = 0;
      
      while (retryCount <= retryConfig.maxRetries) {
        try {
          // First try to associate via RPC function for best reliability
          const { data, error } = await supabase.rpc('associate_temp_uploads_with_car', {
            p_car_id: carId
          });
          
          if (!error) {
            successCount = data || 0;
            console.log(`[ImageAssociation][${submissionId}] RPC association successful: ${successCount} images`);
          } else {
            // Fallback to edge function if RPC fails
            console.log(`[ImageAssociation][${submissionId}] RPC failed, trying edge function:`, error);
            
            const { data: fnData, error: fnError } = await supabase.functions.invoke('handle-seller-operations', {
              body: {
                operation: 'associate_images',
                carId
              }
            });
            
            if (!fnError && fnData?.success) {
              successCount = fnData.count || 0;
              console.log(`[ImageAssociation][${submissionId}] Edge function association successful: ${successCount} images`);
            } else {
              // If that fails too and we have fallback uploads, try direct association
              if (fallbackUploads.length > 0) {
                console.log(`[ImageAssociation][${submissionId}] Using fallback uploads: ${fallbackUploads.length}`);
                successCount = await directAssociate(carId, fallbackUploads);
                if (successCount > 0) {
                  console.log(`[ImageAssociation][${submissionId}] Fallback association successful: ${successCount} images`);
                  break;
                }
              }
              
              throw new Error(fnError?.message || 'Association failed');
            }
          }
          
          if (successCount > 0) break; // Exit retry loop if successful
          
          // If no success but no error thrown, we might just not have any temp uploads
          // Try using fallback uploads
          if (fallbackUploads.length > 0) {
            console.log(`[ImageAssociation][${submissionId}] No success with standard methods, trying fallback uploads`);
            successCount = await directAssociate(carId, fallbackUploads);
            if (successCount > 0) {
              console.log(`[ImageAssociation][${submissionId}] Fallback association successful: ${successCount} images`);
              break;
            }
          }
          
          // If still no success, increment retry
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
            // If we have fallback uploads, try one last time with direct association
            if (fallbackUploads.length > 0 && successCount === 0) {
              console.log(`[ImageAssociation][${submissionId}] Last resort: Using fallback uploads directly`);
              successCount = await directAssociate(carId, fallbackUploads);
            }
            
            if (successCount === 0) {
              throw err; // Re-throw to be caught by outer catch
            }
          }
        }
      }
      
      // Try to clean up localStorage
      try {
        localStorage.removeItem('tempUploads');
      } catch (e) {
        // Ignore localStorage errors
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
    setTempUploads,
    directAssociate,
    isAssociating,
    resetRetryState
  };
};
