/**
 * Changes made:
 * - 2024-10-25: Updated formData.features to use defaultCarFeatures to ensure all required properties
 */

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { CarListingFormData, defaultCarFeatures } from '@/types/forms';
import { useFormPersistence } from './useFormPersistence';
import { useFormAutoSave } from './useFormAutoSave';
import { useLoadDraft } from './useLoadDraft';
import { useSectionsVisibility } from './useSectionsVisibility';
import { useFormDefaults } from './useFormDefaults';
import { useSupabaseErrorHandling } from '@/hooks/useSupabaseErrorHandling';

export function useCarListingForm() {
  const [formData, setFormData] = useState<CarListingFormData>({
    vin: '',
    make: '',
    model: '',
    year: 0,
    registrationNumber: '',
    mileage: 0,
    engineCapacity: 0,
    transmission: '',
    bodyType: '',
    exteriorColor: '',
    interiorColor: '',
    numberOfDoors: '',
    seatMaterial: '',
    numberOfKeys: '',
    price: '',
    location: '',
    description: '',
    name: '',
    address: '',
    mobileNumber: '',
    contactEmail: '',
    notes: '',
    previousOwners: 0,
    accidentHistory: '',
    isDamaged: false,
    isRegisteredInPoland: true,
    isSellingOnBehalf: false,
    hasPrivatePlate: false,
    financeAmount: '',
    serviceHistoryType: '',
    sellerNotes: '',
    conditionRating: 0,
    features: defaultCarFeatures,
    uploadedPhotos: [],
    additionalPhotos: [],
    requiredPhotos: {
      front: null,
      rear: null,
      interior: null,
      engine: null,
    },
    rimPhotos: {
      front_left: null,
      front_right: null,
      rear_left: null,
      rear_right: null,
    },
    warningLightPhotos: [],
    rimPhotosComplete: false,
    financeDocument: null,
    serviceHistoryFiles: [],
    damageReports: [],
  });

  const { setError } = useSupabaseErrorHandling();
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [isSectionsVisible, setIsSectionsVisible] = useState({
    vehicleDetails: true,
    specifications: false,
    additionalInfo: false,
    sellerDetails: false,
    mediaUpload: false,
    damageReport: false,
    reviewAndSubmit: false,
  });

  const form = useForm<CarListingFormData>({
    defaultValues: {
      vin: '',
      make: '',
      model: '',
      year: 0,
      registrationNumber: '',
      mileage: 0,
      engineCapacity: 0,
      transmission: '',
      bodyType: '',
      exteriorColor: '',
      interiorColor: '',
      numberOfDoors: '',
      seatMaterial: '',
      numberOfKeys: '',
      price: '',
      location: '',
      description: '',
      name: '',
      address: '',
      mobileNumber: '',
      contactEmail: '',
      notes: '',
      previousOwners: 0,
      accidentHistory: '',
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: '',
      serviceHistoryType: '',
      sellerNotes: '',
      conditionRating: 0,
      features: defaultCarFeatures,
      uploadedPhotos: [],
      additionalPhotos: [],
      requiredPhotos: {
        front: null,
        rear: null,
        interior: null,
        engine: null,
      },
      rimPhotos: {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null,
      },
      warningLightPhotos: [],
      rimPhotosComplete: false,
      financeDocument: null,
      serviceHistoryFiles: [],
      damageReports: [],
    }
  });

  const { loadDraft, loading: loadingDraft } = useLoadDraft(form);
  const { setFormDefaults } = useFormDefaults(form);
  const { saveForm, clearForm } = useFormPersistence(form, 'carListingForm');
  const { autoSave } = useFormAutoSave(form, 30000);
  const { setSectionsVisibility, nextSection, prevSection } = useSectionsVisibility(setIsSectionsVisible);

  useEffect(() => {
    const fetchData = async () => {
      setIsDraftLoading(true);
      try {
        await loadDraft();
      } catch (e: any) {
        setError('draft_load_error', e.message);
      } finally {
        setIsDraftLoading(false);
      }
    };

    fetchData();
  }, [loadDraft, setError]);

  useEffect(() => {
    if (!isDraftLoading) {
      setFormDefaults();
      autoSave();
    }
  }, [isDraftLoading, setFormDefaults, autoSave]);

  // Handle form data updates with proper typing
  const updateFormData = (partialData: Partial<CarListingFormData>) => {
    // Ensure features object is complete with all required properties
    if (partialData.features) {
      partialData.features = {
        ...defaultCarFeatures,
        ...partialData.features
      };
    }
    
    setFormData(prev => ({
      ...prev,
      ...partialData
    }));
  };

  const resetForm = () => {
    form.reset();
    clearForm();
    setFormData({
      vin: '',
      make: '',
      model: '',
      year: 0,
      registrationNumber: '',
      mileage: 0,
      engineCapacity: 0,
      transmission: '',
      bodyType: '',
      exteriorColor: '',
      interiorColor: '',
      numberOfDoors: '',
      seatMaterial: '',
      numberOfKeys: '',
      price: '',
      location: '',
      description: '',
      name: '',
      address: '',
      mobileNumber: '',
      contactEmail: '',
      notes: '',
      previousOwners: 0,
      accidentHistory: '',
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: '',
      serviceHistoryType: '',
      sellerNotes: '',
      conditionRating: 0,
      features: defaultCarFeatures,
      uploadedPhotos: [],
      additionalPhotos: [],
      requiredPhotos: {
        front: null,
        rear: null,
        interior: null,
        engine: null,
      },
      rimPhotos: {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null,
      },
      warningLightPhotos: [],
      rimPhotosComplete: false,
      financeDocument: null,
      serviceHistoryFiles: [],
      damageReports: [],
    });
  };

  return {
    form,
    formData,
    updateFormData,
    resetForm,
    saveForm,
    isSectionsVisible,
    setSectionsVisibility,
    nextSection,
    prevSection,
    loadingDraft,
  };
}
