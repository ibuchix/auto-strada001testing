import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface ManualValuationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualValuationData) => void;
  mileage?: string;
  transmission?: string;
}

export interface ManualValuationData {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
}

export const ManualValuationForm = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  mileage = '',
  transmission = 'manual'
}: ManualValuationFormProps) => {
  const [formData, setFormData] = useState<ManualValuationData>({
    make: '',
    model: '',
    year: '',
    mileage: mileage,
    transmission: transmission
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold mb-4">
            Enter Vehicle Details
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              placeholder="e.g., BMW"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="e.g., X5"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="e.g., 2020"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage (KM)</Label>
            <Input
              id="mileage"
              type="number"
              min="0"
              placeholder="e.g., 50000"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <Select
              value={formData.transmission}
              onValueChange={(value) => setFormData({ ...formData, transmission: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Get Valuation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};