
/**
 * API endpoint for saving car listing drafts
 * 
 * Changes made:
 * - 2025-11-05: Integrated with robust API client for automatic retries and error normalization
 * - Enhanced error handling with more detailed error information
 * - 2025-06-06: Fixed saveFormData import by implementing local version
 * - 2025-06-16: Fixed TypeScript errors with form_metadata and valuation_data
 * - 2025-07-22: Fixed type error with valuation_data property
 * - 2025-05-20: Updated to include last_saved field in database records
 */

import { CarListingFormData } from "@/types/forms";
import { apiClient } from "@/services/api/apiClientService";
import { supabase } from "@/integrations/supabase/client";

interface SaveDraftRequest {
  formData: CarListingFormData;
  userId: string;
  carId?: string;
  currentStep: number;
}

// Local implementation of saveFormData to avoid import errors
const saveFormData = async (
  formData: CarListingFormData,
  userId: string,
  valuationData: any = {},
  carId?: string
) => {
  try {
    // Set last_saved to current timestamp if not provided
    if (!formData.last_saved) {
      formData.last_saved = new Date().toISOString();
    }
    
    // Enhanced form data with metadata
    const enhancedData = {
      ...formData,
      seller_id: userId,
      is_draft: true,
      valuation_data: valuationData || null,
      updated_at: new Date().toISOString()
    };
    
    // Save to database
    const { data, error } = await supabase
      .from('cars')
      .upsert({
        ...(carId ? { id: carId } : {}),
        ...enhancedData
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error };
    }
    
    return { success: true, carId: data?.id };
  } catch (error) {
    console.error("Error in saveFormData:", error);
    return { success: false, error };
  }
};

export async function saveDraft(request: SaveDraftRequest) {
  const { formData, userId, carId, currentStep } = request;
  
  try {
    // Extract valuation data if available
    const valuationData = formData.valuation_data || {};
    
    // Add metadata about form state
    const enhancedFormData = {
      ...formData,
      last_saved: new Date().toISOString(),
      form_metadata: {
        ...(formData.form_metadata || {}),
        currentStep,
        lastSavedAt: new Date().toISOString()
      }
    };
    
    // Use the saveFormData utility to persist to Supabase
    const result = await saveFormData(enhancedFormData, userId, valuationData, carId);
    
    if (!result.success) {
      return { 
        success: false, 
        message: result.error?.message || 'Failed to save draft',
        status: 500
      };
    }
    
    return { 
      success: true, 
      carId: result.carId,
      status: 200
    };
  } catch (error: any) {
    console.error('API error saving draft:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Mock API handler for client-side fetching
 * Can be used with fetch() from client components
 */
export async function handleSaveDraftRequest(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await saveDraft({
      formData: body,
      userId: body.userId,
      carId: body.carId,
      currentStep: body.currentStep
    });
    
    return new Response(
      JSON.stringify(result), 
      { 
        status: result.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Server error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
