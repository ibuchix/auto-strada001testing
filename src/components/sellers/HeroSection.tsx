
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-24 pb-16 relative overflow-hidden"> {/* Updated from pt-16 to pt-24 for more space */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent to-transparent -skew-y-6 transform origin-top-left" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-kanit">
            Sell your car in <span className="text-[#DC143C]">3 simple steps</span>
          </h1>
          <p className="text-xl text-[#6A6A77] mb-12">
            Get the best price for your car without the hassle of private buyers or low-ball offers
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                number: "01",
                title: "Create Your Listing",
                description: "Fill in your car's details and upload photos"
              },
              {
                number: "02",
                title: "Get Verified",
                description: "We verify your listing to ensure quality"
              },
              {
                number: "03",
                title: "Receive Offers",
                description: "Get competitive offers from verified dealers"
              }
            ].map((step, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC143C]/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
                <div className="relative">
                  <span className="text-4xl font-bold text-[#DC143C] font-oswald">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-[#0E0E2C] mt-4 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#6A6A77]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => navigate('/')}
            className="h-14 px-8 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white text-lg"
          >
            Start Selling
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
