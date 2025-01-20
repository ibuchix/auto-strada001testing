import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { FormFields } from "./manual-valuation/FormFields";
import { FormActions } from "./manual-valuation/FormActions";
import { useFormValidation } from "./manual-valuation/useFormValidation";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];
type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];

export interface ManualValuationData {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: TransmissionType;
  fuel: FuelType;
  country: CountryCode;
  capacity?: string;
}

interface ManualValuationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualValuationData) => void;
  mileage?: string;
  transmission?: TransmissionType;
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
    transmission: transmission,
    fuel: 'petrol',
    country: 'PL',
    capacity: ''
  });

  const { errors, validateForm, setErrors } = useFormValidation();

  const handleInputChange = (field: keyof ManualValuationData, value: string) => {
    console.log('Handling input change:', { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data before submission:', formData);
    
    if (validateForm(formData)) {
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
          <DialogDescription className="text-center text-subtitle">
            Please provide your vehicle details for an accurate valuation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormFields 
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
          <FormActions onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
};