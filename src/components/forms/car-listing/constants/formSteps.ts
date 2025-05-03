
/**
 * Form steps configuration
 * Created: 2025-07-18
 * 
 * Defines the steps and sections for the car listing form
 */

import React from 'react';
import { FormStep } from '../types';
import { VehicleDetailsSection } from '../sections/VehicleDetailsSection';
import { PricingSection } from '../sections/PricingSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PhotoUploadSection } from '../sections/PhotoUploadSection';
import { DamagePhotosSection } from '../sections/DamagePhotosSection';
import { SellerNotesSection } from '../sections/SellerNotesSection';
import { SellerDetailsSection } from '../sections/SellerDetailsSection';

// Define form steps with components and sections
export const formSteps: FormStep[] = [
  {
    id: 'vehicle-details',
    title: 'Vehicle Details',
    description: 'Enter basic information about your vehicle',
    sections: ['make', 'model', 'year', 'mileage', 'vin', 'transmission'],
    component: React.createElement(VehicleDetailsSection)
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set your asking price and reserve price',
    sections: ['price', 'reserve_price'],
    component: React.createElement(PricingSection)
  },
  {
    id: 'features',
    title: 'Vehicle Features',
    description: 'Select features your vehicle has',
    sections: ['features'],
    component: React.createElement(FeaturesSection)
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'Upload photos of your vehicle',
    sections: ['uploadedPhotos', 'vehiclePhotos'],
    component: React.createElement(PhotoUploadSection)
  },
  {
    id: 'damage',
    title: 'Damage Reports',
    description: 'Report any damage to the vehicle',
    sections: ['isDamaged', 'damageReports'],
    component: React.createElement(DamagePhotosSection)
  },
  {
    id: 'seller-notes',
    title: 'Seller Notes',
    description: 'Add any additional information for buyers',
    sections: ['sellerNotes'],
    component: React.createElement(SellerNotesSection)
  },
  {
    id: 'seller-details',
    title: 'Seller Details',
    description: 'Your contact information',
    sections: ['name', 'mobileNumber', 'address'],
    component: React.createElement(SellerDetailsSection)
  }
];
