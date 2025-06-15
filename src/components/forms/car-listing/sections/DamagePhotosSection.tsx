
/**
 * Component for uploading damage photos
 * Created: 2025-07-18
 * Updated: 2025-06-15 - Fix TypeError by using useFormData(), null-safe form context, defensive rendering
 * Updated: 2025-06-15 - Fix DamageReport TS2322: only use allowed type, remove carId property
 * Updated: 2025-06-16 - Simplified: Remove location and description inputs, allow photo upload only
 */
import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFormData } from '../context/FormDataContext';
import { uploadPhoto } from '../photo-upload/services/photoStorageService';

interface DamagePhoto {
  id: string;
  url: string;
}

export const DamagePhotosSection = () => {
  // Use our custom hook to guarantee form context (prevents nulls)
  let form: ReturnType<typeof useFormData>['form'] | null = null;
  let formError = null;
  try {
    ({ form } = useFormData());
  } catch (e) {
    formError = e;
    console.error("DamagePhotosSection: No form context found!", e);
  }

  if (!form) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Damage Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            Unable to load damage photo uploader because form context was not found.
            Please return to the previous step or refresh the page.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const carId = form.watch('id');
  const [isUploading, setIsUploading] = useState(false);
  const [damagePhotos, setDamagePhotos] = useState<DamagePhoto[]>([]);

  const handleUploadDamagePhoto = async (file: File) => {
    if (!carId) {
      console.error('Car ID is required for damage photo upload');
      return;
    }
    try {
      setIsUploading(true);
      const category = `damage_${Date.now()}`;
      const photoUrl = await uploadPhoto(file, carId, category);

      if (photoUrl) {
        // Create new damage photo object for UI gallery
        const newDamagePhoto: DamagePhoto = {
          id: `damage_${Date.now()}`,
          url: photoUrl,
        };
        setDamagePhotos(prev => [...prev, newDamagePhoto]);

        // Compose a minimal DamageReport object for backend/DB compatibility
        // Use default values for description/location
        const damageReports = form.getValues('damageReports') || [];
        form.setValue(
          'damageReports',
          [
            ...damageReports,
            {
              id: newDamagePhoto.id,
              photo: photoUrl,
              description: "No description provided",
              location: "Unspecified",
              type: 'other',
              severity: 'minor'
            }
          ],
          { shouldDirty: true }
        );
      }
    } catch (error) {
      console.error('Error uploading damage photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeDamagePhoto = (id: string) => {
    setDamagePhotos(prev => prev.filter(photo => photo.id !== id));
    const damageReports = form.getValues('damageReports') || [];
    const updatedReports = damageReports.filter((report: any) => report.id !== id);
    form.setValue('damageReports', updatedReports, { shouldDirty: true });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Damage Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="damage-photo" className="block font-medium mb-2">
            Upload photos showing any damage on your car:
          </label>
          <div className="mt-2">
            <input
              type="file"
              id="damage-photo"
              className="hidden"
              accept="image/*"
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadDamagePhoto(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              asChild
            >
              <label htmlFor="damage-photo" className="flex items-center gap-2 cursor-pointer">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Upload Damage Photo
              </label>
            </Button>
          </div>
        </div>
        {/* Damage photo gallery */}
        {damagePhotos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Added Damage Photos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {damagePhotos.map(photo => (
                <div key={photo.id} className="relative border rounded-md overflow-hidden group">
                  <img
                    src={photo.url}
                    alt="Damage Photo"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute bottom-2 right-2"
                      onClick={() => removeDamagePhoto(photo.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
