
/**
 * Simplified create-car-listing edge function - Option 2 Implementation
 * Updated: 2025-06-13 - Simplified to accept JSON with image URLs (no file uploads)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request started`, { method: req.method });

  try {
    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Parse JSON request body
    const requestData = await req.json();
    console.log(`[${requestId}] JSON request received`);
    
    const carData = requestData.carData || requestData;
    const userId = requestData.userId || carData.userId;
    
    if (!userId) {
      throw new Error('Missing user ID');
    }
    
    if (!carData) {
      throw new Error('Missing car data');
    }
    
    console.log(`[${requestId}] Data extracted:`, {
      userId,
      hasCarData: !!carData,
      requiredPhotoKeys: carData.requiredPhotos ? Object.keys(carData.requiredPhotos) : [],
      additionalPhotosCount: carData.additionalPhotos ? carData.additionalPhotos.length : 0,
      carDataKeys: Object.keys(carData || {})
    });
    
    // Generate car ID for database insertion (use provided ID if available)
    const carId = carData.id || crypto.randomUUID();
    console.log(`[${requestId}] Using car ID:`, carId);
    
    // Prepare car data for simplified database function
    const carRecord = {
      id: carId,
      seller_id: userId,
      seller_name: carData.sellerName || carData.name || '',
      address: carData.address || '',
      mobile_number: carData.mobileNumber || '',
      make: carData.make || 'Unknown',
      model: carData.model || 'Unknown',
      year: carData.year || 2000,
      mileage: carData.mileage || 0,
      vin: carData.vin || '',
      transmission: carData.transmission || 'manual',
      reserve_price: carData.reservePrice || 1000,
      features: carData.features || {},
      is_damaged: carData.isDamaged || false,
      is_registered_in_poland: carData.isRegisteredInPoland !== false, // Default to true
      has_private_plate: carData.hasPrivatePlate || false,
      finance_amount: carData.financeAmount || 0,
      service_history_type: carData.serviceHistoryType || 'none',
      seller_notes: carData.sellerNotes || '',
      seat_material: carData.seatMaterial || 'cloth',
      number_of_keys: carData.numberOfKeys || 1,
      required_photos: carData.requiredPhotos || {},
      additional_photos: carData.additionalPhotos || [],
      valuation_data: carData.valuationData || null,
      title: carData.title || `${carData.year || 'Unknown'} ${carData.make || 'Unknown'} ${carData.model || 'Unknown'}`
    };
    
    console.log(`[${requestId}] Prepared car record:`, {
      id: carRecord.id,
      make: carRecord.make,
      model: carRecord.model,
      year: carRecord.year,
      reserve_price: carRecord.reserve_price,
      seller_id: carRecord.seller_id,
      requiredPhotosCount: Object.keys(carRecord.required_photos).length,
      additionalPhotosCount: carRecord.additional_photos.length
    });
    
    // Use the simplified security definer function
    console.log(`[${requestId}] Calling simplified database function`);
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('create_simple_car_listing', {
        p_car_data: carRecord,
        p_user_id: userId
      });
    
    console.log(`[${requestId}] Simplified function result:`, {
      functionResult,
      functionError: functionError?.message
    });
    
    if (functionError) {
      console.error(`[${requestId}] Simplified function failed:`, functionError.message);
      throw new Error(`Failed to create car listing: ${functionError.message}`);
    }
    
    // Check function result
    if (!functionResult || functionResult.success !== true) {
      const errorMessage = functionResult?.error || 'Unknown error from database function';
      console.error(`[${requestId}] Function returned failure:`, errorMessage);
      throw new Error(`Failed to create car listing: ${errorMessage}`);
    }
    
    const createdCarId = functionResult.car_id;
    
    if (!createdCarId) {
      console.error(`[${requestId}] No car ID returned from function:`, functionResult);
      throw new Error('Failed to create car listing - no car ID returned from database');
    }
    
    console.log(`[${requestId}] Car listing created successfully:`, createdCarId);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: createdCarId,
          car_id: createdCarId
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error(`[${requestId}] Error:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
