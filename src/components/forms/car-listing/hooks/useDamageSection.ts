
/**
 * Changes made:
 * - Created custom hook for Damage Section
 * - Encapsulated damage report management logic
 * - Implemented validation and state management
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData, DamageReport, DamageType } from "@/types/forms";
import { toast } from "sonner";

export const useDamageSection = (form: UseFormReturn<CarListingFormData>) => {
  const [newDamage, setNewDamage] = useState<DamageReport>({
    type: "scratch",
    description: "",
    photo: null,
  });
  
  const isDamaged = form.watch("isDamaged");
  const damageReports = form.watch("damageReports") || [];
  
  // Reset the new damage form
  const resetNewDamage = useCallback(() => {
    setNewDamage({
      type: "scratch",
      description: "",
      photo: null,
    });
  }, []);
  
  // Update new damage form
  const updateNewDamage = useCallback((field: keyof DamageReport, value: any) => {
    setNewDamage(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Add a new damage report
  const addDamageReport = useCallback(() => {
    if (!newDamage.description.trim()) {
      toast.error('Please provide a description of the damage');
      return;
    }
    
    const updatedReports = [...damageReports, { ...newDamage }];
    form.setValue("damageReports", updatedReports, { shouldValidate: true });
    
    // Reset new damage form
    resetNewDamage();
    
    toast.success('Damage report added');
  }, [newDamage, damageReports, form, resetNewDamage]);
  
  // Remove a damage report
  const removeDamageReport = useCallback((index: number) => {
    if (index >= 0 && index < damageReports.length) {
      const updatedReports = [...damageReports];
      updatedReports.splice(index, 1);
      form.setValue("damageReports", updatedReports, { shouldValidate: true });
      
      toast.success('Damage report removed');
    }
  }, [damageReports, form]);
  
  // Handle damage photo upload
  const handleDamagePhotoUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return null;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size exceeds 5MB limit');
        return null;
      }
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create object URL for preview
      const photoUrl = URL.createObjectURL(file);
      
      // Update new damage with photo
      setNewDamage(prev => ({
        ...prev,
        photo: photoUrl
      }));
      
      toast.success('Damage photo uploaded');
      return photoUrl;
    } catch (error) {
      console.error('Error uploading damage photo:', error);
      toast.error('Failed to upload damage photo');
      return null;
    }
  }, []);
  
  // Validate damage section
  const validateDamageSection = useCallback(() => {
    // If vehicle is damaged, require at least one damage report
    if (isDamaged && damageReports.length === 0) {
      toast.error('Please add at least one damage report');
      return false;
    }
    
    return true;
  }, [isDamaged, damageReports.length]);
  
  return {
    isDamaged,
    damageReports,
    newDamage,
    updateNewDamage,
    addDamageReport,
    removeDamageReport,
    handleDamagePhotoUpload,
    validateDamageSection,
    resetNewDamage
  };
};
