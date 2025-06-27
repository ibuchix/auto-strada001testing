
/**
 * AdditionalInfoSection Component
 * Created: 2025-05-11
 * Updated: 2025-06-12 - Removed duplicates (registered in Poland, warning lights) and added additional photos
 * 
 * Section for additional vehicle information including seat material, keys, seller notes,
 * and additional photos not covered in the main photo requirements.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFormData } from "../context/FormDataContext";
import { FormSection } from "../FormSection";
import { Controller } from "react-hook-form";
import { Camera, X } from "lucide-react";

export const AdditionalInfoSection = () => {
  const { form } = useFormData();
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  const handleAdditionalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newPhotoUrls: string[] = [];
    
    Array.from(e.target.files).forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      newPhotoUrls.push(objectUrl);
    });

    const updatedPhotos = [...additionalPhotos, ...newPhotoUrls];
    setAdditionalPhotos(updatedPhotos);
    form.setValue('uploadedPhotos', updatedPhotos, { shouldDirty: true });
  };

  const removeAdditionalPhoto = (index: number) => {
    const updatedPhotos = [...additionalPhotos];
    URL.revokeObjectURL(updatedPhotos[index]);
    updatedPhotos.splice(index, 1);
    setAdditionalPhotos(updatedPhotos);
    form.setValue('uploadedPhotos', updatedPhotos, { shouldDirty: true });
  };

  return (
    <FormSection 
      title="Additional Information"
      subtitle="Extra details and photos about your vehicle"
    >
      <div className="space-y-8">
        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Additional information about your vehicle's features and condition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seat Material */}
            <Controller
              control={form.control}
              name="seatMaterial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Material</FormLabel>
                  <Select 
                    value={field.value || ""} 
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seat material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leather">Leather</SelectItem>
                      <SelectItem value="cloth">Cloth</SelectItem>
                      <SelectItem value="leatherette">Leatherette</SelectItem>
                      <SelectItem value="alcantara">Alcantara</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Keys */}
            <Controller
              control={form.control}
              name="numberOfKeys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Keys</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : ""} 
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of keys" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4+">4+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seller Notes */}
            <Controller
              control={form.control}
              name="sellerNotes"
              render={({ field }) => {
                const characterCount = field.value?.length || 0;
                const isNearLimit = characterCount >= 180;
                const isAtLimit = characterCount >= 200;

                return (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <div className="space-y-2">
                      <Textarea
                        {...field}
                        placeholder="Add any additional information about your vehicle (max 200 characters)"
                        maxLength={200}
                        className={`min-h-[100px] resize-none ${
                          isAtLimit ? 'border-red-500 focus:border-red-500' : 
                          isNearLimit ? 'border-orange-400 focus:border-orange-400' : ''
                        }`}
                      />
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-gray-600">
                          Optional: Share any specific details about the vehicle's condition, history, or features
                        </p>
                        <span className={`font-medium ${
                          isAtLimit ? 'text-red-500' : 
                          isNearLimit ? 'text-orange-500' : 
                          'text-gray-500'
                        }`}>
                          {characterCount}/200
                        </span>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Additional Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Photos</CardTitle>
            <CardDescription>
              Upload any extra photos that showcase your vehicle's condition, features, or unique aspects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {additionalPhotos.map((photo, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={photo} 
                    alt={`Additional photo ${index + 1}`} 
                    className="w-full h-full object-cover rounded-md border" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAdditionalPhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {additionalPhotos.length < 10 && (
                <label
                  htmlFor="additional-photos-upload"
                  className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center justify-center p-4">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Photo</span>
                  </div>
                  <input
                    id="additional-photos-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleAdditionalPhotoUpload}
                  />
                </label>
              )}
            </div>
            {additionalPhotos.length > 0 && (
              <p className="text-sm text-gray-600 mt-4">
                {additionalPhotos.length}/10 additional photos uploaded
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </FormSection>
  );
};
