
export interface ValuationRequest {
  operation: string;
  vin: string;
  mileage: number;
  gearbox: string;
  userId: string;
}

export interface ProxyBidRequest {
  operation: string;
  carId: string;
}

// Add interfaces for bid responses
export interface BidResponse {
  success: boolean;
  data?: {
    bidId?: string;
    amount?: number;
    dealerId?: string;
    status?: string;
  };
  error?: string;
  message?: string;
}
