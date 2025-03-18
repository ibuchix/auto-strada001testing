
// Define the notification request type
interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

// Define the bulk notification request type
interface CreateBulkNotificationRequest {
  userIds: string[];
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

Deno.serve(async (req) => {
  try {
    // Check for CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    
    // Determine if this is a bulk notification request
    const isBulkRequest = Array.isArray(requestData.userIds) && requestData.userIds.length > 0;

    if (isBulkRequest) {
      // Handle bulk notification creation
      const { userIds, title, message, type, actionUrl, relatedEntityType, relatedEntityId } = requestData as CreateBulkNotificationRequest;
      
      // Create notifications for each user
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        is_read: false,
        created_at: new Date().toISOString()
      }));
      
      // Insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create bulk notifications', details: insertError }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, count: userIds.length }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Handle single notification creation
      const { userId, title, message, type, actionUrl, relatedEntityType, relatedEntityId } = requestData as CreateNotificationRequest;
      
      // Create notification
      const { data: notification, error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          is_read: false
        })
        .select()
        .single();
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create notification', details: insertError }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, notification }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
