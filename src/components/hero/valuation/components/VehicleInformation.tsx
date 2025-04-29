
/**
 * VehicleInformation component for displaying vehicle details
 * Created: 2025-04-29
 */

import React from "react";

interface VehicleInformationProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
}

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage
}) => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">
        {year} {make} {model}
      </h3>
      <div className="text-sm text-gray-600 mt-1">
        <div>VIN: {vin}</div>
        <div className="mt-1">
          Transmission: {transmission === "automatic" ? "Automatic" : "Manual"}
        </div>
        <div className="mt-1">Mileage: {mileage.toLocaleString()} km</div>
      </div>
    </div>
  );
};
