
/**
 * Component for uploading damage photos
 * Created: 2025-07-18
 * Updated: 2025-06-18 - Use temporary file upload (no carId needed); fix error for new listings;
 *   Remove custom damagePhotos state, depend fully on temp upload hook, and auto-sync to form.damageReports.
 */
import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFormData } from '../context/FormDataContext';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';

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

  // Use the temp uploader - damage can be multiple
  const tempUploader = useTemporaryFileUpload({
    category: 'damage',
    allowMultiple: true,
    maxFiles: 12,
    onUploadComplete: (files) => {
      // On every upload, sync files to the form as damageReports (if not already added)
      const prevReports = form.getValues('damageReports') || [];
      let changed = false;
      files.forEach(tempFile => {
        // Don't add if this file already exists as a report
        if (!prevReports.some((r: any) => r.photo === tempFile.url)) {
          prevReports.push({
            id: tempFile.id, // Use temp file id
            photo: tempFile.url || tempFile.preview,
            description: "No description provided",
            location: "Unspecified",
            type: 'other',
            severity: 'minor'
          });
          changed = true;
        }
      });
      if (changed) {
        form.setValue('damageReports', [...prevReports], { shouldDirty: true });
      }
    }
  });

  // Remove handler: remove from uploader and from form field
  const handleRemovePhoto = (fileId: string) => {
    tempUploader.removeFile(fileId);
    // Remove corresponding damage report
    const reports = form.getValues('damageReports') || [];
    const filtered = reports.filter((r: any) => r.id !== fileId);
    form.setValue('damageReports', filtered, { shouldDirty: true });
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
              disabled={tempUploader.isUploading}
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  tempUploader.uploadFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={tempUploader.isUploading}
              asChild
            >
              <label htmlFor="damage-photo" className="flex items-center gap-2 cursor-pointer">
                {tempUploader.isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Upload Damage Photo
              </label>
            </Button>
            {tempUploader.error && (
              <Alert variant="destructive" className="mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {tempUploader.error}
              </Alert>
            )}
          </div>
        </div>
        {/* Damage photo gallery */}
        {tempUploader.files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Added Damage Photos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tempUploader.files.map(photo => (
                <div key={photo.id} className="relative border rounded-md overflow-hidden group">
                  <img
                    src={photo.url || photo.preview}
                    alt="Damage Photo"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute bottom-2 right-2"
                      onClick={() => handleRemovePhoto(photo.id)}
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

