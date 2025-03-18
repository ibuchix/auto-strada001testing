
/**
 * Changes made:
 * - 2024-08-08: Created form steps configuration for multi-step form
 */

export const formSteps = [
  {
    id: 'personal-details',
    title: 'Personal Details',
    sections: ['personal-details']
  },
  {
    id: 'vehicle-status',
    title: 'Vehicle Status',
    sections: ['vehicle-status', 'damage', 'rims', 'warning-lights']
  },
  {
    id: 'features',
    title: 'Vehicle Features',
    sections: ['features', 'service-history']
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    sections: ['additional-info']
  },
  {
    id: 'photos',
    title: 'Vehicle Photos',
    sections: ['photos']
  },
  {
    id: 'notes',
    title: 'Seller Notes',
    sections: ['seller-notes']
  }
];
