import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const FormHeader = () => {
  return (
    <>
      <h2 className="text-2xl font-semibold">Vehicle Details</h2>
      <Alert className="mb-8 border-[#DC143C]/20 bg-[#DC143C]/5">
        <InfoIcon className="h-4 w-4 text-[#DC143C]" />
        <AlertDescription className="text-dark ml-2">
          Please provide detailed information about your vehicle for an accurate valuation.
        </AlertDescription>
      </Alert>
    </>
  );
};