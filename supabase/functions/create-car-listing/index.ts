/**
 * Edge function for creating car listings
 * Updated: 2025-04-19 - Switched to use shared utilities from central repository
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { 
  corsHeaders,
  handleCorsOptions,
  validateListingRequest,
  logOperation,
  createRequestId,
  formatSuccessResponse,
  formatErrorResponse,
  ensureSellerExists,
  getSellerName
} from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";
import { ListingRequest, ListingData } from './types.ts';
import { validateVinReservation, markReservationAsUsed, createListing } from './utils/index.ts';

serve(async (req) => {
  // Generate request ID for tracking
  const requestId = createRequestId();
  logOperation('request_received', { requestId, method: req.method, url: req.url });
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    // Parse request
    const requestData = await req.json();
    logOperation('request_parsed', { requestId, body: requestData }, 'debug');
    
    // Validate request
    const { valuationData, userId, vin, mileage, transmission, reservationId } = requestData as ListingRequest;
    const validation = validateListingRequest(requestData);
    
    if (!validation.valid) {
      logOperation('validation_error', { requestId, error: validation.error }, 'error');
      return formatErrorResponse(validation.error || 'Invalid request');
    }
    
    logOperation('request_validated', { 
      requestId, 
      userId, 
      vin, 
      mileage, 
      transmission 
    });

    // Initialize Supabase client with increased timeout
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: { 'x-request-timeout': '240000' }
        }
      }
    );
    
    // Validate VIN reservation if provided
    const reservationValidation = await validateVinReservation(
      supabase, 
      userId, 
      vin, 
      reservationId, 
      requestId
    );
    
    if (!reservationValidation.valid) {
      return formatErrorResponse(reservationValidation.error || 'Invalid reservation');
    }

    // Create seller if needed
    const sellerResult = await ensureSellerExists(supabase, userId, requestId);
    if (!sellerResult.success) {
      return formatErrorResponse('Failed to verify seller account');
    }

    // Get seller name from user data
    const sellerName = await getSellerName(supabase, userId);
    
    // Prepare listing data
    const listingData: ListingData = {
      seller_id: userId,
      seller_name: sellerName,
      title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
      vin: vin,
      mileage: mileage,
      transmission: transmission,
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      price: valuationData.valuation || valuationData.averagePrice,
      valuation_data: valuationData,
      is_draft: true
    };

    logOperation('creating_listing', { 
      requestId,
      userId,
      carMake: valuationData.make,
      carModel: valuationData.model
    });

    // Use EdgeRuntime.waitUntil for background processing
    const backgroundProcess = async () => {
      try {
        // Create the listing
        const result = await createListing(supabase, listingData, userId, requestId);
        
        if (!result.success) {
          logOperation('background_process_failed', {
            requestId,
            error: result.error?.message
          }, 'error');
          return;
        }
        
        // Mark reservation as used if provided
        if (reservationId) {
          await markReservationAsUsed(supabase, reservationId, requestId);
        }
        
        logOperation('background_process_completed', {
          requestId,
          carId: result.data?.car_id || result.data?.id
        });
      } catch (error) {
        logOperation('background_process_error', {
          requestId,
          error: (error as Error).message
        }, 'error');
      }
    };
    
    // Start the background processing
    EdgeRuntime.waitUntil(backgroundProcess());

    // Return immediate response
    return formatSuccessResponse({
      message: 'Listing creation started',
    }, 202);

  } catch (error) {
    logOperation('unhandled_error', { 
      requestId, 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, 'error');
    
    return formatErrorResponse(error as Error);
  }
});
