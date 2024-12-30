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

export const requiredPhotos = [
  { id: 'driver_side_front', label: "Driver's Side Front" },
  { id: 'front', label: 'Front of Car' },
  { id: 'passenger_side_front', label: 'Passenger Side Front' },
  { id: 'front_seats', label: 'Front Seats' },
  { id: 'back_seats', label: 'Back Seats' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'back', label: 'Back of Car' },
  { id: 'driver_side', label: "Driver's Side" },
  { id: 'passenger_side', label: 'Passenger Side' },
];