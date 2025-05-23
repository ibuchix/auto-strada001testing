
/**
 * Hook for managing car ownership operations
 * Created: 2025-05-21
 * Updated: 2025-05-23 - Removed is_draft system, simplified operations
 */

import { useState, useCallback } from 'react';
import { 
  publishCarListing,
  withdrawCarListing,
  transitionCarStatus,
  getCarOwnershipHistory
} from '@/services/supabase/carOwnershipService';
import { useAuth } from '@/components/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseCarOwnershipProps {
  onSuccess?: (action: string) => void;
  onError?: (error: Error) => void;
}

export const useCarOwnership = ({ onSuccess, onError }: UseCarOwnershipProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  const refreshQueries = useCallback(() => {
    // Invalidate queries that might be affected by status changes
    queryClient.invalidateQueries({ queryKey: ['cars'] });
    queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
  }, [queryClient]);
  
  const publish = useCallback(async (carId: string) => {
    if (!session?.user) {
      toast.error("Authentication required", { 
        description: "You must be logged in to publish a listing" 
      });
      return false;
    }
    
    setIsProcessing(true);
    try {
      const result = await publishCarListing(carId);
      
      if (result.success) {
        toast.success("Listing published successfully");
        refreshQueries();
        if (onSuccess) onSuccess('publish');
      } else {
        toast.error("Failed to publish listing", { 
          description: result.message 
        });
        if (onError) onError(new Error(result.message));
      }
      
      return result.success;
    } catch (error: any) {
      console.error("Error in publish:", error);
      if (onError) onError(error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, refreshQueries, onSuccess, onError]);
  
  const withdraw = useCallback(async (carId: string) => {
    if (!session?.user) {
      toast.error("Authentication required", { 
        description: "You must be logged in to withdraw a listing" 
      });
      return false;
    }
    
    setIsProcessing(true);
    try {
      const result = await withdrawCarListing(carId);
      
      if (result.success) {
        toast.success("Listing withdrawn successfully");
        refreshQueries();
        if (onSuccess) onSuccess('withdraw');
      } else {
        toast.error("Failed to withdraw listing", { 
          description: result.message 
        });
        if (onError) onError(new Error(result.message));
      }
      
      return result.success;
    } catch (error: any) {
      console.error("Error in withdraw:", error);
      if (onError) onError(error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, refreshQueries, onSuccess, onError]);
  
  const changeStatus = useCallback(async (carId: string, newStatus: string) => {
    if (!session?.user) {
      toast.error("Authentication required", { 
        description: "You must be logged in to change listing status" 
      });
      return false;
    }
    
    setIsProcessing(true);
    try {
      const result = await transitionCarStatus(carId, newStatus);
      
      if (result.success) {
        toast.success(`Listing status changed to ${newStatus}`);
        refreshQueries();
        if (onSuccess) onSuccess('status-change');
      } else {
        toast.error("Failed to change listing status", { 
          description: result.message 
        });
        if (onError) onError(new Error(result.message));
      }
      
      return result.success;
    } catch (error: any) {
      console.error("Error in changeStatus:", error);
      if (onError) onError(error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, refreshQueries, onSuccess, onError]);
  
  const getHistory = useCallback(async (carId: string) => {
    try {
      return await getCarOwnershipHistory(carId);
    } catch (error) {
      console.error("Error fetching car history:", error);
      return [];
    }
  }, []);
  
  return {
    publish,
    withdraw,
    changeStatus,
    getHistory,
    isProcessing
  };
};
