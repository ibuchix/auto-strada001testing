import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { ManualValuationData } from "../ManualValuationForm";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];
type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];

interface FormFieldsProps {
  formData: ManualValuationData;
  errors: Partial<Record<keyof ManualValuationData, string>>;
  onInputChange: (field: keyof ManualValuationData, value: string) => void;
}

const fuelOptions: { value: FuelType; display: string }[] = [
  { value: "petrol", display: "Petrol" },
  { value: "diesel", display: "Diesel" },
  { value: "electric", display: "Electric" },
  { value: "hybrid", display: "Hybrid" },
  { value: "lpg", display: "LPG" }
];

const transmissionOptions: { value: TransmissionType; display: string }[] = [
  { value: "manual", display: "Manual" },
  { value: "automatic", display: "Automatic" },
  { value: "semi_automatic", display: "Semi-Automatic" }
];

const countryOptions: { value: CountryCode; display: string }[] = [
  { value: "PL", display: "Poland" },
  { value: "DE", display: "Germany" },
  { value: "UK", display: "United Kingdom" }
];

export const FormFields = ({ formData, errors, onInputChange }: FormFieldsProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="make">Make</Label>
        <Input
          id="make"
          value={formData.make}
          onChange={(e) => onInputChange('make', e.target.value)}
          placeholder="e.g., BMW"
          className={errors.make ? 'border-primary' : ''}
        />
        {errors.make && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.make}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => onInputChange('model', e.target.value)}
          placeholder="e.g., X5"
          className={errors.model ? 'border-primary' : ''}
        />
        {errors.model && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.model}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          type="number"
          min="1900"
          max={currentYear + 1}
          value={formData.year}
          onChange={(e) => onInputChange('year', e.target.value)}
          placeholder="e.g., 2020"
          className={errors.year ? 'border-primary' : ''}
        />
        {errors.year && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.year}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="mileage">Mileage (KM)</Label>
        <Input
          id="mileage"
          type="number"
          min="0"
          value={formData.mileage}
          onChange={(e) => onInputChange('mileage', e.target.value)}
          placeholder="e.g., 50000"
          className={errors.mileage ? 'border-primary' : ''}
        />
        {errors.mileage && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.mileage}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="transmission">Transmission</Label>
        <Select
          value={formData.transmission}
          onValueChange={(value: TransmissionType) => onInputChange('transmission', value)}
        >
          <SelectTrigger className={errors.transmission ? 'border-primary' : ''}>
            <SelectValue placeholder="Select transmission type" />
          </SelectTrigger>
          <SelectContent>
            {transmissionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.transmission && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.transmission}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="fuel">Fuel Type</Label>
        <Select
          value={formData.fuel}
          onValueChange={(value: FuelType) => onInputChange('fuel', value)}
        >
          <SelectTrigger className={errors.fuel ? 'border-primary' : ''}>
            <SelectValue placeholder="Select fuel type" />
          </SelectTrigger>
          <SelectContent>
            {fuelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.fuel && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.fuel}</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="country">Country</Label>
        <Select
          value={formData.country}
          onValueChange={(value: CountryCode) => onInputChange('country', value)}
        >
          <SelectTrigger className={errors.country ? 'border-primary' : ''}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.country}</span>
          </div>
        )}
      </div>
    </div>
  );
};