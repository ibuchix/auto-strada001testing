import { Navigation } from "@/components/Navigation";
import { ValuationForm } from "@/components/hero/ValuationForm";
import { Footer } from "@/components/Footer";

const SellMyCar = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          Sell Your Car Today
        </h1>
        <div className="max-w-xl mx-auto">
          <ValuationForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellMyCar;