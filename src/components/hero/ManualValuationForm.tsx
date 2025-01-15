import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { FormFields } from "./manual-valuation/FormFields";
import { FormActions } from "./manual-valuation/FormActions";
import { useFormValidation } from "./manual-valuation/useFormValidation";

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

  const { errors, validateForm, setErrors } = useFormValidation();

  const handleInputChange = (field: keyof ManualValuationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Manual form submission:', formData);
    
    if (validateForm(formData)) {
      console.log('Form validation passed, submitting:', formData);
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