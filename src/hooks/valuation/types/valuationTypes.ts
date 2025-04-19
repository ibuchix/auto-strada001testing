
export interface ValuationData {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  mileage: number;
  valuation: number;
  reservePrice: number;
  averagePrice: number;
  error?: string;
  noData?: boolean;
}

export interface ValuationResult {
  normalizedData: ValuationData;
  hasError: boolean;
  shouldShowError: boolean;
  hasValuation: boolean;
  hasPricingData: boolean;
}
