import { useState } from "react";
import { ManualValuationData } from "../ManualValuationForm";
import { toast } from "sonner";

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Partial<ManualValuationData>>({});

  const validateForm = (formData: ManualValuationData) => {
    const newErrors: Partial<ManualValuationData> = {};
    const currentYear = new Date().getFullYear();
    
    if (!formData.make.trim()) {
      newErrors.make = "Make is required";
    } else if (formData.make.length < 2) {
      newErrors.make = "Make must be at least 2 characters";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    } else if (formData.model.length < 2) {
      newErrors.model = "Model must be at least 2 characters";
    }

    const yearNum = parseInt(formData.year);
    if (!formData.year.trim()) {
      newErrors.year = "Year is required";
    } else if (yearNum < 1900 || yearNum > currentYear) {
      newErrors.year = `Year must be between 1900 and ${currentYear}`;
    }

    const mileageNum = parseInt(formData.mileage);
    if (!formData.mileage.trim()) {
      newErrors.mileage = "Mileage is required";
    } else if (isNaN(mileageNum) || mileageNum < 0 || mileageNum > 999999) {
      newErrors.mileage = "Please enter a valid mileage between 0 and 999,999";
    }

    if (!formData.transmission) {
      newErrors.transmission = "Transmission type is required";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please correct the errors in the form");
      return false;
    }
    
    return true;
  };

  return { errors, validateForm, setErrors };
};