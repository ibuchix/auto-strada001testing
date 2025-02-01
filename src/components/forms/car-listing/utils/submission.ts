import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { FormSubmissionResult } from "../types/submission";
import { toast } from "sonner";

export const handleFormSubmission = async (
  data: CarListingFormData,
  userId: string,
  valuationData: any,
  carId?: string
): Promise<FormSubmissionResult> => {
  try {
    console.log('Starting form submission process...');
    console.log('Valuation data:', valuationData);
    
    // Enhanced validation for valuation data
    if (!valuationData) {
      console.error('No valuation data found');
      throw new Error("Please complete the vehicle valuation first. Return to the seller's page to start the process.");
    }

    const mileage = localStorage.getItem('tempMileage');
    if (!mileage) {
      throw new Error("Please complete the vehicle valuation first");
    }
    valuationData.mileage = parseInt(mileage);

    // Detailed validation of required valuation fields
    const requiredFields = ['make', 'model', 'vin', 'mileage', 'valuation', 'year'];
    const missingFields = requiredFields.filter(field => !valuationData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required valuation fields:', missingFields);
      throw new Error(`Incomplete vehicle information. Missing: ${missingFields.join(', ')}. Please complete the valuation process.`);
    }

    // Check if VIN already exists (for non-draft listings)
    console.log('Checking for existing VIN...');
    const { data: existingCar, error: checkError } = await supabase
      .from('cars')
      .select('id, title')
      .eq('vin', valuationData.vin)
      .eq('is_draft', false)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking VIN:', checkError);
      throw checkError;
    }

    if (existingCar && (!carId || existingCar.id !== carId)) {
      return { 
        success: false, 
        error: "This vehicle has already been listed. Each vehicle can only be listed once." 
      };
    }

    // Handle finance document upload if it exists
    let financeDocumentUrl = null;
    if (data.financeDocument) {
      const fileExt = data.financeDocument.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('car-files')
        .upload(fileName, data.financeDocument);

      if (uploadError) {
        console.error('Finance document upload error:', uploadError);
        throw new Error('Failed to upload finance document');
      }

      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('car-files')
          .getPublicUrl(fileName);
        financeDocumentUrl = publicUrl;
      }
    }

    // Remove financeDocument from data and prepare submission data
    const { financeDocument, ...submissionData } = data;

    // Transform camelCase to snake_case for database fields
    const transformedData = {
      seller_id: userId,
      title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      vin: valuationData.vin,
      mileage: valuationData.mileage,
      price: valuationData.valuation || valuationData.averagePrice,
      transmission: valuationData.transmission,
      valuation_data: valuationData,
      is_draft: true,
      finance_document_url: financeDocumentUrl,
      name: submissionData.name,
      address: submissionData.address,
      mobile_number: submissionData.mobileNumber,
      features: submissionData.features,
      is_damaged: submissionData.isDamaged,
      is_registered_in_poland: submissionData.isRegisteredInPoland,
      has_tool_pack: submissionData.hasToolPack,
      has_documentation: submissionData.hasDocumentation,
      is_selling_on_behalf: submissionData.isSellingOnBehalf,
      has_private_plate: submissionData.hasPrivatePlate,
      finance_amount: submissionData.financeAmount ? parseFloat(submissionData.financeAmount) : null,
      service_history_type: submissionData.serviceHistoryType,
      seller_notes: submissionData.sellerNotes,
      seat_material: submissionData.seatMaterial,
      number_of_keys: parseInt(submissionData.numberOfKeys)
    };

    console.log('Submitting to database...');
    const { error } = carId 
      ? await supabase
          .from('cars')
          .update(transformedData)
          .eq('id', carId)
          .single()
      : await supabase
          .from('cars')
          .insert(transformedData)
          .single();

    if (error) {
      console.error('Database error:', error);
      if (error.code === '23505') {
        return { 
          success: false, 
          error: "This vehicle has already been listed. Each vehicle can only be listed once." 
        };
      }
      throw error;
    }

    console.log('Form submission completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Submission error:', error);
    
    if (error.message?.includes('timeout') || error.code === 'TIMEOUT_ERROR') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    
    return { 
      success: false, 
      error: error.message || "Failed to submit listing" 
    };
  }
};