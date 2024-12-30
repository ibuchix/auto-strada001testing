import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceHistorySectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const ServiceHistorySection = ({ form, carId }: ServiceHistorySectionProps) => {
  const handleFileUpload = async (files: FileList) => {
    if (!carId) {
      toast.error("Car ID is required for file upload");
      return;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${carId}/service_history_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('car-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Log the upload
        await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: 'service_history',
            upload_status: 'completed'
          });

        return filePath;
      });

      const uploadedPaths = await Promise.all(uploadPromises);

      // Update the car's service history files
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          service_history_files: supabase.sql`array_cat(service_history_files, ${uploadedPaths})`
        })
        .eq('id', carId);

      if (updateError) throw updateError;

      toast.success('Service history documents uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload service history documents');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Service History</h3>
        <FormField
          control={form.control}
          name="serviceHistoryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service History Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    { value: 'full', label: 'Full Service History' },
                    { value: 'partial', label: 'Partial Service History' },
                    { value: 'none', label: 'No Service History' },
                    { value: 'not_due', label: 'First Service Not Due Yet' },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Service History Documents</h3>
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => {
            if (e.target.files) handleFileUpload(e.target.files);
          }}
        />
        <p className="text-sm text-gray-600 mt-2">
          Upload service history documents (PDF, images)
        </p>
      </div>
    </div>
  );
};