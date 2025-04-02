
/**
 * Changes made:
 * - 2025-11-01: Enhanced display of valuation data with better error handling 
 * - 2024-11-21: Fixed missing formatters import by adding it to the project
 */

import { formatCurrency } from "@/utils/formatters";
import { ValuationData } from "../types";

interface ValuationDetailsProps {
  data: ValuationData;
}

export const ValuationDetails: React.FC<ValuationDetailsProps> = ({ data }) => {
  // Log data to help with troubleshooting
  console.log("Rendering ValuationDetails with data:", data);
  
  // Ensure we have the required data
  const make = data.make || 'Unknown';
  const model = data.model || 'Unknown';
  const year = data.year || new Date().getFullYear();
  const mileage = data.mileage || 0;
  
  // For valuation data, use fallbacks to ensure we always have values to display
  const valuation = data.valuation || data.averagePrice || 0;
  const reservePrice = data.reservePrice || Math.round(valuation * 0.75); // Fallback calculation if missing
  
  return (
    <div className="space-y-6 px-2">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-secondary">
          {make} {model} ({year})
        </h3>
        <p className="text-secondary/70">
          {mileage.toLocaleString()} km | {data.transmission || 'Unknown'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-secondary/70">Valuation:</span>
              <span className="text-xl font-bold text-secondary">
                {formatCurrency(valuation)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-secondary/70">Reserve Price:</span>
              <span className="text-xl font-bold text-secondary">
                {formatCurrency(reservePrice)}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-secondary/60 italic">
              This is an estimated valuation based on the information provided.
              The actual selling price may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
