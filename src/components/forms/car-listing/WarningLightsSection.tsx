
/**
 * Warning Lights Section Component
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { useState } from "react";
import { useFormData } from "./context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

export const WarningLightsSection = () => {
  const { form } = useFormData();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newPhotoUrls: string[] = [];
    
    Array.from(e.target.files).forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      newPhotoUrls.push(objectUrl);
    });

    // Update the state and form with new photo URLs
    const updatedPhotoUrls = [...photoUrls, ...newPhotoUrls];
    setPhotoUrls(updatedPhotoUrls);
    form.setValue('warningLightPhotos', updatedPhotoUrls, { shouldDirty: true });
  };

  const removePhoto = (index: number) => {
    const updatedPhotoUrls = [...photoUrls];
    URL.revokeObjectURL(updatedPhotoUrls[index]);
    updatedPhotoUrls.splice(index, 1);
    setPhotoUrls(updatedPhotoUrls);
    form.setValue('warningLightPhotos', updatedPhotoUrls, { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warning Lights</CardTitle>
        <CardDescription>
          Please provide information about any warning lights that are displayed on your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="warningLightDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warning Light Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe which warning lights are on and any relevant information..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Upload Photos of Warning Lights</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide clear photos of all warning lights that are displayed on your dashboard
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={url} 
                    alt={`Warning light ${index + 1}`} 
                    className="w-full h-full object-cover rounded-md border" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <label
                htmlFor="warning-light-upload"
                className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center justify-center p-4">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Photo</span>
                </div>
                <input
                  id="warning-light-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
