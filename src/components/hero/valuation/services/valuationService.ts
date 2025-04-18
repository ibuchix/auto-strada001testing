
/**
 * ValuationService
 * Changes made:
 * - 2025-04-22: Enhanced data handling and API response processing
 * - 2025-04-22: Added better logging and error handling
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "@/utils/valuation/valuationDataTypes";

/**
 * Get vehicle valuation from the API
 * @param vin Vehicle Identification Number
 * @param mileage Vehicle mileage
 * @param gearbox Transmission type
 * @returns Promise with valuation result
 */
export async function getValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
) {
  console.log(`[ValuationService] Fetching valuation for VIN: ${vin}, Mileage: ${mileage}, Gearbox: ${gearbox}`);
  
  try {
    // First try to get the valuation data from the get-vehicle-valuation function
    const { data: valuationData, error: valuationError } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: {
          vin,
          mileage,
          gearbox
        }
      }
    );
    
    console.log("[ValuationService] Raw API response:", { 
      valuationData, 
      valuationError, 
      success: !!valuationData && !valuationError 
    });
    
    if (valuationError) {
      console.error("[ValuationService] Valuation function error:", valuationError);
      return {
        success: false,
        error: valuationError.message || "Failed to retrieve valuation"
      };
    }

    if (!valuationData) {
      console.error("[ValuationService] No data returned from valuation function");
      return {
        success: false,
        error: "No valuation data returned from the server"
      };
    }
    
    // Check for nested data structure
    let processedData = valuationData;
    if (valuationData.data) {
      processedData = valuationData.data;
    }
    
    // Check if we have the expected vehicle data
    if (!processedData.make || !processedData.model) {
      console.warn("[ValuationService] Incomplete vehicle data:", processedData);
      
      // Try to extract information from possible different property names
      const enhancedData = {
        ...processedData,
        make: processedData.make || processedData.manufacturer || '',
        model: processedData.model || processedData.modelName || '',
        year: processedData.year || processedData.productionYear || new Date().getFullYear(),
        transmission: gearbox,
        vin: vin
      };
      
      // If we still don't have make and model, this is not valid data
      if (!enhancedData.make || !enhancedData.model) {
        console.error("[ValuationService] Missing critical vehicle information");
        return {
          success: false,
          error: "Could not retrieve vehicle information for this VIN",
          data: enhancedData
        };
      }
      
      processedData = enhancedData;
    }
    
    // Ensure pricing data is available
    if (!processedData.reservePrice && !processedData.valuation) {
      console.warn("[ValuationService] Missing pricing data, using fallbacks");
      
      // Try to calculate reserve price from other available data
      let basePrice = processedData.basePrice || processedData.averagePrice || 0;
      
      // If no base price, look for other fields
      if (basePrice <= 0) {
        if (processedData.price_med && processedData.price_min) {
          basePrice = (processedData.price_med + processedData.price_min) / 2;
        } else if (processedData.price) {
          basePrice = processedData.price;
        }
      }
      
      // Calculate reserve price if we have a base price
      if (basePrice > 0) {
        // Determine percentage based on price tier
        let percentage = 0;
        
        if (basePrice <= 15000) percentage = 0.65;
        else if (basePrice <= 20000) percentage = 0.46;
        else if (basePrice <= 30000) percentage = 0.37;
        else if (basePrice <= 50000) percentage = 0.27;
        else if (basePrice <= 60000) percentage = 0.27;
        else if (basePrice <= 70000) percentage = 0.22;
        else if (basePrice <= 80000) percentage = 0.23;
        else if (basePrice <= 100000) percentage = 0.24;
        else if (basePrice <= 130000) percentage = 0.20;
        else if (basePrice <= 160000) percentage = 0.185;
        else if (basePrice <= 200000) percentage = 0.22;
        else if (basePrice <= 250000) percentage = 0.17;
        else if (basePrice <= 300000) percentage = 0.18;
        else if (basePrice <= 400000) percentage = 0.18;
        else if (basePrice <= 500000) percentage = 0.16;
        else percentage = 0.145;
        
        const reservePrice = Math.round(basePrice - (basePrice * percentage));
        
        processedData = {
          ...processedData,
          reservePrice,
          valuation: reservePrice,
          averagePrice: basePrice,
          basePrice: basePrice
        };
        
        console.log("[ValuationService] Calculated reserve price:", { 
          basePrice, 
          reservePrice, 
          percentage 
        });
      }
    }
    
    console.log("[ValuationService] Final processed valuation data:", processedData);
    
    return {
      success: true,
      data: processedData
    };
  } catch (error: any) {
    console.error("[ValuationService] Unexpected error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Clean up temporary valuation data from localStorage
 */
export function cleanupValuationData() {
  localStorage.removeItem("valuationData");
  localStorage.removeItem("tempVIN");
  localStorage.removeItem("tempMileage");
  localStorage.removeItem("tempGearbox");
}
