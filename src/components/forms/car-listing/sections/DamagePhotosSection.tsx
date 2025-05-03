
/**
 * DamagePhotosSection
 * Updated: 2025-05-04 - Fixed TypeScript error with DamageReport ID field
 * Updated: 2025-08-24 - Added logging for damagePhotos array to help with debugging
 */

import { useFormData } from "../context/FormDataContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { DamageReport, DamageType } from "@/types/forms";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Get values from form
  const damageReports = form.watch("damageReports") || [];
  const damagePhotos = form.watch("damagePhotos") || [];
  
  // Log the damage photos when they change - helps with debugging
  useEffect(() => {
    console.log("DamagePhotosSection: Current damagePhotos array:", damagePhotos);
  }, [damagePhotos]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Create preview URL
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you'd upload the file to a server here
      const uploadedUrl = previewUrl; // Use preview URL as the "uploaded" URL
      
      // Add to damage photos - ensure we create a new array to trigger React updates
      const updatedDamagePhotos = [...(damagePhotos || []), uploadedUrl];
      form.setValue("damagePhotos", updatedDamagePhotos, { shouldDirty: true });
      console.log("Added photo to damagePhotos array:", uploadedUrl);
      
      // Create a damage report entry for this photo
      const newReport: DamageReport = {
        id: uuidv4(),
        type: "other" as DamageType,
        description: "Photo of damage",
        photo: uploadedUrl,
        location: "See photo",
        severity: "minor"
      };
      
      const updatedReports = [...damageReports, newReport];
      form.setValue("damageReports", updatedReports, { shouldDirty: true });
      
      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error uploading damage photo:", error);
    } finally {
      setUploading(false);
    }
  };
  
  // Remove a photo
  const removePhoto = (photoUrl: string) => {
    // Remove from damage photos
    const updatedDamagePhotos = (damagePhotos || []).filter(url => url !== photoUrl);
    form.setValue("damagePhotos", updatedDamagePhotos, { shouldDirty: true });
    console.log("Removed photo from damagePhotos array:", photoUrl);
    
    // Remove associated damage report
    const updatedReports = damageReports.filter(report => report.photo !== photoUrl);
    form.setValue("damageReports", updatedReports, { shouldDirty: true });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Damage Photos</h3>
      <p className="text-sm text-muted-foreground">
        Upload photos showing the damage to your vehicle
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload section */}
        <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <input
            type="file"
            accept="image/*"
            id="damage-photo-upload"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          {previewUrl ? (
            <div className="space-y-4 w-full">
              <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                <img 
                  src={previewUrl}
                  alt="Damage preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background rounded-full"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          ) : (
            <label
              htmlFor="damage-photo-upload"
              className="cursor-pointer flex flex-col items-center justify-center py-10 w-full"
            >
              <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload a photo</p>
              <p className="text-xs text-muted-foreground">JPG or PNG, max 10MB</p>
            </label>
          )}
        </div>
        
        {/* Photos gallery */}
        <div>
          {damagePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {damagePhotos.map((photo, index) => (
                <div key={index} className="relative bg-muted rounded-md overflow-hidden h-36">
                  <img 
                    src={photo}
                    alt={`Damage photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background rounded-full"
                    onClick={() => removePhoto(photo)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 border rounded-lg border-dashed">
              <div className="text-center">
                <ImageIcon className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No photos uploaded yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
