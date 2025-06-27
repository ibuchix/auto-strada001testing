/**
 * Simplified create-car-listing edge function - Option 2 Implementation
 * Updated: 2025-06-13 - Simplified to accept JSON with image URLs (no file uploads)
 * Updated: 2025-06-15 - Now strictly pulls reserve_price from valuationData.reservePrice
 * [SECURITY] 2025-06-20 - Hardened input validation: Sanitize all user input, log every rejected field, never trust client.
 * [SECURITY NOTE] Never store secrets or API keys in this file EXCEPT as env variables via Deno.env.get.
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

function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>&"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function isValidYear(year: number) {
  const current = new Date().getFullYear();
  return year >= 1970 && year <= (current + 1);
}
function isValidMileage(mileage: number) {
  return mileage >= 0 && mileage < 1_000_000;
}
function isValidVin(vin: string) {
  return typeof vin === "string" && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.trim().toUpperCase());
}

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

<<<<<<< HEAD
    let carData: any;
    let userId: string;
    let requiredPhotos: Record<string, File> = {};
    let additionalPhotos: File[] = [];

    const contentType = req.headers.get('content-type') || '';
    console.log(`[${requestId}] Content-Type:`, contentType);

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data with images
      console.log(`[${requestId}] Parsing multipart form data`);

      const formData = await req.formData();

      // Extract car data
      const carDataStr = formData.get('carData') as string;
      if (!carDataStr) {
        throw new Error('Missing car data in form submission');
      }

      carData = JSON.parse(carDataStr);
      userId = formData.get('userId') as string || carData.userId;

      if (!userId) {
        throw new Error('Missing user ID');
      }

      // Extract required photos
      const requiredPhotoTypes = [
        'exterior_front', 'exterior_rear', 'exterior_left', 'exterior_right',
        'interior_front', 'dashboard', 'rim_front_left', 'rim_front_right',
        'rim_rear_left', 'rim_rear_right', 'engine_bay', 'interior_rear'
      ];

      for (const photoType of requiredPhotoTypes) {
        const file = formData.get(`required_${photoType}`) as File;
        if (file && file.size > 0) {
          requiredPhotos[photoType] = file;
        }
      }

      // Extract additional photos
      let additionalIndex = 0;
      while (true) {
        const file = formData.get(`additional_${additionalIndex}`) as File;
        if (!file || file.size === 0) break;
        additionalPhotos.push(file);
        additionalIndex++;
      }

    } else {
      // Handle JSON data (backward compatibility)
      const requestData = await req.json();
      carData = requestData.carData || requestData;
      userId = requestData.userId || carData.userId;

      if (!userId) {
        throw new Error('Missing user ID');
      }
    }

    console.log(`[${requestId}] Data extracted:`, {
      userId,
      requiredPhotosCount: Object.keys(requiredPhotos).length,
      additionalPhotosCount: additionalPhotos.length,
      hasCarData: !!carData,
      carDataKeys: Object.keys(carData || {})
    });

    // Validate required fields
    if (!carData.make || !carData.model || !carData.year) {
      throw new Error('Missing required vehicle details (make, model, year)');
    }

    if (!carData.reservePrice || carData.reservePrice <= 0) {
      throw new Error('Reserve price must be greater than 0');
    }

    // Generate car ID for image uploads
    const carId = crypto.randomUUID();
    console.log(`[${requestId}] Generated car ID:`, carId);

    // Upload required photos to storage
    const uploadedRequiredPhotos: Record<string, string> = {};
    for (const [photoType, file] of Object.entries(requiredPhotos)) {
      const result = await uploadImageToStorage(supabase, file, carId, photoType);
      if (result.success && result.url) {
        uploadedRequiredPhotos[photoType] = result.url;
      } else {
        console.warn(`[${requestId}] Required photo upload failed:`, photoType, result.error);
      }
    }

    // Upload additional photos to storage
    const uploadedAdditionalPhotos: string[] = [];
    for (let i = 0; i < additionalPhotos.length; i++) {
      const file = additionalPhotos[i];
      const result = await uploadImageToStorage(supabase, file, carId, `additional_${i}`);
      if (result.success && result.url) {
        uploadedAdditionalPhotos.push(result.url);
      } else {
        console.warn(`[${requestId}] Additional photo upload failed:`, i, result.error);
      }
    }

    console.log(`[${requestId}] Images uploaded:`, {
      requiredPhotosUploaded: Object.keys(uploadedRequiredPhotos).length,
      additionalPhotosUploaded: uploadedAdditionalPhotos.length
    });

    // Prepare car data for security definer function
=======
    // Parse JSON request body
    const requestData = await req.json();
    console.log(`[${requestId}] JSON request received`);

    const carData = requestData.carData || requestData;
    const userId = requestData.userId || carData.userId;

    // --- SECURITY: STRICT SANITIZATION FOR INPUTS ---
    if (!userId) throw new Error('Missing user ID');

    if (!carData) throw new Error('Missing car data');

    // Basic field presence / format checks
    const badFields: string[] = [];
    if (!carData.make || typeof carData.make !== "string" || !carData.make.trim()) badFields.push("make");
    if (!carData.model || typeof carData.model !== "string" || !carData.model.trim()) badFields.push("model");
    if (!isValidYear(Number(carData.year))) badFields.push("year");
    if (!isValidMileage(Number(carData.mileage))) badFields.push("mileage");
    if (!carData.reservePrice && (!carData.valuationData || !carData.valuationData.reservePrice)) badFields.push("reservePrice");
    if (carData.vin && !isValidVin((carData.vin as string))) badFields.push("vin");

    if (badFields.length > 0) {
      console.error(`[${requestId}] ERROR: Invalid or missing required fields`, badFields);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Submission rejected. Invalid or missing fields: ${badFields.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === RESERVE PRICE STRICT EXTRACTION ===
    const valuationData = carData.valuationData || carData.valuation_data;
    const extractedReservePrice = valuationData && typeof valuationData.reservePrice === "number" ? valuationData.reservePrice : null;

    // Logging for diagnostics
    console.log(`[${requestId}] reservePrice in valuationData:`, extractedReservePrice, 'type:', typeof extractedReservePrice);

    if (!extractedReservePrice || extractedReservePrice <= 0) {
      console.error(`[${requestId}] ERROR: reservePrice missing or invalid in valuationData`, valuationData ? valuationData : {});
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Listing submission rejected—reserve price missing or invalid. Please re-do your valuation.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // --- SANITIZE ALL DATA FIELDS (DEFENSE IN DEPTH) ---
    const safeMake = sanitizeText(carData.make || "");
    const safeModel = sanitizeText(carData.model || "");
    const safeSellerName = sanitizeText(carData.seller_name || carData.sellerName || "Seller");
    const safeAddress = sanitizeText(carData.address || "");
    const safeMobile = (carData.mobile_number || carData.mobileNumber || "").replace(/\D/g, "").slice(0,15);
    const safeSellerNotes = sanitizeText(carData.seller_notes || carData.sellerNotes || "");

    // Generate car ID for database insertion (use provided ID if available)
    const carId = carData.id || crypto.randomUUID();
    console.log(`[${requestId}] Using car ID:`, carId);

    // Prepare car data for simplified database function,
    // but reserve_price now always comes from extractedReservePrice
>>>>>>> main
    const carRecord = {
      ...carData,
      id: carId,
      seller_id: userId,
      reserve_price: extractedReservePrice,
      make: safeMake,
      model: safeModel,
      seller_name: safeSellerName,
      address: safeAddress,
      mobile_number: safeMobile,
      seller_notes: safeSellerNotes,
      // Defensive fields: always sanitize these (in case future fields are added)
    };

<<<<<<< HEAD
    const { fileName: serviceHistoryfileName, documentUrl: serviceHistoryDocumentUrl }: {
      documentUrl: string,
      fileName: string
    } = carData.serviceHistoryFiles;


    console.log(`[${requestId}] Prepared car record:`, {
=======
    console.log(`[${requestId}] Prepared car record with strict reserve_price:`, {
>>>>>>> main
      id: carRecord.id,
      make: carRecord.make,
      model: carRecord.model,
      year: carRecord.year,
      reserve_price: carRecord.reserve_price,
      seller_id: carRecord.seller_id,
      requiredPhotosCount: carRecord.required_photos ? Object.keys(carRecord.required_photos).length : 0,
      additionalPhotosCount: carRecord.additional_photos ? carRecord.additional_photos.length : 0
    });

<<<<<<< HEAD
    // Use security definer function to bypass RLS
    console.log(`[${requestId}] Calling security definer function`);
=======
    // Use the simplified security definer function
    console.log(`[${requestId}] Calling simplified database function`);
>>>>>>> main

    const { data: functionResult, error: functionError } = await supabase
      .rpc('create_simple_car_listing', {
        p_car_data: carRecord,
        p_user_id: userId
      });

<<<<<<< HEAD
    console.log(`[${requestId}] Security definer function result:`, {
=======
    console.log(`[${requestId}] Simplified function result:`, {
>>>>>>> main
      functionResult,
      functionError: functionError?.message
    });

    if (functionError) {
<<<<<<< HEAD
      // Clean up uploaded images on function call failure
      await cleanupUploadedImages(supabase, carId, [
        ...Object.values(uploadedRequiredPhotos),
        ...uploadedAdditionalPhotos
      ]);

      console.error(`[${requestId}] Security definer function failed:`, functionError.message);
      throw new Error(`Failed to create car listing: ${functionError.message}`);
    }

    // Extract car ID from the JSONB response with comprehensive checking
    let createdCarId: string | null = null;

    if (functionResult && typeof functionResult === 'object') {
      console.log(`[${requestId}] Function result object keys:`, Object.keys(functionResult));

      // Check if the function returned success
      if (functionResult.success === true) {
        createdCarId = functionResult.car_id;

        console.log(`[${requestId}] Extracted car_id from function result:`, createdCarId);

        // If still no car_id, fall back to the generated ID
        if (!createdCarId) {
          console.warn(`[${requestId}] No car_id in successful response, using generated ID as fallback`);
          createdCarId = carId;
        }

        /* insert record into service-history table */
        if (!serviceHistoryfileName || !serviceHistoryDocumentUrl) {
          throw new Error("service history file object missing from request data");
        }

        const { error: serviceHistoryRecordError } = await supabase
          .from("service_history")
          .insert({
            car_id: createdCarId,
            document_url: serviceHistoryDocumentUrl,
            description: serviceHistoryfileName
          })


        if (serviceHistoryRecordError) {
          throw new Error("Unable to create service history record");
        }

      } else {
        // Clean up uploaded images on function failure
        await cleanupUploadedImages(supabase, carId, [
          ...Object.values(uploadedRequiredPhotos),
          ...uploadedAdditionalPhotos
        ]);

        /* delete car service history file */
        const { error: serviceFileRemoveError } = await supabase
          .storage
          .from('car-files')
          .remove([serviceHistoryfileName]);

        if (serviceFileRemoveError) throw new Error(`Failed to create car listing: ${functionResult.error || 'Unknown error from database function'}. Failed to delete service history file.`)

        console.error(`[${requestId}] Function returned failure:`, functionResult);
        throw new Error(`Failed to create car listing: ${functionResult.error || 'Unknown error from database function'}`);
      }
    } else {
      // Unexpected response format
      console.error(`[${requestId}] Unexpected function response format:`, {
        result: functionResult,
        type: typeof functionResult
      });

      // Clean up uploaded images
      await cleanupUploadedImages(supabase, carId, [
        ...Object.values(uploadedRequiredPhotos),
        ...uploadedAdditionalPhotos
      ]);


      /* delete car service history file */
      if (serviceHistoryfileName) {
        const { error: serviceFileRemoveError } = await supabase
          .storage
          .from('car-files')
          .remove([serviceHistoryfileName]);

          if(serviceFileRemoveError) throw new Error('Unexpected response from database function. Failed to delete service file or servcie file doesnt exist');
      }

      throw new Error('Unexpected response from database function');
    }

    if (!createdCarId) {
      // Clean up uploaded images if no car ID
      await cleanupUploadedImages(supabase, carId, [
        ...Object.values(uploadedRequiredPhotos),
        ...uploadedAdditionalPhotos
      ]);

      /* delete car service history file */
      if (serviceHistoryfileName) {
        const { error: serviceFileRemoveError } = await supabase
          .storage
          .from('car-files')
          .remove([serviceHistoryfileName]);

          if(serviceFileRemoveError) throw new Error('Failed to create car listing - no car ID returned from database. Failed to delete service file or servcie file doesnt exist');
      }

      console.error(`[${requestId}] No car ID available after processing:`, functionResult);
=======
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
>>>>>>> main
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
<<<<<<< HEAD

/**
 * Upload a single image to Supabase Storage
 */
async function uploadImageToStorage(
  supabase: any,
  file: File,
  carId: string,
  photoType: string
): Promise<ImageUploadResult> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${photoType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `cars/${carId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Clean up uploaded images if car creation fails
 */
async function cleanupUploadedImages(
  supabase: any,
  carId: string,
  imageUrls: string[]
): Promise<void> {
  try {
    const filePaths = imageUrls.map(url => {
      const path = url.split('/storage/v1/object/public/car-images/')[1];
      return path;
    }).filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage
        .from('car-images')
        .remove(filePaths);
    }
  } catch (error) {
    console.error('Failed to cleanup uploaded images:', error);
  }
}
=======
>>>>>>> main
