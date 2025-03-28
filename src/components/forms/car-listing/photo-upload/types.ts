
/**
 * TypeScript interfaces for photo upload components
 */

export interface PhotoUploadError {
  message: string;
  description?: string;
}

export interface AdditionalPhotosProps {
  isUploading: boolean;
  onPhotosSelected: (files: File[]) => Promise<void>;
  progress: number;
  error: PhotoUploadError | null;
}

export interface CurrentPhotosProps {
  photos: string[];
  onRemovePhoto?: (url: string) => void;
}

export interface PhotoUploadSectionProps {
  form: any; // Using any here as the form type may vary
  carId?: string;
  userId?: string;
  onValidate?: () => Promise<boolean>;
}
