
/**
 * API route handler for car image uploads
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed file upload to edge function and added comprehensive logging
 * 
 * This file serves as a proxy between the client-side image upload requests 
 * and the process-image edge function.
 */

import { supabase } from "@/integrations/supabase/client";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] API route: Starting car image upload request processing`);
  
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const carId = formData.get('carId') as string;
    const type = formData.get('type') as string || 'additional_photos';
    
    console.log(`[${requestId}] API route: Received upload request for car ${carId}, type ${type}`);
    
    if (!file || !carId) {
      console.error(`[${requestId}] API route: Missing required parameters`, { 
        hasFile: !!file, 
        hasCarId: !!carId 
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: file and carId are required',
          requestId 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Log file details
    console.log(`[${requestId}] API route: Uploading file "${file.name}" (${file.size} bytes) for car ${carId}`);
    
    // Create a new FormData object to send to the edge function
    const functionFormData = new FormData();
    
    // Add the metadata as JSON
    const metadata = { 
      carId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type,
      requestId
    };
    
    functionFormData.append('metadata', JSON.stringify(metadata));
    
    // Add the file with a clear key name
    functionFormData.append('file', file);
    
    console.log(`[${requestId}] API route: Invoking process-image edge function with type "${type}"`);
    
    // Invoke the edge function with the FormData
    const { data, error } = await supabase.functions.invoke('process-image', {
      body: functionFormData,
    });

    if (error) {
      console.error(`[${requestId}] API route: Edge function error:`, error);
      return new Response(
        JSON.stringify({ 
          error: `Edge function error: ${error.message}`,
          requestId,
          errorDetails: error
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] API route: Upload successful, returning data:`, data);
    
    return new Response(
      JSON.stringify({
        ...data,
        requestId
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error(`[${requestId}] API route: Unhandled exception:`, err);
    
    // Try direct storage upload as fallback if API route fails
    try {
      console.log(`[${requestId}] API route: Attempting direct storage upload fallback`);
      
      // Get formData again as it might have been consumed
      const formData = await request.clone().formData();
      const file = formData.get('file') as File;
      const carId = formData.get('carId') as string;
      const type = formData.get('type') as string || 'additional_photos';
      
      if (!file || !carId) {
        throw new Error('Missing required parameters for fallback');
      }
      
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `cars/${userId}/${carId}/${type}/${fileName}`;
      
      console.log(`[${requestId}] API route: Fallback - uploading to ${filePath}`);
      
      // Upload to storage directly
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);
        
      console.log(`[${requestId}] API route: Fallback successful, returning URL: ${publicUrl}`);
      
      return new Response(
        JSON.stringify({ 
          message: 'File uploaded successfully (fallback)',
          filePath,
          publicUrl,
          requestId,
          method: 'fallback'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (fallbackErr) {
      console.error(`[${requestId}] API route: Fallback also failed:`, fallbackErr);
      
      return new Response(
        JSON.stringify({ 
          error: 'All upload methods failed', 
          originalError: err instanceof Error ? err.message : 'Unknown error',
          fallbackError: fallbackErr instanceof Error ? fallbackErr.message : 'Unknown fallback error',
          requestId
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
}
