
/**
 * Component for uploading damage photos
 * Created: 2025-07-18
 */
import React, { useState } from 'react';
import { Camera, Plus, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from 'react-hook-form';
import { uploadPhoto } from '../photo-upload/services/photoStorageService';

interface DamagePhoto {
  id: string;
  url: string;
  description: string;
  location: string;
}

export const DamagePhotosSection = () => {
  const form = useFormContext();
  const carId = form.watch('id');
  const [isUploading, setIsUploading] = useState(false);
  const [damagePhotos, setDamagePhotos] = useState<DamagePhoto[]>([]);
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  
  const handleUploadDamagePhoto = async (file: File) => {
    if (!carId) {
      console.error('Car ID is required for damage photo upload');
      return;
    }
    
    if (!currentDescription) {
      console.error('Description is required for damage photo');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload using the photoStorageService
      const category = `damage_${Date.now()}`;
      const photoUrl = await uploadPhoto(file, carId, category);
      
      if (photoUrl) {
        const newDamagePhoto: DamagePhoto = {
          id: `damage_${Date.now()}`,
          url: photoUrl,
          description: currentDescription,
          location: currentLocation || 'Unspecified',
        };
        
        // Update local state
        setDamagePhotos(prev => [...prev, newDamagePhoto]);
        
        // Update form values
        const damageReports = form.getValues('damageReports') || [];
        form.setValue('damageReports', [...damageReports, {
          photo: photoUrl,
          description: currentDescription,
          location: currentLocation || 'Unspecified',
          type: 'visual',
          carId: carId,
        }], { shouldDirty: true });
        
        // Reset form fields
        setCurrentDescription('');
        setCurrentLocation('');
      }
    } catch (error) {
      console.error('Error uploading damage photo:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const removeDamagePhoto = (id: string) => {
    // Update local state
    setDamagePhotos(prev => prev.filter(photo => photo.id !== id));
    
    // Update form values
    const damageReports = form.getValues('damageReports') || [];
    const photoIndex = damageReports.findIndex((report: any) => report.id === id);
    if (photoIndex >= 0) {
      const updatedReports = [...damageReports];
      updatedReports.splice(photoIndex, 1);
      form.setValue('damageReports', updatedReports, { shouldDirty: true });
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Damage Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="damage-location">Damage Location</Label>
            <Input
              id="damage-location"
              placeholder="e.g., Front bumper, rear door"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              disabled={isUploading}
            />
          </div>
          
          <div>
            <Label htmlFor="damage-description">Damage Description</Label>
            <Textarea
              id="damage-description"
              placeholder="Describe the damage..."
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="damage-photo">Add Photo</Label>
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
              disabled={isUploading || !currentDescription}
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
                    alt={photo.description}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                    <div className="text-white text-sm p-2">
                      <p className="font-semibold">{photo.location}</p>
                      <p className="text-xs mt-1">{photo.description}</p>
                    </div>
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
