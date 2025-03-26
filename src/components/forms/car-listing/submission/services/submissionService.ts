
/**
 * Fixed database type compatibility issues
 */

import { CarListingFormData, carFeaturesToJson } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { validateValuationData } from "../utils/validationHandler";
import { toast } from "sonner";

export const submitCarListing = async (
  formData: CarListingFormData,
  userId: string,
  carId?: string
): Promise<{ success: boolean; carId?: string; error?: string }> => {
  try {
    const valuationData = validateValuationData();
    
    // Organize data for submission
    const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`;
    const timestamp = new Date().toISOString();
    
    // Convert CarFeatures to JSON object for database compatibility
    const featuresJson = carFeaturesToJson(formData.features);
    
    // Create DB record
    const dbData = {
      id: carId, // Include ID only if updating an existing record
      seller_id: userId,
      title,
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      vin: valuationData.vin,
      mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
      price: valuationData.valuation || valuationData.averagePrice,
      reserve_price: valuationData.reservePrice,
      transmission: valuationData.transmission,
      valuation_data: valuationData,
      is_draft: false,
      name: formData.name,
      seller_name: formData.name,
      address: formData.address,
      mobile_number: formData.mobileNumber,
      features: featuresJson,
      is_damaged: formData.isDamaged,
      is_registered_in_poland: formData.isRegisteredInPoland,
      is_selling_on_behalf: formData.isSellingOnBehalf,
      has_private_plate: formData.hasPrivatePlate,
      finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
      service_history_type: formData.serviceHistoryType,
      seller_notes: formData.sellerNotes,
      seat_material: formData.seatMaterial,
      number_of_keys: formData.numberOfKeys ? parseInt(formData.numberOfKeys) : 1,
      additional_photos: formData.uploadedPhotos || [],
      damage_reports: formData.damageReports || [],
      updated_at: timestamp,
      status: 'pending_verification'
    };
    
    let result;
    
    try {
      // Try using the security definer function first (if available)
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_car_listing' as any,
        { p_car_data: dbData }
      );
      
      if (!rpcError && rpcResult) {
        console.log('Submission successful via security definer function', rpcResult);
        
        const resultObj = rpcResult as any;
        result = { 
          success: true, 
          carId: resultObj.car_id ? String(resultObj.car_id) : carId
        };
      } else {
        console.warn('Security definer function failed, falling back to standard approach:', rpcError);
        // Continue to fallback approach
      }
    } catch (rpcException) {
      console.warn('Exception calling security definer function:', rpcException);
      // Continue to fallback approach
    }
    
    // If RPC method didn't succeed, use standard approach
    if (!result) {
      console.log('Using standard approach for submission');
      
      // Use upsert approach to handle both creating and updating
      const { data, error } = await supabase
        .from('cars')
        .upsert(dbData as any)
        .select();
      
      if (error) throw error;
      
      result = { 
        success: true, 
        carId: data?.[0]?.id || carId 
      };
    }
    
    // Create verification record for the car
    if (result.carId) {
      try {
        await supabase
          .from('listing_verifications')
          .insert({
            car_id: result.carId,
            verification_status: 'pending',
            submitted_at: timestamp,
            notes: 'Submitted by seller'
          });
      } catch (verificationError) {
        console.error('Error creating verification record:', verificationError);
        // Don't fail the overall submission if just the verification record fails
      }
    }
    
    // Additional processing - clearing localStorage
    localStorage.removeItem('formCurrentStep');
    localStorage.removeItem('formValues');
    
    return result;
  } catch (error: any) {
    console.error('Error submitting car listing:', error);
    throw {
      message: "Failed to submit listing",
      description: error.message || "Please try again later",
    };
  }
};
