import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export interface PhotoUploadSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export interface CarPhotoData {
  required_photos: Record<string, string | null>;
  additional_photos: string[];
}

export interface PhotoUploadProps {
  id: string;
  label: string;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

// Complete set of required photos with detailed guidelines
export const requiredPhotos = [
  { 
    id: 'front', 
    label: 'Front of Car',
    guideline: 'Take photo from straight ahead, showing the entire front of the vehicle including license plate',
    example: '/car-examples/front.jpg'
  },
  { 
    id: 'driver_side', 
    label: "Driver's Side",
    guideline: 'Capture the full length of the vehicle from the driver\'s side, showing all doors and wheels',
    example: '/car-examples/driver-side.jpg'
  },
  { 
    id: 'driver_side_front', 
    label: "Driver's Side Front Quarter",
    guideline: 'Take photo at a 45-degree angle showing front and driver\'s side',
    example: '/car-examples/driver-side-front.jpg'
  },
  { 
    id: 'passenger_side', 
    label: 'Passenger Side',
    guideline: 'Capture the full length of the vehicle from the passenger side, showing all doors and wheels',
    example: '/car-examples/passenger-side.jpg'
  },
  { 
    id: 'passenger_side_front', 
    label: 'Passenger Side Front Quarter',
    guideline: 'Take photo at a 45-degree angle showing front and passenger side',
    example: '/car-examples/passenger-side-front.jpg'
  },
  { 
    id: 'back', 
    label: 'Back of Car',
    guideline: 'Take photo from directly behind, showing the entire rear including license plate',
    example: '/car-examples/back.jpg'
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard',
    guideline: 'Show the entire dashboard including the instrument cluster and center console',
    example: '/car-examples/dashboard.jpg'
  },
  { 
    id: 'front_seats', 
    label: 'Front Seats',
    guideline: 'Capture both front seats showing upholstery condition and features',
    example: '/car-examples/front-seats.jpg'
  },
  { 
    id: 'back_seats', 
    label: 'Back Seats',
    guideline: 'Show the entire back seat area including floor and ceiling',
    example: '/car-examples/back-seats.jpg'
  }
];

export const photoQualityGuidelines = {
  minWidth: 1920,
  minHeight: 1080,
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  tips: [
    'Ensure good lighting - avoid dark or overexposed photos',
    'Keep the camera steady to avoid blur',
    'Make sure the entire vehicle or area is in frame',
    'Avoid reflections and shadows where possible',
    'Take photos during daylight hours',
    'Clean the vehicle before taking photos',
    'Remove distracting objects from the background',
    'Ensure the camera lens is clean'
  ]
};