
// Notification edge function for manual valuation submissions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation, logError } from '../_shared/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Start logging operations
    const requestId = crypto.randomUUID();
    logOperation('send_valuation_notification_start', { requestId });
    
    // Parse the request
    const { userEmail, vehicleDetails } = await req.json();
    
    if (!userEmail || !vehicleDetails) {
      throw new Error('Missing required fields for notification');
    }
    
    logOperation('send_valuation_notification_data', { 
      requestId,
      userEmail: userEmail.slice(0, 3) + '***',
      vehicleDetails: {
        make: vehicleDetails.make,
        model: vehicleDetails.model
      }
    });
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );
    
    // Get the user information
    const userQuery = await supabaseAdmin.auth.admin.getUserByEmail(userEmail);
    if (userQuery.error) {
      throw new Error(`Error fetching user: ${userQuery.error.message}`);
    }
    
    // Create admin notification
    await supabaseAdmin.from('notifications').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Special ID for admin notifications
      title: 'New Manual Valuation Request',
      message: `${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.year}) requested by ${userEmail}`,
      type: 'manual_valuation',
      related_entity_type: 'manual_valuation',
      related_entity_id: null,
      is_read: false
    });
    
    // Create confirmation notification for the user
    if (userQuery.data?.user?.id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: userQuery.data.user.id,
        title: 'Manual Valuation Request Received',
        message: `We've received your valuation request for your ${vehicleDetails.make} ${vehicleDetails.model}. Our team will review and respond within 24-48 hours.`,
        type: 'confirmation',
        is_read: false
      });
    }
    
    logOperation('send_valuation_notification_complete', { requestId });
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    logError('send_valuation_notification', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
