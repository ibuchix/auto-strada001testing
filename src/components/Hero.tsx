import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";

export const Hero = () => {
  return (
    <div className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <BackgroundPattern />

      {/* Content */}
      <div className="container relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-primary">Sell</span> your car with 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-iris"> confidence</span>
          </h1>
          <p className="text-xl md:text-2xl text-subtitle mb-12 leading-relaxed">
            We have certified dealers who are ready to give<br className="hidden md:block" />
            you their best price
          </p>
          
          <ValuationForm />

          <div className="mt-16">
            <p className="text-sm font-medium text-secondary mb-4">TRUSTED BY LEADING BRANDS</p>
            <div className="flex items-center justify-center gap-8 opacity-75 hover:opacity-100 transition-opacity">
              <img
                src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png"
                alt="CarVertical"
                className="h-8 hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};