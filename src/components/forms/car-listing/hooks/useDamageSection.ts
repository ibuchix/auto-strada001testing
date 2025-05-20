
/**
 * Damage Section Hook
 * Created: 2025-07-22
 * Updated: 2025-07-25 - Fixed DamageType import and photo field usage
 * Updated: 2025-05-20 - Updated property names to use snake_case to match database schema
 * Updated: 2025-05-22 - Fixed property access and field names to use consistent snake_case
 * 
 * Custom hook to handle damage section functionality
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData, DamageReport, DamageType } from "@/types/forms";

interface NewDamageState {
  type: DamageType;
  description: string;
  location?: string;
  severity?: 'minor' | 'moderate' | 'severe';
  photo?: string | null;
}

export const useDamageSection = (form: UseFormReturn<CarListingFormData>) => {
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [newDamage, setNewDamage] = useState<NewDamageState>({
    type: 'scratch',
    description: '',
    location: '',
    severity: 'minor',
    photo: null
  });

  // Watch for changes to is_damaged field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'is_damaged' || name === undefined) {
        setIsDamaged(!!value.is_damaged);
      }
    });
    
    // Initialize with current value
    setIsDamaged(!!form.getValues('is_damaged'));
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Watch for changes to damage_reports field
  useEffect(() => {
    const reports = form.getValues('damage_reports') || [];
    setDamageReports(reports);
  }, [form]);

  // Update damage report fields
  const updateNewDamage = useCallback((field: keyof NewDamageState, value: any) => {
    setNewDamage(prev => ({ ...prev, [field]: value }));
  }, []);

  // Add a new damage report
  const addDamageReport = useCallback(() => {
    if (!newDamage.description.trim()) return;

    const newReport: DamageReport = {
      id: `damage_${Date.now()}`,
      type: newDamage.type,
      description: newDamage.description,
      location: newDamage.location || '',
      severity: newDamage.severity || 'minor',
      photo: newDamage.photo || undefined
    };

    const updatedReports = [...damageReports, newReport];
    form.setValue('damage_reports', updatedReports, { shouldDirty: true, shouldTouch: true });
    setDamageReports(updatedReports);

    // Reset the new damage form
    setNewDamage({
      type: 'scratch',
      description: '',
      location: '',
      severity: 'minor',
      photo: null
    });
  }, [newDamage, damageReports, form]);

  // Remove a damage report
  const removeDamageReport = useCallback((index: number) => {
    const updatedReports = [...damageReports];
    updatedReports.splice(index, 1);
    form.setValue('damage_reports', updatedReports, { shouldDirty: true });
    setDamageReports(updatedReports);
  }, [damageReports, form]);

  // Handle photo upload for damage reports
  const handleDamagePhotoUpload = useCallback((fileUrl: string, index?: number) => {
    if (typeof index === 'number') {
      // Update existing damage report
      const updatedReports = [...damageReports];
      updatedReports[index] = {
        ...updatedReports[index],
        photo: fileUrl
      };
      form.setValue('damage_reports', updatedReports, { shouldDirty: true });
      setDamageReports(updatedReports);
    } else {
      // Update the new damage form
      setNewDamage(prev => ({
        ...prev,
        photo: fileUrl
      }));
    }
  }, [damageReports, form]);

  // Validate the damage section
  const validateDamageSection = useCallback((): boolean => {
    if (isDamaged && damageReports.length === 0) {
      form.setError('damage_reports', { 
        type: 'required', 
        message: 'Please add at least one damage report' 
      });
      return false;
    }
    return true;
  }, [isDamaged, damageReports, form]);

  return {
    isDamaged,
    damageReports,
    newDamage,
    updateNewDamage,
    addDamageReport,
    removeDamageReport,
    handleDamagePhotoUpload,
    validateDamageSection
  };
};
