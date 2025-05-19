
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
    let metadata;
    
    try {
      formData = await req.formData();
      console.log(`[${requestId}] FormData keys:`, [...formData.keys()]);
      
      // Get file from FormData
      file = formData.get('file') as File;
      
      // Get metadata - either as separate field or from request headers
      const metadataStr = formData.get('metadata') as string;
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr);
          console.log(`[${requestId}] Metadata parsed from formData:`, metadata);
        } catch (e) {
          console.error(`[${requestId}] Error parsing metadata:`, e);
        }
      }
      
      console.log(`[${requestId}] Successfully parsed FormData, found file: ${!!file}, file type: ${file?.type}, file size: ${file?.size}`);
    } catch (formError) {
      // If formData fails, try parsing as JSON with a separate file
      console.log(`[${requestId}] FormData parsing failed, trying JSON body:`, formError);
      
      try {
        const jsonData = await req.json();
        console.log(`[${requestId}] JSON data parsed:`, jsonData);
        
        file = jsonData.file;
        metadata = jsonData;
        
        if (!file) {
          console.error(`[${requestId}] No file found in JSON request`);
          throw new Error('No file provided in request');
        }
      } catch (jsonError) {
        console.error(`[${requestId}] JSON parsing also failed:`, jsonError);
        throw new Error('Failed to parse request body as FormData or JSON');
      }
    }
    
    // Extract required parameters from metadata or formData
    const type = metadata?.type || formData?.get('type') as string || 'additional_photos';
    const carId = metadata?.carId || formData?.get('carId') as string;
    const incomingRequestId = metadata?.requestId || requestId;

    console.log(`[${incomingRequestId}] Request parameters: type=${type}, carId=${carId}, file size=${file?.size || 'unknown'}`);

    // Validate the upload
    console.log(`[${incomingRequestId}] Validating upload`);
    validateUpload(file, type);

    // Upload file to storage
    console.log(`[${incomingRequestId}] Uploading file to storage`);
    const { filePath, supabase } = await uploadFileToStorage(file, carId, type);
    console.log(`[${incomingRequestId}] File uploaded successfully to path: ${filePath}`);

    // Get the public URL
    console.log(`[${incomingRequestId}] Getting public URL`);
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    console.log(`[${incomingRequestId}] Public URL: ${publicUrl}`);

    // Log the upload in the database
    console.log(`[${incomingRequestId}] Logging upload in database`);
    await logFileUpload(supabase, carId, filePath, type, file);

    // Update car's photos or documents
    console.log(`[${incomingRequestId}] Updating car record`);
    await updateCarRecord(supabase, type, filePath, carId);

    const duration = Date.now() - startTime;
    console.log(`[${incomingRequestId}] Request completed successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({ 
        message: 'File uploaded successfully',
        filePath,
        publicUrl,
        requestId: incomingRequestId,
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
