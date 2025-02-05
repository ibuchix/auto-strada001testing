
export interface ValuationRequest {
  operation: 'validate_vin';
  vin: string;
  mileage: number;
  gearbox: string;
  userId?: string;
}

export interface ValidationResponse {
  success: boolean;
  data: {
    make?: string;
    model?: string;
    year?: number;
    vin: string;
    transmission?: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    noData?: boolean;
    error?: string;
    reservationId?: string;
  };
}

export interface SearchHistory {
  search_data: {
    make: string;
    model: string;
    year: number;
    valuation: number;
    averagePrice?: number;
  };
}
