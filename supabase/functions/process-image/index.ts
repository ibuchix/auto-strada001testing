
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions } from "./utils/cors.ts";
import { validateUpload } from "./utils/validation.ts";
import { uploadFileToStorage, logFileUpload, updateCarRecord } from "./utils/storage.ts";

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] Starting process-image request at ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight request`);
    return handleCorsOptions();
  }

  try {
    console.log(`[${requestId}] Parsing request body`);
    
    // Parse FormData from request
    let formData;
    let file;
    
    try {
      formData = await req.formData();
      file = formData.get('file') as File;
      console.log(`[${requestId}] Successfully parsed FormData, found file: ${!!file}`);
    } catch (formError) {
      // If formData fails, try parsing as JSON with a separate file
      console.log(`[${requestId}] FormData parsing failed, trying JSON body`);
      const jsonData = await req.json();
      file = jsonData.file;
      
      if (!file) {
        console.error(`[${requestId}] No file found in request`);
        throw new Error('No file provided in request');
      }
      
      // Use the rest of the JSON data as formData
      const tempFormData = new FormData();
      Object.keys(jsonData).forEach(key => {
        if (key !== 'file') {
          tempFormData.append(key, jsonData[key]);
        }
      });
      formData = tempFormData;
    }
    
    const type = formData.get('type') as string;
    const carId = formData.get('carId') as string;

    console.log(`[${requestId}] Request parameters: type=${type}, carId=${carId}, file size=${file?.size || 'unknown'}`);

    // Validate the upload
    console.log(`[${requestId}] Validating upload`);
    validateUpload(file, type);

    // Upload file to storage
    console.log(`[${requestId}] Uploading file to storage`);
    const { filePath, supabase } = await uploadFileToStorage(file, carId, type);
    console.log(`[${requestId}] File uploaded successfully to path: ${filePath}`);

    // Get the public URL
    console.log(`[${requestId}] Getting public URL`);
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    console.log(`[${requestId}] Public URL: ${publicUrl}`);

    // Log the upload in the database
    console.log(`[${requestId}] Logging upload in database`);
    await logFileUpload(supabase, carId, filePath, type, file);

    // Update car's photos or documents
    console.log(`[${requestId}] Updating car record`);
    await updateCarRecord(supabase, type, filePath, carId);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Request completed successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({ 
        message: 'File uploaded successfully',
        filePath,
        publicUrl,
        requestId,
        duration
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error after ${duration}ms:`, error);
    
    // Get detailed error information
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
    };
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process file', 
        details: error.message,
        requestId,
        errorDetails,
        duration
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    );
  }
});
