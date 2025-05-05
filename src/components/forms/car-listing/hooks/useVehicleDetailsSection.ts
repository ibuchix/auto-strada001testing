
/**
 * Hook for vehicle details section of the car listing form
 * Created: 2025-05-04 - Added VIN reservation integration to the vehicle details section
 * Updated: 2025-05-05 - Enhanced auto-fill feature to ensure VIN reservation creation
 */

import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { reserveVin } from '@/services/vinReservationService';
import { supabase } from '@/integrations/supabase/client';
import { getVehicleValuation } from '@/services/api/valuationService';

// Generate years from 1990 to current year
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year);
  }
  return years;
};

export const useVehicleDetailsSection = (form: UseFormReturn<any>) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const yearOptions = generateYears();
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);

  // Update models when make changes
  const selectedMake = form.watch('make');

  useEffect(() => {
    // Example model mapping - this could be expanded or fetched from an API
    const modelMap: Record<string, string[]> = {
      'BMW': ['X1', 'X3', 'X5', '3 Series', '5 Series', '7 Series'],
      'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
      'Mercedes': ['A Class', 'C Class', 'E Class', 'GLA', 'GLC', 'GLE'],
      'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'T-Roc', 'Touareg'],
      'Ford': ['Focus', 'Fiesta', 'Mustang', 'Kuga', 'Puma', 'Explorer'],
      'Toyota': ['Corolla', 'Camry', 'RAV4', 'Prius', 'Yaris', 'Highlander'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'Pilot'],
      'Nissan': ['Qashqai', 'Juke', 'X-Trail', 'Micra', 'Leaf', 'Navara'],
      'Mazda': ['CX-3', 'CX-5', 'CX-30', 'Mazda3', 'Mazda6', 'MX-5'],
      'Kia': ['Sportage', 'Ceed', 'Rio', 'Niro', 'Picanto', 'Sorento'],
      'Hyundai': ['Tucson', 'i30', 'i20', 'Kona', 'Santa Fe', 'IONIQ']
    };

    if (selectedMake && modelMap[selectedMake]) {
      setAvailableModels(modelMap[selectedMake]);
    } else {
      setAvailableModels([]);
    }
  }, [selectedMake]);

  // Check for existing VIN reservation on component mount
  useEffect(() => {
    const checkVinReservation = async () => {
      // If there's already a VIN reservation ID in localStorage, we're good
      if (localStorage.getItem('vinReservationId')) {
        console.log('VIN reservation already exists in localStorage');
        return;
      }
      
      // If we have a VIN in the form, try to create a reservation for it
      const formVin = form.getValues('vin');
      const tempVIN = localStorage.getItem('tempVIN');
      
      if (formVin || tempVIN) {
        const vin = formVin || tempVIN;
        console.log('Found VIN to reserve:', vin);
        
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            // Try to get stored valuation data
            const valuationData = localStorage.getItem('valuationData');
            let parsedValuationData = null;
            
            if (valuationData) {
              try {
                parsedValuationData = JSON.parse(valuationData);
              } catch (e) {
                console.error('Failed to parse valuation data:', e);
              }
            }
            
            console.log('Creating VIN reservation for:', vin);
            const reservationResult = await reserveVin(vin, userId, parsedValuationData);
            
            if (reservationResult.success && reservationResult.data?.reservationId) {
              localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
              console.log('VIN reservation created successfully:', reservationResult.data);
            } else {
              console.warn('VIN reservation creation failed:', reservationResult.error);
            }
          } catch (error) {
            console.error('Error creating VIN reservation:', error);
          }
        }
      }
    };
    
    checkVinReservation();
  }, [form]);

  // VIN lookup handler that also reserves the VIN
  const handleVinLookup = useCallback(async (vin: string) => {
    if (!vin || vin.length !== 17) {
      toast.error('Invalid VIN', {
        description: 'Please enter a valid 17-character VIN'
      });
      return;
    }

    try {
      // Get the current mileage value from the form
      const mileage = form.getValues('mileage') || 0;
      const gearbox = form.getValues('transmission') || 'manual';
      
      // Get valuation data for the VIN
      console.log('Fetching valuation data for VIN:', vin);
      const valuationResult = await getVehicleValuation(vin, mileage.toString(), gearbox);
      
      if (!valuationResult.success || !valuationResult.data) {
        toast.error('VIN lookup failed', {
          description: valuationResult.error?.message || 'Could not get vehicle data for this VIN'
        });
        return;
      }
      
      // Extract vehicle data from valuation
      const valuationData = valuationResult.data;
      
      // Try to auto-fill form with valuation data
      if (valuationData.make) form.setValue('make', valuationData.make);
      if (valuationData.model) form.setValue('model', valuationData.model);
      if (valuationData.year) form.setValue('year', parseInt(valuationData.year));
      form.setValue('vin', vin); // Always set the VIN
      
      // Store the valuation data in localStorage
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', vin);
      
      // Try to reserve the VIN
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        setIsCreatingReservation(true);
        console.log('Reserving VIN:', vin);
        
        try {
          const reservationResult = await reserveVin(vin, userId, valuationData);
          
          if (reservationResult.success && reservationResult.data?.reservationId) {
            localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
            console.log('VIN reserved successfully:', reservationResult.data);
            
            toast.success('VIN validated and reserved', {
              description: 'Vehicle details have been applied to the form'
            });
          } else {
            console.error('Failed to reserve VIN:', reservationResult.error);
            
            toast.error('VIN reservation failed', {
              description: reservationResult.error || 'Unable to reserve this VIN'
            });
          }
        } catch (error) {
          console.error('Error reserving VIN:', error);
          toast.error('VIN reservation error', {
            description: 'An error occurred while reserving this VIN'
          });
        } finally {
          setIsCreatingReservation(false);
        }
      } else {
        toast.error('User authentication required', {
          description: 'Please log in to reserve a VIN'
        });
      }
    } catch (error) {
      console.error('Error during VIN lookup:', error);
      toast.error('VIN lookup error', {
        description: 'An error occurred while processing your request'
      });
    }
  }, [form]);

  // Handler for auto-fill button
  const handleAutoFill = useCallback(async () => {
    const storedData = localStorage.getItem('valuationData');
    
    if (!storedData) {
      console.log('No valuation data found in localStorage');
      return false;
    }
    
    try {
      const valuationData = JSON.parse(storedData);
      console.log('Auto-filling from stored valuation data:', valuationData);
      
      // Fill in form fields from valuation data
      if (valuationData.make) form.setValue('make', valuationData.make);
      if (valuationData.model) form.setValue('model', valuationData.model);
      if (valuationData.year) form.setValue('year', parseInt(valuationData.year));
      if (valuationData.mileage) form.setValue('mileage', parseInt(valuationData.mileage));
      if (valuationData.vin) {
        form.setValue('vin', valuationData.vin);
        
        // Also try to reserve the VIN if not already reserved
        if (!localStorage.getItem('vinReservationId')) {
          const userId = localStorage.getItem('userId');
          
          if (userId) {
            setIsCreatingReservation(true);
            console.log('Auto-reserving VIN during auto-fill:', valuationData.vin);
            
            try {
              const reservationResult = await reserveVin(valuationData.vin, userId, valuationData);
              
              if (reservationResult.success && reservationResult.data?.reservationId) {
                localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
                console.log('VIN auto-reserved successfully:', reservationResult.data);
              } else {
                console.error('Failed to auto-reserve VIN:', reservationResult.error);
              }
            } catch (error) {
              console.error('Error auto-reserving VIN:', error);
            } finally {
              setIsCreatingReservation(false);
            }
          }
        }
      }
      if (valuationData.transmission) form.setValue('transmission', valuationData.transmission);
      
      return true;
    } catch (error) {
      console.error('Error auto-filling form:', error);
      return false;
    }
  }, [form]);

  return {
    availableModels,
    yearOptions,
    handleVinLookup,
    handleAutoFill,
    isCreatingReservation
  };
};
