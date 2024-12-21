import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";

export const Hero = () => {
  return (
    <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <BackgroundPattern />

      {/* Content */}
      <div className="container relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-primary">Sell</span> your car with ease
          </h1>
          <p className="text-xl text-subtitle mb-8">
            We have certified dealers who are ready to give<br />
            you their best price
          </p>
          
          <ValuationForm />

          <div className="mt-12">
            <p className="text-sm text-secondary mb-2">WERYFIKACJA Z:</p>
            <img
              src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png"
              alt="CarVertical"
              className="h-8 mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};