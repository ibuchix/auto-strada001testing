import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DetailsStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onSubmit: (data: any) => Promise<void>;
}

export const DetailsStep = ({ formData, onUpdate, onSubmit }: DetailsStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="description">Vehicle Description</Label>
          <Textarea
            id="description"
            value={formData.details?.description || ""}
            onChange={(e) =>
              onUpdate({
                details: { ...formData.details, description: e.target.value },
              })
            }
            placeholder="Describe your vehicle's condition, features, and history"
            className="h-32 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.details?.contactNumber || ""}
            onChange={(e) =>
              onUpdate({
                details: { ...formData.details, contactNumber: e.target.value },
              })
            }
            placeholder="Enter your contact number"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-secondary hover:bg-secondary/90"
      >
        Submit Listing
      </Button>
    </form>
  );
};