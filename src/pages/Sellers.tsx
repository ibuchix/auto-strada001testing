import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Car, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  ShieldCheck, 
  Users, 
  ArrowRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Sellers = () => {
  const [vin, setVin] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin) {
      navigate('/sell-my-car', { state: { vin } });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent to-transparent -skew-y-6 transform origin-top-left" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Sell your car in <span className="text-primary">3 simple steps</span>
            </h1>
            <p className="text-xl text-subtitle mb-8">
              Get the best price for your car without the hassle of private buyers or low-ball offers
            </p>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <Input
                type="text"
                placeholder="Enter your VIN number"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="h-14 text-center text-lg"
              />
              <Button 
                type="submit"
                className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white text-lg"
              >
                Start Selling
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Secure Process",
                description: "Our platform ensures a safe and transparent selling process"
              },
              {
                icon: Banknote,
                title: "Best Market Price",
                description: "Get competitive offers from verified dealers"
              },
              {
                icon: Clock,
                title: "Quick Sale",
                description: "Sell your car within days, not weeks or months"
              }
            ].map((benefit, index) => (
              <div key={index} className="group bg-white p-6 rounded-xl shadow-sm">
                <benefit.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-subtitle group-hover:text-primary transition-colors">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
          <div className="space-y-12">
            {[
              {
                icon: Car,
                title: "Enter Your Car Details",
                description: "Start by entering your VIN number and basic vehicle information. Our system will automatically fetch your car's specifications.",
                step: "01"
              },
              {
                icon: Camera,
                title: "Upload Photos",
                description: "Take clear photos of your car following our guidelines. Quality photos help attract better offers from dealers.",
                step: "02"
              },
              {
                icon: Users,
                title: "Receive Dealer Offers",
                description: "Verified dealers in our network will review your listing and submit their best offers.",
                step: "03"
              },
              {
                icon: CheckCircle2,
                title: "Accept Best Offer",
                description: "Review the offers, choose the best one, and complete the sale. We'll guide you through the paperwork.",
                step: "04"
              }
            ].map((step, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`${index % 2 === 1 ? "md:order-2" : ""}`}>
                  <div className="bg-accent p-8 rounded-2xl">
                    <div className="aspect-video bg-gradient-to-br from-iris-light to-secondary/10 rounded-lg flex items-center justify-center">
                      <step.icon className="w-24 h-24 text-secondary" />
                    </div>
                  </div>
                </div>
                <div className={`${index % 2 === 1 ? "md:order-1" : ""}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-bold text-secondary/20">{step.step}</span>
                    <div>
                      <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                      <p className="text-subtitle text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to sell your car?
          </h2>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <Input 
              type="text"
              placeholder="Enter VIN number"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="bg-white text-center text-lg h-14"
            />
            <Button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white text-lg h-14"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Sellers;