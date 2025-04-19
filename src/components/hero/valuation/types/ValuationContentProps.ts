
/**
 * Types for ValuationContent component
 * Created: 2025-04-19
 */

export interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  mileage: number;
  reservePrice: number;
  averagePrice: number;
  hasValuation: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: () => void;
}
