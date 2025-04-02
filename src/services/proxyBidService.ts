
/**
 * Client service for managing proxy bids processing
 * - Handles communication with the process-proxy-bids edge function
 * - Provides methods for processing single car and all auction proxy bids
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApiError } from "./errors/apiError";

export interface ProcessProxyBidsResult {
  success: boolean;
  data?: {
    processedBids?: number;
    carIds?: string[];
    bidsPlaced?: Array<{
      carId: string;
      dealerId: string;
      amount: number;
      maxAmount: number;
    }>;
  };
  error?: string;
  message?: string;
}

/**
 * Process proxy bids for a specific car
 */
export async function processCarProxyBids(
  carId: string,
  options?: { showToasts?: boolean }
): Promise<ProcessProxyBidsResult> {
  const { showToasts = true } = options || {};
  
  try {
    console.log('Processing proxy bids for car:', carId);
    
    const { data, error } = await supabase.functions.invoke('process-proxy-bids', {
      body: {
        carId,
        processingMode: 'single',
        initiatedBy: 'user'
      }
    });
    
    if (error) {
      console.error('Proxy bid processing error:', error);
      if (showToasts) {
        toast.error('Failed to process proxy bids');
      }
      return {
        success: false,
        error: error.message
      };
    }
    
    const result = data as ProcessProxyBidsResult;
    
    if (result.data?.bidsPlaced && result.data.bidsPlaced.length > 0 && showToasts) {
      toast.success('Proxy bids processed', {
        description: `Processed ${result.data.processedBids} bids`
      });
    }
    
    return result;
  } catch (error: any) {
    console.error('Proxy bid processing exception:', error);
    if (showToasts) {
      toast.error('Failed to process proxy bids');
    }
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Process all pending proxy bids
 */
export async function processAllProxyBids(
  options?: { showToasts?: boolean }
): Promise<ProcessProxyBidsResult> {
  const { showToasts = true } = options || {};
  
  try {
    console.log('Processing all pending proxy bids');
    
    const { data, error } = await supabase.functions.invoke('process-proxy-bids', {
      body: {
        processingMode: 'all',
        initiatedBy: 'user'
      }
    });
    
    if (error) {
      console.error('Proxy bid processing error:', error);
      if (showToasts) {
        toast.error('Failed to process proxy bids');
      }
      return {
        success: false,
        error: error.message
      };
    }
    
    const result = data as ProcessProxyBidsResult;
    
    if (result.data?.processedBids && result.data.processedBids > 0 && showToasts) {
      toast.success('Proxy bids processed', {
        description: `Processed ${result.data.processedBids} bids across ${result.data.carIds?.length || 0} auctions`
      });
    }
    
    return result;
  } catch (error: any) {
    console.error('Proxy bid processing exception:', error);
    if (showToasts) {
      toast.error('Failed to process proxy bids');
    }
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Utility hook for proxy bid processing
 */
export function useProxyBidProcessing() {
  return {
    processCarProxyBids,
    processAllProxyBids
  };
}
