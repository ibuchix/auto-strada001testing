import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { ManualValuationData } from "../ManualValuationForm";

interface FormFieldsProps {
  formData: ManualValuationData;
  errors: Partial<ManualValuationData>;
  onInputChange: (field: keyof ManualValuationData, value: string) => void;
}

export const FormFields = ({ formData, errors, onInputChange }: FormFieldsProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="make" className="text-body">Make</Label>
        <Input
          id="make"
          placeholder="e.g., BMW"
          className={`border ${errors.make ? 'border-primary' : 'border-gray-200'}`}
          value={formData.make}
          onChange={(e) => onInputChange('make', e.target.value)}
        />
        {errors.make && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.make}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model" className="text-body">Model</Label>
        <Input
          id="model"
          placeholder="e.g., X5"
          className={`border ${errors.model ? 'border-primary' : 'border-gray-200'}`}
          value={formData.model}
          onChange={(e) => onInputChange('model', e.target.value)}
        />
        {errors.model && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.model}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="year" className="text-body">Year</Label>
        <Input
          id="year"
          type="number"
          min="1900"
          max={currentYear}
          placeholder="e.g., 2020"
          className={`border ${errors.year ? 'border-primary' : 'border-gray-200'}`}
          value={formData.year}
          onChange={(e) => onInputChange('year', e.target.value)}
        />
        {errors.year && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.year}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mileage" className="text-body">Mileage (KM)</Label>
        <Input
          id="mileage"
          type="number"
          min="0"
          max="999999"
          placeholder="e.g., 50000"
          className={`border ${errors.mileage ? 'border-primary' : 'border-gray-200'}`}
          value={formData.mileage}
          onChange={(e) => onInputChange('mileage', e.target.value)}
        />
        {errors.mileage && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.mileage}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transmission" className="text-body">Transmission</Label>
        <Select
          value={formData.transmission}
          onValueChange={(value) => onInputChange('transmission', value)}
        >
          <SelectTrigger className={`w-full border ${errors.transmission ? 'border-primary' : 'border-gray-200'}`}>
            <SelectValue placeholder="Select transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
          </SelectContent>
        </Select>
        {errors.transmission && (
          <div className="flex items-center gap-2 text-primary text-sm mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.transmission}</span>
          </div>
        )}
      </div>
    </>
  );
};