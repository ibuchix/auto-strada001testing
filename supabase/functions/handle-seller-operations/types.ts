
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
