
/**
 * ValuationVehicleDetails Component
 * Created: 2025-05-01 - Added to display vehicle details in valuation dialog
 * Updated: 2025-05-20 - Enhanced mileage display to handle zero values
 * Updated: 2025-05-22 - Made mileage more prominent in display
 * Updated: 2025-05-23 - Ensured full VIN display with word-break
 * Updated: 2025-05-24 - Fixed mileage display format to be more readable
 */

import React from 'react';

interface ValuationVehicleDetailsProps {
  vin?: string;
  transmission: 'manual' | 'automatic';
  mileage: number;
}

export const ValuationVehicleDetails = ({
  vin,
  transmission,
  mileage
}: ValuationVehicleDetailsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {vin && (
        <div className="rounded-md p-2 bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">VIN</p>
          <p className="text-sm font-medium break-all">{vin}</p>
        </div>
      )}
      
      <div className="rounded-md p-2 bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium">Transmission</p>
        <p className="text-sm font-medium capitalize">{transmission}</p>
      </div>
      
      <div className="rounded-md p-2 bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium">Mileage</p>
        <p className="text-sm font-medium">{mileage ? mileage.toLocaleString() : '0'} km</p>
      </div>
    </div>
  );
};
