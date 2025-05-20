
/**
 * Types for RimPhotos components
 * Created: 2025-05-20
 */

export interface RimPosition {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export interface RimPhotoHandlers {
  handleFileUpload: (file: File, position: string) => Promise<string>;
  handlePhotoUploaded: (position: string) => void;
  handleUploadError: (position: string, errorMessage: string) => void;
  handleUploadRetry: (position: string) => void;
}

export interface RimPhotoState {
  uploadedPhotos: Record<string, boolean>;
  activeUploads: Record<string, boolean>;
  uploadErrors: Record<string, string>;
  uploadProgress: number;
}
