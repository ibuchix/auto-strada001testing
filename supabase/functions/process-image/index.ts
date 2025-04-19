
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions } from "./utils/cors.ts";
import { validateUpload } from "./utils/validation.ts";
import { uploadFileToStorage, logFileUpload, updateCarRecord } from "./utils/storage.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const carId = formData.get('carId') as string;

    // Validate the upload
    validateUpload(file, type);

    // Upload file to storage
    const { filePath, supabase } = await uploadFileToStorage(file, carId, type);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    // Log the upload
    await logFileUpload(supabase, carId, filePath, type, file);

    // Update car's photos or documents
    await updateCarRecord(supabase, type, filePath, carId);

    return new Response(
      JSON.stringify({ 
        message: 'File uploaded successfully',
        filePath,
        publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process file', 
        details: error.message 
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
