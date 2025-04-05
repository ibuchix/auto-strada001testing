
/**
 * CarDetailsSection Component
 * - Added 2025-04-05: Created component to display car details in the valuation result
 */

interface CarDetailsSectionProps {
  make: string;
  model: string;
  year: number;
  transmission: string;
  mileage: number;
}

export const CarDetailsSection = ({
  make,
  model,
  year,
  transmission,
  mileage
}: CarDetailsSectionProps) => {
  return (
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
          <p className="font-medium">{year} {make} {model}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Transmission</h3>
          <p className="font-medium capitalize">{transmission}</p>
        </div>
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-gray-500">Mileage</h3>
          <p className="font-medium">{new Intl.NumberFormat().format(mileage)} km</p>
        </div>
      </div>
    </div>
  );
};
