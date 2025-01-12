import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface ManualValuationData {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
}

interface ManualValuationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualValuationData) => void;
  mileage?: string;
  transmission?: string;
}

export const ManualValuationForm = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  mileage = '',
  transmission = 'manual'
}: ManualValuationFormProps) => {
  const [formData, setFormData] = useState<ManualValuationData>({
    make: '',
    model: '',
    year: '',
    mileage: mileage,
    transmission: transmission
  });

  const [errors, setErrors] = useState<Partial<ManualValuationData>>({});

  const validateForm = () => {
    const newErrors: Partial<ManualValuationData> = {};
    const currentYear = new Date().getFullYear();
    
    // Make validation
    if (!formData.make.trim()) {
      newErrors.make = "Make is required";
    } else if (formData.make.length < 2) {
      newErrors.make = "Make must be at least 2 characters";
    }

    // Model validation
    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    } else if (formData.model.length < 2) {
      newErrors.model = "Model must be at least 2 characters";
    }

    // Year validation
    const yearNum = parseInt(formData.year);
    if (!formData.year.trim()) {
      newErrors.year = "Year is required";
    } else if (yearNum < 1900 || yearNum > currentYear) {
      newErrors.year = `Year must be between 1900 and ${currentYear}`;
    }

    // Mileage validation
    const mileageNum = parseInt(formData.mileage);
    if (!formData.mileage.trim()) {
      newErrors.mileage = "Mileage is required";
    } else if (isNaN(mileageNum) || mileageNum < 0 || mileageNum > 999999) {
      newErrors.mileage = "Please enter a valid mileage between 0 and 999,999";
    }

    // Transmission validation
    if (!formData.transmission) {
      newErrors.transmission = "Transmission type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Validating form data:', formData);
    
    if (validateForm()) {
      console.log('Form validation passed, submitting:', formData);
      onSubmit(formData);
    } else {
      console.log('Form validation failed:', errors);
      toast.error("Please correct the errors in the form");
    }
  };

  const handleInputChange = (field: keyof ManualValuationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-oswald font-bold text-dark text-center mb-4">
            Enter Vehicle Details
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="make" className="text-body">Make</Label>
            <Input
              id="make"
              placeholder="e.g., BMW"
              className={`border ${errors.make ? 'border-primary' : 'border-gray-200'}`}
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
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
              onChange={(e) => handleInputChange('model', e.target.value)}
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
              max={new Date().getFullYear()}
              placeholder="e.g., 2020"
              className={`border ${errors.year ? 'border-primary' : 'border-gray-200'}`}
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
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
              onChange={(e) => handleInputChange('mileage', e.target.value)}
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
              onValueChange={(value) => handleInputChange('transmission', value)}
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-white text-body hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary text-white hover:bg-primary/90"
            >
              Get Valuation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};