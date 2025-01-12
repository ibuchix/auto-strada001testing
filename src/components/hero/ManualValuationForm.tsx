import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface ManualValuationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualValuationData) => void;
  mileage?: string;
  transmission?: string;
}

export interface ManualValuationData {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
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
    
    if (!formData.make.trim()) newErrors.make = "Make is required";
    if (!formData.model.trim()) newErrors.model = "Model is required";
    if (!formData.year.trim()) newErrors.year = "Year is required";
    if (!formData.mileage.trim()) newErrors.mileage = "Mileage is required";
    if (!formData.transmission) newErrors.transmission = "Transmission is required";
    
    const yearNum = parseInt(formData.year);
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      newErrors.year = "Please enter a valid year";
    }

    const mileageNum = parseInt(formData.mileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      newErrors.mileage = "Please enter a valid mileage";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
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
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
              placeholder="e.g., 50000"
              className={`border ${errors.mileage ? 'border-primary' : 'border-gray-200'}`}
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
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
              onValueChange={(value) => setFormData({ ...formData, transmission: value })}
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