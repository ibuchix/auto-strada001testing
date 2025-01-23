import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ManualValuationForm } from "@/components/forms/manual-valuation/ManualValuationForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const ManualValuation = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            Manual Vehicle Valuation
          </h1>
          <p className="text-subtitle text-center mb-6">
            Please provide detailed information about your vehicle for a manual valuation by our experts.
          </p>

          <Alert className="mb-8 border-[#DC143C]/20 bg-[#DC143C]/5">
            <InfoIcon className="h-4 w-4 text-[#DC143C]" />
            <AlertDescription className="text-dark ml-2">
              To provide you with the most accurate valuation, we need detailed information about your vehicle. 
              This helps our experts assess your car's true market value. You'll receive a response within 24-48 hours.
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">What to expect:</h2>
            <ul className="space-y-2 text-subtitle">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#DC143C]">1.</span>
                Fill out the vehicle details form (5-10 minutes)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#DC143C]">2.</span>
                Upload clear photos of your vehicle's exterior and interior
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#DC143C]">3.</span>
                Submit your request for expert review
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#DC143C]">4.</span>
                Receive your detailed valuation within 24-48 hours
              </li>
            </ul>
          </div>

          <ManualValuationForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ManualValuation;