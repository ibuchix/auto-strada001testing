interface VehicleDetailsProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
}

export const VehicleDetails = ({ 
  make, 
  model, 
  year, 
  vin, 
  transmission, 
  mileage 
}: VehicleDetailsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">Manufacturer</p>
        <p className="font-medium text-dark">{make || 'N/A'}</p>
      </div>
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">Model</p>
        <p className="font-medium text-dark">{model || 'N/A'}</p>
      </div>
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">Year</p>
        <p className="font-medium text-dark">{year || 'N/A'}</p>
      </div>
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">VIN</p>
        <p className="font-medium text-dark">{vin}</p>
      </div>
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">Transmission</p>
        <p className="font-medium text-dark capitalize">{transmission || 'N/A'}</p>
      </div>
      <div className="bg-accent/50 p-4 rounded-lg">
        <p className="text-sm text-subtitle mb-1">Mileage</p>
        <p className="font-medium text-dark">{mileage.toLocaleString()} km</p>
      </div>
    </div>
  );
};