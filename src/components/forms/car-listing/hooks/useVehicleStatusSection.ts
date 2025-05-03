
/**
 * Vehicle Status Hook
 * Created: 2025-06-14
 * Updated: 2025-07-27 - Fixed boolean type conversion for form inputs
 */
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { CarListingFormData } from '@/types/forms';

export function useVehicleStatusSection() {
  const { watch, setValue } = useFormContext<CarListingFormData>();
  
  // Watch all boolean status fields
  const isDamaged = watch('isDamaged') || false;
  const hasWarningLights = watch('hasWarningLights') || false;
  const hasFinance = watch('hasOutstandingFinance') || false;
  const hasPrivatePlate = watch('hasPrivatePlate') || false;
  const hasServiceHistory = watch('hasServiceHistory') || false;
  
  // Status displays
  const [showDamageOptions, setShowDamageOptions] = useState(isDamaged);
  const [showWarningLightOptions, setShowWarningLightOptions] = useState(hasWarningLights);
  const [showFinanceOptions, setShowFinanceOptions] = useState(hasFinance);
  const [showPlateOptions, setShowPlateOptions] = useState(hasPrivatePlate);
  const [showServiceHistoryOptions, setShowServiceHistoryOptions] = useState(hasServiceHistory);

  // Update damage status
  const handleDamageChange = (isChecked: boolean) => {
    setValue('isDamaged', isChecked);
    setShowDamageOptions(isChecked);
    
    // If no damage, clear damage reports
    if (!isChecked) {
      setValue('damageReports', []);
    }
  };
  
  // Update warning lights status
  const handleWarningLightsChange = (isChecked: boolean) => {
    setValue('hasWarningLights', isChecked);
    setShowWarningLightOptions(isChecked);
    
    // If no warning lights, clear warning light photos
    if (!isChecked) {
      setValue('warningLightPhotos', []);
      setValue('warningLightDescription', '');
    }
  };
  
  // Update finance status
  const handleFinanceChange = (isChecked: boolean) => {
    setValue('hasOutstandingFinance', isChecked);
    setShowFinanceOptions(isChecked);
    
    // If no finance, clear finance details
    if (!isChecked) {
      setValue('financeAmount', undefined);
      setValue('financeProvider', '');
      setValue('financeEndDate', '');
    }
  };
  
  // Update private plate status
  const handlePrivatePlateChange = (isChecked: boolean) => {
    setValue('hasPrivatePlate', isChecked);
    setShowPlateOptions(isChecked);
  };
  
  // Update service history status
  const handleServiceHistoryChange = (isChecked: boolean) => {
    setValue('hasServiceHistory', isChecked);
    setShowServiceHistoryOptions(isChecked);
    
    // If no service history, clear service history type
    if (!isChecked) {
      setValue('serviceHistoryType', 'none');
      setValue('serviceHistoryFiles', []);
    }
  };
  
  return {
    isDamaged,
    hasWarningLights,
    hasFinance,
    hasPrivatePlate,
    hasServiceHistory,
    showDamageOptions,
    showWarningLightOptions,
    showFinanceOptions,
    showPlateOptions,
    showServiceHistoryOptions,
    handleDamageChange,
    handleWarningLightsChange,
    handleFinanceChange,
    handlePrivatePlateChange,
    handleServiceHistoryChange
  };
}
