
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export interface PhotoUploadSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  diagnosticId?: string; // Added for tracking uploads
}

export interface CarPhotoData {
  required_photos: Record<string, string | null>;
  additional_photos: string[];
}

export interface PhotoUploadProps {
  id: string;
  // Support both title/description and label for backwards compatibility
  title?: string;
  description?: string;
  label?: string;
  isUploading: boolean;
  isUploaded?: boolean;
  progress?: number;
  onFileSelect?: (file: File) => void;
  onUpload?: (file: File) => Promise<string | null>; // Updated return type
  disabled?: boolean;
  isRequired?: boolean;
  diagnosticId?: string;
}

export const requiredPhotos = [
  // Exterior photos
  { id: 'driver_side_front', label: "Driver's Side Front", category: 'exterior' },
  { id: 'front', label: 'Front of Car', category: 'exterior' },
  { id: 'passenger_side_front', label: 'Passenger Side Front', category: 'exterior' },
  { id: 'driver_side', label: "Driver's Side", category: 'exterior' },
  { id: 'back', label: 'Back of Car', category: 'exterior' },
  { id: 'passenger_side', label: 'Passenger Side', category: 'exterior' },
  
  // Interior photos
  { id: 'front_seats', label: 'Front Seats', category: 'interior' },
  { id: 'back_seats', label: 'Back Seats', category: 'interior' },
  { id: 'dashboard', label: 'Dashboard', category: 'interior' },
  { id: 'center_console', label: 'Center Console', category: 'interior' },
  
  // Details
  { id: 'odometer', label: 'Odometer Reading', category: 'details' },
  { id: 'engine', label: 'Engine Bay', category: 'details' }
];
