
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of damage photo upload
 * - 2024-03-19: Added file type validation and upload handling
 * - 2024-03-19: Implemented error notifications
 * - 2025-05-24: Improved bucket error handling and authentication validation
 * - 2025-05-24: Fixed TypeScript error with StorageError status property
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { DamageType } from "../types/damages";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DamagePhotoUploadProps {
  damageType: DamageType;
  carId?: string;
  onPhotoUploaded: (filePath: string) => void;
}

export const DamagePhotoUpload = ({ damageType, carId, onPhotoUploaded }: DamagePhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !carId) return;
    
    setIsUploading(true);
    
    try {
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error("Authentication required", {
          description: "Please sign in to upload photos"
        });
        return;
      }
      
      // Create direct upload using Supabase Storage API
      const uniqueId = crypto.randomUUID();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `cars/${carId}/damage_photos/${damageType}/${fileName}`;
      
      // Upload to the car-images bucket
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        // Handle specific error types - using message content instead of status code
        if (error.message?.includes('bucket') || error.message?.includes('404')) {
          throw new Error(`Storage bucket error: ${error.message || 'Bucket not found'}. Please ensure the car-images bucket exists.`);
        } else if (error.message?.includes('Permission denied') || error.message?.includes('403')) {
          throw new Error('You do not have permission to upload files. Please sign in again.');
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown storage error'}`);
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData?.publicUrl || '';
      
      toast.success("Photo uploaded successfully");
      onPhotoUploaded(publicUrl);
    } catch (error: any) {
      console.error('Error uploading damage photo:', error);
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>Photo</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
      />
      {isUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
    </div>
  );
};
