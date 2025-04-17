
/**
 * Valuation Data Type Definitions
 * Created: 2025-04-17
 * 
 * This file serves as the single source of truth for valuation data structures
 * throughout the application. All components should reference these types
 * when handling valuation data.
 */

// Standard transmission type used across the application
export type TransmissionType = 'manual' | 'automatic';

// Core valuation data interface - the standard structure for all valuation data
export interface ValuationData {
  // Vehicle information
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: TransmissionType;
  mileage: number;
  
  // Valuation information
  valuation: number;           // Primary valuation value
  reservePrice: number;        // Calculated reserve price
  averagePrice?: number;       // Market average (optional)
  basePrice?: number;          // Base calculation price (optional)
  
  // External API metadata (optional)
  apiSource?: string;          // Source of the valuation data
  valuationDate?: string;      // When the valuation was performed
  confidence?: number;         // Confidence level in valuation (0-1)
  
  // Status flags
  isExisting?: boolean;        // Flag if car already exists in system
  error?: string;              // Error information if applicable
  noData?: boolean;            // Flag for no data found
  
  // Allow for additional properties as needed
  [key: string]: any;
}

// Validation interface for required fields
export interface ValuationRequiredFields {
  make: boolean;
  model: boolean;
  year: boolean;
  valuation: boolean;
  reservePrice: boolean;
}

// External API response structure (varies by provider)
export interface ExternalValuationResponse {
  success: boolean;
  data?: {
    make?: string;
    model?: string;
    year?: number;
    price_min?: number;
    price_med?: number;
    price_max?: number;
    [key: string]: any;
  };
  error?: string;
  errorCode?: string;
}

// Consistent result structure for all valuation operations
export interface ValuationResult {
  success: boolean;
  data: ValuationData;
  meta?: {
    source: string;
    processingTimeMs?: number;
    cached?: boolean;
    requestId?: string;
  };
}

// Utilities for checking data completeness
export const isCompleteValuationData = (data: Partial<ValuationData>): boolean => {
  if (!data) return false;
  
  // Check for essential vehicle identification fields
  const hasVehicleInfo = !!(data.make && data.model && data.year);
  
  // Check for essential pricing information
  const hasPricingInfo = !!(
    (data.valuation !== undefined && data.valuation >= 0) || 
    (data.reservePrice !== undefined && data.reservePrice >= 0)
  );
  
  return hasVehicleInfo && hasPricingInfo;
};

// Get object with validation status for each required field
export const getRequiredFieldStatus = (data: Partial<ValuationData>): ValuationRequiredFields => {
  return {
    make: !!data.make,
    model: !!data.model,
    year: !!data.year,
    valuation: data.valuation !== undefined && data.valuation >= 0,
    reservePrice: data.reservePrice !== undefined && data.reservePrice >= 0
  };
};

// Calculate reserve price based on valuation using the specified formula
export const calculateReservePrice = (basePrice: number): number => {
  // Price tiers and corresponding percentages
  const tiers = [
    { max: 15000, percentage: 0.65 },
    { max: 20000, percentage: 0.46 },
    { max: 30000, percentage: 0.37 },
    { max: 50000, percentage: 0.27 },
    { max: 60000, percentage: 0.27 },
    { max: 70000, percentage: 0.22 },
    { max: 80000, percentage: 0.23 },
    { max: 100000, percentage: 0.24 },
    { max: 130000, percentage: 0.20 },
    { max: 160000, percentage: 0.185 },
    { max: 200000, percentage: 0.22 },
    { max: 250000, percentage: 0.17 },
    { max: 300000, percentage: 0.18 },
    { max: 400000, percentage: 0.18 },
    { max: 500000, percentage: 0.16 },
    { max: Infinity, percentage: 0.145 }
  ];
  
  // Find the correct tier
  const tier = tiers.find(t => basePrice <= t.max);
  const percentage = tier ? tier.percentage : 0.145; // Default to lowest percentage
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = basePrice - (basePrice * percentage);
  
  return Math.round(reservePrice); // Round to nearest whole number
};
