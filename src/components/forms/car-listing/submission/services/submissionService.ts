
/**
 * This file handles the car listing form submission operations
 * Updated: 2025-05-05 - Fixed TypeScript errors and type issues
 * Updated: 2025-05-09 - Fixed ErrorCategory type compatibility issues
 * Updated: 2025-05-10 - Updated imports to use global ErrorCategory type
 */

import { supabase } from '@/integrations/supabase/client';
import { CarListingFormData, CarFeatures } from '@/types/forms';
import { prepareSubmission } from '../utils/submission';
import { toast } from 'sonner';
import { ValidationSubmissionError } from '../types';
import { ErrorCategory } from '@/errors/types';

export async function submitCarListing(
  formData: CarListingFormData,
  userId: string,
  draftId?: string
): Promise<any> {
  try {
    // Prepare data for submission
    const data = prepareSubmission(formData);
    
    // Ensure seller_id is set
    data.seller_id = userId;
    
    // Determine if this is a new submission or an update to an existing one
    const isUpdate = !!draftId;
    
    console.log(`Submitting car listing (${isUpdate ? 'UPDATE' : 'CREATE'}):`, {
      id: draftId || 'new',
      make: data.make,
      model: data.model
    });
    
    const { data: result, error } = isUpdate
      ? await supabase
          .from('cars')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
            status: 'pending'
          })
          .eq('id', draftId)
          .select()
          .single()
      : await supabase
          .from('cars')
          .insert({
            ...data,
            seller_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'pending'
          })
          .select()
          .single();
    
    if (error) {
      console.error('Error submitting car listing:', error);
      throw new ValidationSubmissionError(`Failed to submit car listing: ${error.message}`);
    }
    
    // Prepare properly structured car features data
    const features: CarFeatures = {
      airConditioning: formData.features?.airConditioning || false,
      bluetooth: formData.features?.bluetooth || false,
      cruiseControl: formData.features?.cruiseControl || false,
      leatherSeats: formData.features?.leatherSeats || false,
      navigation: formData.features?.navigation || false,
      parkingSensors: formData.features?.parkingSensors || false,
      sunroof: formData.features?.sunroof || false,
      satNav: formData.features?.satNav || false,
      panoramicRoof: formData.features?.panoramicRoof || false,
      reverseCamera: formData.features?.reverseCamera || false,
      heatedSeats: formData.features?.heatedSeats || false,
      upgradedSound: formData.features?.upgradedSound || false,
      alloyWheels: formData.features?.alloyWheels || false,
      keylessEntry: formData.features?.keylessEntry || false,
      adaptiveCruiseControl: formData.features?.adaptiveCruiseControl || false,
      laneDepartureWarning: formData.features?.laneDepartureWarning || false,
    };
    
    // Update features in a separate query to ensure proper JSON structure
    if (result?.id) {
      await supabase
        .from('cars')
        .update({ 
          features 
        })
        .eq('id', result.id);
    }
    
    // Clear localStorage form data on successful submission
    localStorage.removeItem(`car_form_${userId}`);
    
    // Show success message
    toast.success(isUpdate ? 'Car listing updated successfully!' : 'Car listing submitted successfully!');
    
    return result;
  } catch (error) {
    console.error('Error in submitCarListing:', error);
    throw error;
  }
}

export async function saveCarListingDraft(
  formData: CarListingFormData,
  userId: string,
  draftId?: string
): Promise<any> {
  try {
    // Prepare data for submission
    const data = {
      ...formData,
      seller_id: userId,
      updated_at: new Date().toISOString(),
      status: 'draft'
    };
    
    // Ensure features is properly structured
    if (formData.features) {
      data.features = {
        airConditioning: formData.features.airConditioning || false,
        bluetooth: formData.features.bluetooth || false,
        cruiseControl: formData.features.cruiseControl || false,
        leatherSeats: formData.features.leatherSeats || false,
        navigation: formData.features.navigation || false,
        parkingSensors: formData.features.parkingSensors || false,
        sunroof: formData.features.sunroof || false,
        satNav: formData.features.satNav || false,
        panoramicRoof: formData.features.panoramicRoof || false,
        reverseCamera: formData.features.reverseCamera || false,
        heatedSeats: formData.features.heatedSeats || false,
        upgradedSound: formData.features.upgradedSound || false,
        alloyWheels: formData.features.alloyWheels || false,
        keylessEntry: formData.features.keylessEntry || false,
        adaptiveCruiseControl: formData.features.adaptiveCruiseControl || false,
        laneDepartureWarning: formData.features.laneDepartureWarning || false,
      };
    }

    const isUpdate = !!draftId;
    
    const { data: result, error } = isUpdate
      ? await supabase
          .from('cars')
          .update(data)
          .eq('id', draftId)
          .select()
          .single()
      : await supabase
          .from('cars')
          .insert({
            ...data,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
    
    if (error) {
      console.error('Error saving car listing draft:', error);
      throw new ValidationSubmissionError(`Failed to save draft: ${error.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error in saveCarListingDraft:', error);
    throw error;
  }
}

export async function fetchCarListingDraft(draftId: string): Promise<CarListingFormData | null> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', draftId)
      .single();
    
    if (error) {
      console.error('Error fetching car listing draft:', error);
      return null;
    }
    
    return data as CarListingFormData;
  } catch (error) {
    console.error('Error in fetchCarListingDraft:', error);
    return null;
  }
}
