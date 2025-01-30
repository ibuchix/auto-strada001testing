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

// Reduced number of required photos with clear guidelines
export const requiredPhotos = [
  { 
    id: 'front', 
    label: 'Front of Car',
    guideline: 'Take photo from straight ahead, showing the entire front of the vehicle'
  },
  { 
    id: 'driver_side', 
    label: "Driver's Side",
    guideline: 'Capture the full length of the vehicle from the driver\'s side'
  },
  { 
    id: 'passenger_side', 
    label: 'Passenger Side',
    guideline: 'Capture the full length of the vehicle from the passenger side'
  },
  { 
    id: 'back', 
    label: 'Back of Car',
    guideline: 'Take photo from directly behind, showing the entire rear of the vehicle'
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard',
    guideline: 'Show the entire dashboard including the instrument cluster'
  },
  { 
    id: 'interior', 
    label: 'Interior Overview',
    guideline: 'Capture both front and back seats in one shot if possible'
  }
];

export const photoQualityGuidelines = {
  minWidth: 1024,
  minHeight: 768,
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  tips: [
    'Ensure good lighting - avoid dark or overexposed photos',
    'Keep the camera steady to avoid blur',
    'Make sure the entire vehicle is in frame',
    'Avoid reflections and shadows where possible',
    'Take photos during daylight hours'
  ]
};