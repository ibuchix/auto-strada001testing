/**
 * Edge function for seller operations
 * Updated: 2025-04-17 - Consolidated imports from shared module
 */

import { 
  corsHeaders,
  logOperation,
  ValidationError,
  formatResponse
} from "../_shared/index.ts";

import {
  ApiError,
  safeJsonParse
} from "./utils.ts";

// Define types for seller operations
type SellerOperation = 'create_seller' | 'update_seller' | 'delete_seller';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validate the request
    const { operation, payload } = await validateRequest(req);

    // Log the operation
    logOperation('seller_operation_received', { operation, payload });

    // Process the seller operation
    switch (operation) {
      case 'create_seller':
        return await createSeller(payload);
      case 'update_seller':
        return await updateSeller(payload);
      case 'delete_seller':
        return await deleteSeller(payload);
      default:
        throw new ValidationError(`Unsupported operation: ${operation}`, 'INVALID_OPERATION');
    }
  } catch (error) {
    // Log and format the error response
    logOperation('seller_operation_failed', { error: error.message, stack: error.stack }, 'error');
    return formatResponse({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});

/**
 * Creates a new seller in the database.
 * @param payload - The data required to create a seller.
 * @returns A formatted response indicating success or failure.
 */
async function createSeller(payload: any): Promise<Response> {
  try {
    // Validate payload
    if (!payload.user_id || !payload.seller_name) {
      throw new ValidationError('Missing required fields for creating a seller.', 'MISSING_FIELDS');
    }

    const supabaseClient = createClient();

    // Insert the new seller into the database
    const { data, error } = await supabaseClient
      .from('sellers')
      .insert([
        {
          user_id: payload.user_id,
          seller_name: payload.seller_name,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zip_code: payload.zip_code,
          description: payload.description,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      throw new ApiError(`Database error creating seller: ${error.message}`, 'DB_ERROR');
    }

    // Log the successful creation
    logOperation('seller_created', { sellerId: data[0].id, userId: payload.user_id });

    // Return a success response
    return formatResponse({ success: true, data: data[0] }, { headers: corsHeaders });
  } catch (error) {
    // Log the error
    logOperation('create_seller_failed', { error: error.message, stack: error.stack }, 'error');

    // Return an error response
    return formatResponse({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Updates an existing seller in the database.
 * @param payload - The data required to update a seller.
 * @returns A formatted response indicating success or failure.
 */
async function updateSeller(payload: any): Promise<Response> {
  try {
    // Validate payload
    if (!payload.id) {
      throw new ValidationError('Missing seller ID for updating.', 'MISSING_SELLER_ID');
    }

    const supabaseClient = createClient();

    // Update the seller in the database
    const { data, error } = await supabaseClient
      .from('sellers')
      .update({
        seller_name: payload.seller_name,
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        zip_code: payload.zip_code,
        description: payload.description,
        is_active: payload.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id)
      .select();

    if (error) {
      throw new ApiError(`Database error updating seller: ${error.message}`, 'DB_ERROR');
    }

    if (!data || data.length === 0) {
      throw new ApiError('Seller not found for updating.', 'SELLER_NOT_FOUND');
    }

    // Log the successful update
    logOperation('seller_updated', { sellerId: payload.id });

    // Return a success response
    return formatResponse({ success: true, data: data[0] }, { headers: corsHeaders });
  } catch (error) {
    // Log the error
    logOperation('update_seller_failed', { error: error.message, stack: error.stack }, 'error');

    // Return an error response
    return formatResponse({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Deletes a seller from the database.
 * @param payload - The data required to delete a seller (seller ID).
 * @returns A formatted response indicating success or failure.
 */
async function deleteSeller(payload: any): Promise<Response> {
  try {
    // Validate payload
    if (!payload.id) {
      throw new ValidationError('Missing seller ID for deleting.', 'MISSING_SELLER_ID');
    }

    const supabaseClient = createClient();

    // Delete the seller from the database
    const { data, error } = await supabaseClient
      .from('sellers')
      .delete()
      .eq('id', payload.id)
      .select();

    if (error) {
      throw new ApiError(`Database error deleting seller: ${error.message}`, 'DB_ERROR');
    }

    if (!data || data.length === 0) {
      throw new ApiError('Seller not found for deleting.', 'SELLER_NOT_FOUND');
    }

    // Log the successful deletion
    logOperation('seller_deleted', { sellerId: payload.id });

    // Return a success response
    return formatResponse({ success: true, data: { id: payload.id } }, { headers: corsHeaders });
  } catch (error) {
    // Log the error
    logOperation('delete_seller_failed', { error: error.message, stack: error.stack }, 'error');

    // Return an error response
    return formatResponse({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
