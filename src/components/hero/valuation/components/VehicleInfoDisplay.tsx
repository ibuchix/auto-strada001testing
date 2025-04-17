
/**
 * Component for displaying vehicle information in valuation results
 * Created: 2025-04-17
 */

import React from 'react';

interface VehicleInfoDisplayProps {
  make: string;
  model: string;
  year: number;
  transmission: string;
  mileage: number;
}

export const VehicleInfoDisplay = ({
  make,
  model,
  year,
  transmission,
  mileage
}: VehicleInfoDisplayProps) => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2">Vehicle Information</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Make:</span>
          <span className="ml-2 font-medium">{make}</span>
        </div>
        <div>
          <span className="text-gray-600">Model:</span>
          <span className="ml-2 font-medium">{model}</span>
        </div>
        <div>
          <span className="text-gray-600">Year:</span>
          <span className="ml-2 font-medium">{year}</span>
        </div>
        <div>
          <span className="text-gray-600">Transmission:</span>
          <span className="ml-2 font-medium">{transmission}</span>
        </div>
        <div>
          <span className="text-gray-600">Mileage:</span>
          <span className="ml-2 font-medium">{mileage.toLocaleString()} km</span>
        </div>
      </div>
    </div>
  );
};
