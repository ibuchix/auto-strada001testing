import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ValidationError } from "./utils/validation";

interface RequirementsDisplayProps {
  errors: ValidationError[];
}

export const RequirementsDisplay = ({ errors }: RequirementsDisplayProps) => {
  if (errors.length === 0) {
    return (
      <Alert className="bg-[#21CA6F]/10 border-[#21CA6F] text-[#21CA6F]">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          All requirements have been met
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-[#DC143C]/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Please complete the following:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};