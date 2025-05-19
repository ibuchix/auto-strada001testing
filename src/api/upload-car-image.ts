
/**
 * API route handler for car image uploads
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed file upload to edge function and added comprehensive logging
 * Updated: 2025-05-19 - Deprecated API route approach in favor of direct upload to Supabase storage
 * 
 * This file has been deprecated and now serves as a diagnostic handler that will
 * always return guidance to use the direct storage approach through uploadService instead.
 */

import { supabase } from "@/integrations/supabase/client";
import { directUploadPhoto } from "@/services/supabase/uploadService";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] API route DEPRECATED: Car image upload should use direct storage instead`);
  
  // Return a response with guidance to use direct upload
  return new Response(
    JSON.stringify({ 
      error: 'This API route is deprecated. Please use the direct upload service instead.',
      requestId,
      hint: 'Import and use directUploadPhoto() from "@/services/supabase/uploadService"'
    }),
    { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
