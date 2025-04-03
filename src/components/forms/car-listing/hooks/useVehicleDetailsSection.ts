
/**
 * Changes made:
 * - Updated to work with both direct form usage and form context
 */

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const useVehicleDetailsSection = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  
  // Watch make field to update models when it changes
  const make = form.watch("make");
  
  // Generate year options (current year down to 1970)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);
    setYearOptions(years);
  }, []);
  
  // Update available models when make changes
  useEffect(() => {
    if (!make) {
      setAvailableModels([]);
      return;
    }
    
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        // This would normally fetch from an API
        // For now we'll use a mock based on make
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
        
        // Mock model data
        const mockModels: Record<string, string[]> = {
          'BMW': ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5'],
          'Audi': ['A1', 'A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
          'Mercedes': ['A Class', 'C Class', 'E Class', 'S Class', 'GLA', 'GLC', 'GLE'],
          'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'ID.3', 'ID.4'],
          'Ford': ['Fiesta', 'Focus', 'Kuga', 'Puma', 'Mondeo', 'Mustang', 'EcoSport'],
          'Toyota': ['Yaris', 'Corolla', 'RAV4', 'C-HR', 'Prius', 'Camry', 'Land Cruiser'],
          'Honda': ['Civic', 'Jazz', 'CR-V', 'HR-V', 'Accord', 'NSX', 'e'],
        };
        
        setAvailableModels(mockModels[make] || []);
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error('Failed to load models for selected make');
        setAvailableModels([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModels();
  }, [make]);
  
  // Handle VIN lookup
  const handleVinLookup = async (vin: string) => {
    if (!vin || vin.length < 17) {
      toast.error('Please enter a valid 17-character VIN');
      return;
    }
    
    setIsLoading(true);
    try {
      // This would normally call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock successful lookup
      toast.success('VIN lookup successful!');
      
      // Here you would normally update form with fetched data
      // For example:
      form.setValue('make', 'Toyota');
      form.setValue('model', 'Corolla');
      form.setValue('year', 2022);
    } catch (error) {
      console.error('VIN lookup error:', error);
      toast.error('Failed to lookup VIN information');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate required fields for this section
  const validateVehicleDetails = () => {
    const { make, model, year, mileage } = form.getValues();
    const requiredFields = { make, model, year, mileage };
    
    let isValid = true;
    
    // Check each required field
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value) {
        form.setError(field as any, {
          type: 'required',
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        });
        isValid = false;
      }
    });
    
    if (!isValid) {
      toast.error('Please fill in all required vehicle details');
    }
    
    return isValid;
  };
  
  return {
    isLoading,
    availableModels,
    yearOptions,
    validateVehicleDetails,
    handleVinLookup
  };
};
