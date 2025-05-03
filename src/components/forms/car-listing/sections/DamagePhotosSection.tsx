
/**
 * DamagePhotosSection component
 * Created: 2025-07-18
 * Updated: 2025-07-27 - Fixed variable declaration order and typing issues
 * Updated: 2025-07-27 - Added uuid generation for damage report items
 */

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Camera, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarListingFormData, DamageReport, DamageType } from '@/types/forms';
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const DamagePhotosSection = () => {
  const { control, register, setValue, watch } = useFormContext<CarListingFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'damageReports'
  });
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const damageReports = watch('damageReports') || [];

  // Define handleAddImage function before use
  const handleAddImage = async (acceptedFiles: File[], reportIndex: number) => {
    if (!acceptedFiles.length) return;
    
    try {
      setUploading(true);
      setActiveIndex(reportIndex);
      
      // Upload the file
      const file = acceptedFiles[0]; // Only use the first file
      const uploadedFile = await tempFileStorageService.addFile(file);
      
      // Get the URL from the response
      const fileUrl = typeof uploadedFile === 'string' ? uploadedFile : uploadedFile.url;
      
      // Update the specific damage report with the photo URL
      const updatedReports = [...damageReports];
      updatedReports[reportIndex] = {
        ...updatedReports[reportIndex],
        photo: fileUrl
      };
      
      setValue('damageReports', updatedReports);
      
      toast.success("Damage photo uploaded successfully.");
    } catch (error: any) {
      console.error("File upload error:", error);
      toast.error(error.message || "Failed to upload damage photo. Please try again.");
    } finally {
      setUploading(false);
      setActiveIndex(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => activeIndex !== null && handleAddImage(files, activeIndex),
    accept: {'image/*': ['.jpeg', '.png', '.jpg']},
    maxFiles: 1
  });

  const addDamageReport = () => {
    append({
      id: uuidv4(), // Generate unique id
      type: 'scratch' as DamageType,
      description: '',
      photo: null,
      location: '',
      severity: 'minor'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between">
              <h4 className="font-medium">Damage Report {index + 1}</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-8 w-8 text-red-500"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`damageReports.${index}.type`}>Type of Damage</Label>
                <Select
                  value={damageReports[index]?.type || 'scratch'}
                  onValueChange={(value) => {
                    const updatedReports = [...damageReports];
                    updatedReports[index] = {
                      ...updatedReports[index],
                      type: value as DamageType
                    };
                    setValue('damageReports', updatedReports);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scratch">Scratch</SelectItem>
                    <SelectItem value="dent">Dent</SelectItem>
                    <SelectItem value="collision">Collision</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`damageReports.${index}.severity`}>Severity</Label>
                <Select
                  value={damageReports[index]?.severity || 'minor'}
                  onValueChange={(value) => {
                    const updatedReports = [...damageReports];
                    updatedReports[index] = {
                      ...updatedReports[index],
                      severity: value as 'minor' | 'moderate' | 'severe'
                    };
                    setValue('damageReports', updatedReports);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`damageReports.${index}.location`}>Location</Label>
                <Input
                  {...register(`damageReports.${index}.location` as const)}
                  placeholder="e.g., Front bumper, Rear fender"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`damageReports.${index}.description`}>Description</Label>
                <Input
                  {...register(`damageReports.${index}.description` as const)}
                  placeholder="Brief description of the damage"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Photo of Damage</Label>
              {damageReports[index]?.photo ? (
                <div className="relative w-40">
                  <AspectRatio ratio={1}>
                    <img
                      src={damageReports[index]?.photo || ''}
                      alt={`Damage ${index + 1}`}
                      className="rounded-md object-cover"
                    />
                  </AspectRatio>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-background rounded-full shadow-sm h-6 w-6"
                    onClick={() => {
                      const updatedReports = [...damageReports];
                      updatedReports[index] = {
                        ...updatedReports[index],
                        photo: null
                      };
                      setValue('damageReports', updatedReports);
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  onClick={() => setActiveIndex(index)}
                  className={`
                    border-2 border-dashed rounded-md p-4 text-center cursor-pointer
                    ${isDragActive ? 'border-primary' : 'border-gray-300'}
                    ${uploading && activeIndex === index ? 'bg-gray-50' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  <Camera className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {uploading && activeIndex === index
                      ? "Uploading..."
                      : "Click or drag photo to upload"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={addDamageReport}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Damage Report
      </Button>
    </div>
  );
};
