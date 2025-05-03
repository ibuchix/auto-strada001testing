
/**
 * Form steps definition
 * Updated: 2025-07-26 - Added pricing section to first step
 */

export const formSteps = [
  {
    id: 'basic-info',
    title: 'Vehicle Information',
    description: 'Let\'s start with the basic details of your vehicle',
    sections: ['car-details', 'pricing', 'features']
  },
  {
    id: 'condition',
    title: 'Vehicle Condition',
    description: 'Tell us about the condition of your vehicle',
    sections: ['condition', 'damage-details']
  },
  {
    id: 'photos',
    title: 'Vehicle Photos',
    description: 'Upload photos of your vehicle',
    sections: ['photos']
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    description: 'Provide more details about your vehicle',
    sections: ['additional-info', 'service-history', 'seller-notes']
  }
];
