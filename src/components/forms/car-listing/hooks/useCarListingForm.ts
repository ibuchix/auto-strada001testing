/**
 * Hook for managing car listing form state and submission
 * 
 * Changes made:
 * - 2024-10-25: Fixed form submission handler to use correct parameter count
 * - 2024-12-05: Fixed type instantiation issue in form submission
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { carListingSchema } from '../validation/carListingSchema';
import { useUploadPhotos } from './useUploadPhotos';
import { submitCarListing } from '../submission/services/submissionService';
import { useAuth } from '@/hooks/useAuth';
import { useTransaction } from '@/hooks/useTransaction';
import { TransactionType } from '@/services/supabase/transactions/types';

// Define the form data type based on the zod schema
export type CarListingFormData = z.infer<typeof carListingSchema>;

export const useCarListingForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { uploadPhotos, isUploading, uploadProgress } = useUploadPhotos();
  
  const transaction = useTransaction({
    onSuccess: () => {
      toast.success('Car listing created successfully!');
      router.push('/dashboard/listings');
    },
    onError: (error) => {
      toast.error(`Failed to create listing: ${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<CarListingFormData>({
    resolver: zodResolver(carListingSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
      exteriorColor: '',
      interiorColor: '',
      transmission: 'automatic',
      fuelType: 'petrol',
      bodyType: 'sedan',
      description: '',
      features: {
        airConditioning: false,
        leatherSeats: false,
        sunroof: false,
        navigation: false,
        bluetooth: false,
        cruiseControl: false,
        parkingSensors: false,
        heatedSeats: false,
        backupCamera: false
      },
      price: 0,
      location: '',
      vin: '',
      photos: []
    }
  });

  // Handle form submission
  const onSubmit = useCallback(async (data: CarListingFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a listing');
      return;
    }

    setIsSubmitting(true);

    try {
      // First upload photos if any
      let photoUrls: string[] = [];
      
      if (data.photos && data.photos.length > 0) {
        photoUrls = await uploadPhotos(data.photos);
      }

      // Execute the transaction
      await transaction.executeTransaction(
        'Create Car Listing',
        TransactionType.CREATE,
        async () => {
          const result = await submitCarListing({
            ...data,
            photos: photoUrls,
            sellerId: user.id
          });

          if (!result.success) {
            throw new Error(result.errorMessage || 'Failed to create listing');
          }

          return result;
        }
      );
    } catch (error: any) {
      console.error('Error submitting car listing:', error);
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, uploadPhotos, transaction]);

  // Handle form errors
  const onError = useCallback((errors: any) => {
    console.error('Form validation errors:', errors);
    toast.error('Please fix the errors in the form before submitting');
  }, []);

  // Navigate between form steps
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 3)));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return {
    form,
    isSubmitting,
    isUploading,
    uploadProgress,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    transaction
  };
};

export default useCarListingForm;
