
/**
 * API endpoint for saving car listing drafts
 * 
 * This endpoint handles persisting form data to the database
 * and provides robust error handling
 */

import { CarListingFormData } from "@/types/forms";
import { saveFormData } from "@/components/forms/car-listing/utils/formSaveUtils";

interface SaveDraftRequest {
  formData: CarListingFormData;
  userId: string;
  carId?: string;
  currentStep: number;
}

export async function saveDraft(request: SaveDraftRequest) {
  const { formData, userId, carId, currentStep } = request;
  
  try {
    // Extract valuation data if available
    const valuationData = formData.valuation_data || {};
    
    // Add metadata about form state
    const enhancedFormData = {
      ...formData,
      form_metadata: {
        ...formData.form_metadata,
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
