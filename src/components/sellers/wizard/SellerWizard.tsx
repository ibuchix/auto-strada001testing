import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VehicleInfoStep } from "./steps/VehicleInfoStep";
import { ValuationStep } from "./steps/ValuationStep";
import { PhotosStep } from "./steps/PhotosStep";
import { DetailsStep } from "./steps/DetailsStep";

interface SellerWizardProps {
  onSubmit: (data: any) => Promise<void>;
}

const steps = [
  {
    title: "Vehicle Information",
    description: "Enter your vehicle's basic details",
    estimatedTime: "2-3 min"
  },
  {
    title: "Valuation",
    description: "Get an instant valuation",
    estimatedTime: "1-2 min"
  },
  {
    title: "Photos",
    description: "Upload vehicle photos",
    estimatedTime: "5-7 min"
  },
  {
    title: "Additional Details",
    description: "Complete your listing",
    estimatedTime: "3-4 min"
  }
];

export const SellerWizard = ({ onSubmit }: SellerWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    vin: "",
    mileage: "",
    gearbox: "manual",
    photos: [],
    details: {}
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <VehicleInfoStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 1:
        return (
          <ValuationStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 2:
        return (
          <PhotosStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <DetailsStep
            formData={formData}
            onUpdate={updateFormData}
            onSubmit={onSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
        <div className="flex justify-between items-center mb-4">
          <p className="text-subtitle">{steps[currentStep].description}</p>
          <span className="text-sm text-subtitle">
            Estimated time: {steps[currentStep].estimatedTime}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-6">
        {renderStep()}
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        {currentStep < steps.length - 1 && (
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/90"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};