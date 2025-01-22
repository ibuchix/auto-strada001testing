import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ManualValuationForm } from "@/components/forms/manual-valuation/ManualValuationForm";

const ManualValuation = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            Manual Vehicle Valuation
          </h1>
          <p className="text-subtitle text-center mb-12">
            Please provide detailed information about your vehicle for a manual valuation by our experts.
          </p>
          <ManualValuationForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ManualValuation;