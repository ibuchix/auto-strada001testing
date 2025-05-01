
/**
 * ValuationVehicleDetails Component
 * Created: 2025-05-01 - Added to display vehicle details in valuation dialog
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
          <p className="text-sm font-medium">{vin}</p>
        </div>
      )}
      
      <div className="rounded-md p-2 bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium">Transmission</p>
        <p className="text-sm font-medium capitalize">{transmission}</p>
      </div>
      
      <div className="rounded-md p-2 bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-500 font-medium">Mileage</p>
        <p className="text-sm font-medium">{mileage.toLocaleString()} km</p>
      </div>
    </div>
  );
};
