
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest, ValidationResponse } from './types.ts';
import { validateVehicleHistory, checkVinSearchHistory, fetchVehicleData, createErrorResponse, createSuccessResponse } from './validation.ts';
import { createVinReservation, checkExistingReservation } from './reservations.ts';

export async function handleVinValidation(
  supabase: SupabaseClient,
  request: ValuationRequest
): Promise<ValidationResponse> {
  const { vin, mileage, gearbox, userId } = request;
  console.log('Starting VIN validation for:', vin);

  // Log operation start
  const { data: operationLog, error: logError } = await supabase
    .from('seller_operations')
    .insert({
      seller_id: userId,
      operation_type: 'validate_vin',
      input_data: { vin, mileage, gearbox },
      success: false
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to log operation:', logError);
  }

  try {
    // Check for existing active reservation
    const existingReservation = await checkExistingReservation(supabase, vin);
    if (existingReservation) {
      if (existingReservation.seller_id === userId) {
        console.log('User already has an active reservation for this VIN');
        return createSuccessResponse({
          vin,
          transmission: gearbox,
          reservationId: existingReservation.id
        });
      } else {
        console.log('VIN is currently reserved by another user');
        return createErrorResponse(vin, gearbox, 'This VIN is currently reserved by another user. Please try again later.');
      }
    }

    // Check if VIN exists in cars table
    const existingCar = await validateVehicleHistory(supabase, vin);
    if (existingCar) {
      const response = createSuccessResponse({
        vin,
        transmission: gearbox,
        isExisting: true,
        error: 'This vehicle has already been listed'
      });

      if (operationLog) {
        await supabase
          .from('seller_operations')
          .update({
            success: true,
            output_data: response,
            error_message: 'Vehicle already listed'
          })
          .eq('id', operationLog.id);
      }

      return response;
    }

    // Create VIN reservation
    const reservation = await createVinReservation(supabase, vin, userId!);

    // Check VIN search history
    const searchHistory = await checkVinSearchHistory(supabase, vin);
    if (searchHistory?.search_data) {
      const response = createSuccessResponse({
        ...searchHistory.search_data,
        transmission: gearbox,
        isExisting: false,
        vin,
        reservationId: reservation.id
      });

      if (operationLog) {
        await supabase
          .from('seller_operations')
          .update({
            success: true,
            output_data: response,
            error_message: 'Used cached VIN data'
          })
          .eq('id', operationLog.id);
      }

      return response;
    }

    // Fetch new vehicle data
    const responseData = await fetchVehicleData(vin, mileage);
    console.log('Raw API response:', responseData);

    // Extract required data
    const { make, model, year } = responseData;
    const valuation = responseData.valuation?.calcValuation?.price;
    const averagePrice = responseData.valuation?.calcValuation?.price_avr || valuation;

    if (!make || !model || !year || (!valuation && !averagePrice)) {
      console.log('Missing required data in API response');
      
      const noDataResponse = createSuccessResponse({
        vin,
        transmission: gearbox,
        noData: true,
        error: 'Could not retrieve complete vehicle information',
        reservationId: reservation.id
      });

      // Store the no-data result
      await supabase
        .from('vin_search_results')
        .insert({
          vin,
          search_data: { noData: true, error: 'Could not retrieve complete vehicle information' },
          success: false
        });

      if (operationLog) {
        await supabase
          .from('seller_operations')
          .update({
            success: true,
            output_data: noDataResponse,
            error_message: 'No data available for VIN'
          })
          .eq('id', operationLog.id);
      }

      return noDataResponse;
    }

    const validationData = {
      make,
      model,
      year: parseInt(String(year)),
      vin,
      transmission: gearbox,
      valuation,
      averagePrice,
      isExisting: false
    };

    // Cache the validation result
    await supabase
      .from('vin_search_results')
      .insert({
        vin,
        search_data: validationData,
        success: true,
        user_id: userId
      });

    const successResponse = createSuccessResponse({
      ...validationData,
      reservationId: reservation.id
    });

    // Update operation log with success
    if (operationLog) {
      await supabase
        .from('seller_operations')
        .update({
          success: true,
          output_data: successResponse
        })
        .eq('id', operationLog.id);
    }

    console.log('Returning validation data:', validationData);
    return successResponse;

  } catch (error) {
    console.error('Error in VIN validation:', error);
    if (operationLog) {
      await supabase
        .from('seller_operations')
        .update({
          success: false,
          error_message: error.message
        })
        .eq('id', operationLog.id);
    }
    throw error;
  }
}
