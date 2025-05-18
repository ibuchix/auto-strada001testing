
/**
 * API route handler for car image uploads
 * Created: 2025-05-24
 * 
 * This file serves as a proxy between the client-side image upload requests 
 * and the process-image edge function.
 */

import { supabase } from "@/integrations/supabase/client";

export async function POST(request: Request) {
  try {
    console.log("API route: Processing car image upload request");
    
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const carId = formData.get('carId') as string;
    
    if (!file || !carId) {
      console.error("API route: Missing file or carId in upload request");
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: file and carId are required' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Log file details
    console.log(`API route: Uploading file "${file.name}" (${file.size} bytes) for car ${carId}`);
    
    // Determine the file category
    const type = formData.get('type') as string || 'additional_photos';
    
    // Forward to the process-image edge function
    console.log(`API route: Invoking process-image edge function with type "${type}"`);
    const { data, error } = await supabase.functions.invoke('process-image', {
      body: { 
        carId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        type
      },
      file: file,
    });

    if (error) {
      console.error("API route: Edge function error:", error);
      return new Response(
        JSON.stringify({ error: `Edge function error: ${error.message}` }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("API route: Upload successful, returning data:", data);
    
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error("API route: Unhandled exception:", err);
    return new Response(
      JSON.stringify({ error: 'Internal server error during file upload' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
