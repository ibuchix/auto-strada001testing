
/**
 * Form Steps Constants
 * Created: 2025-05-03
 * Updated: 2025-06-15 - Added sections property to each step
 * Updated: 2025-06-16 - Fixed export interface for StepItem
 * 
 * Configuration for multi-step form
 */

import { StepItem } from "@/types/forms";

export const formSteps: StepItem[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter the basic details about your vehicle',
    sections: ['car-details', 'price', 'description']
  },
  {
    id: 'condition',
    title: 'Vehicle Condition',
    description: 'Tell us about the condition of your vehicle',
    sections: ['condition', 'damage', 'service-history']
  },
  {
    id: 'photos',
    title: 'Photos & Documents',
    description: 'Upload photos and documents for your vehicle',
    sections: ['photos', 'rim-photos', 'damage-photos', 'documents']
  }
];

export const SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
