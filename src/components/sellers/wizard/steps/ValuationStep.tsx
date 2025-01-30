import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ValuationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
}

export const ValuationStep = ({ formData }: ValuationStepProps) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-accent/20 border-accent">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          We're calculating your vehicle's value based on the provided information.
        </AlertDescription>
      </Alert>

      <div className="text-center py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-accent/30 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-accent/30 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};