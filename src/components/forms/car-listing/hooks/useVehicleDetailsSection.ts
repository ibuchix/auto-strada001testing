
/**
 * Changes made:
 * - Fixed TypeScript errors with type assertions for year and mileage
 * - Enhanced handleVinLookup to utilize the validation API with standardized data storage
 * - Improved handleAutoFill to more accurately retrieve and map vehicle details
 * - Updated type safety throughout the component
 */

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  validateVin, 
  getStoredValidationData,
  VehicleData 
} from "@/services/supabase/valuation/vinValidationService";

export const useVehicleDetailsSection = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [storedVehicleData, setStoredVehicleData] = useState<VehicleData | null>(null);
  
  // Watch make field to update models when it changes
  const make = form.watch("make");
  
  // Generate year options (current year down to 1970)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);
    setYearOptions(years);
  }, []);
  
  // Load stored validation data if available
  useEffect(() => {
    const data = getStoredValidationData();
    if (data) {
      setStoredVehicleData(data);
      console.log('Loaded stored vehicle data:', data);
    }
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
      // Get the mileage value from the form if it exists
      const mileage = form.getValues('mileage') || 0;
      
      // Call the VIN validation service
      const response = await validateVin({
        vin,
        mileage
      });
      
      if (!response.success) {
        toast.error(response.error || 'VIN validation failed');
        return;
      }
      
      // Store locally for auto-fill operations
      if (response.data) {
        setStoredVehicleData(response.data);
        
        // Auto-fill form with fetched data
        if (response.data.make) form.setValue('make', response.data.make);
        if (response.data.model) form.setValue('model', response.data.model);
        if (response.data.year) form.setValue('year', typeof response.data.year === 'number' ? response.data.year : parseInt(String(response.data.year)));
        if (response.data.mileage) form.setValue('mileage', typeof response.data.mileage === 'number' ? response.data.mileage : parseInt(String(response.data.mileage)));
        if (response.data.vin) form.setValue('vin', response.data.vin);
        if (response.data.transmission) form.setValue('transmission', response.data.transmission);
        
        toast.success('VIN lookup successful!', {
          description: `Found: ${response.data.year} ${response.data.make} ${response.data.model}`
        });
      } else {
        toast.warning('VIN validation succeeded but no vehicle data was returned');
      }
    } catch (error) {
      console.error('VIN lookup error:', error);
      toast.error('Failed to lookup VIN information');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-fill form with stored vehicle data
  const handleAutoFill = () => {
    const data = getStoredValidationData();
    
    if (!data) {
      toast.error("No vehicle data found", {
        description: "Please complete a VIN check first to auto-fill details"
      });
      return;
    }
    
    try {
      console.log('Auto-filling with data:', data);
      
      // Fill in all available fields with proper type conversion
      if (data.make) form.setValue('make', data.make);
      if (data.model) form.setValue('model', data.model);
      
      // Handle year with proper type conversion
      if (data.year) {
        const yearValue = typeof data.year === 'number' 
          ? data.year 
          : parseInt(String(data.year));
        form.setValue('year', yearValue);
      }
      
      // Handle mileage with proper type conversion
      if (data.mileage) {
        const mileageValue = typeof data.mileage === 'number' 
          ? data.mileage 
          : parseInt(String(data.mileage));
        form.setValue('mileage', mileageValue);
      }
      
      if (data.vin) form.setValue('vin', data.vin);
      if (data.transmission) form.setValue('transmission', data.transmission);
      
      toast.success("Vehicle details auto-filled", {
        description: `Successfully populated data for ${data.year} ${data.make} ${data.model}`
      });
    } catch (error) {
      console.error('Error during auto-fill:', error);
      toast.error('Failed to auto-fill vehicle details', {
        description: 'Please try again or enter details manually'
      });
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
    handleVinLookup,
    handleAutoFill,
    storedVehicleData
  };
};
