import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Sellers = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-accent to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
              How It Works
            </h1>
            <p className="text-lg text-subtitle mb-8">
              Sell your car without having to choose between price and convenience
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-accent/50 rounded-lg p-8 animate-fade-in">
                <h3 className="text-2xl font-bold text-dark mb-4">Value your car</h3>
                <p className="text-subtitle">
                  Our smart valuation tool provides a free, straight-forward using live market data. All you need to do is enter your reg and wait.
                </p>
              </div>
              <div className="order-first md:order-last">
                <img 
                  src="/lovable-uploads/554b673d-edb7-4104-a75f-ba3dd295b5f8.png" 
                  alt="Car Valuation Process" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-last md:order-first">
                <img 
                  src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" 
                  alt="Profile Vehicle" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="bg-accent/50 rounded-lg p-8 animate-fade-in [animation-delay:200ms]">
                <h3 className="text-2xl font-bold text-dark mb-4">Profile your vehicle</h3>
                <p className="text-subtitle">
                  You can easily guide us through your car piece by piece. You will be required to take or upload photos of your car.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-accent/50 rounded-lg p-8 animate-fade-in [animation-delay:400ms]">
                <h3 className="text-2xl font-bold text-dark mb-4">Get a reserve price set</h3>
                <p className="text-subtitle">
                  After completing your profile, we would assess your vehicle, set a reserve price and let you know what's condition it will be listed in.
                </p>
              </div>
              <div className="order-first md:order-last">
                <img 
                  src="/lovable-uploads/6663a294-e346-42e7-b9c4-768dcd5536a4.png" 
                  alt="Reserve Price Setting" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-last md:order-first">
                <img 
                  src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" 
                  alt="Bidding Process" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="bg-accent/50 rounded-lg p-8 animate-fade-in [animation-delay:600ms]">
                <h3 className="text-2xl font-bold text-dark mb-4">Obtain your highest bid</h3>
                <p className="text-subtitle">
                  Our pool of dealers would compete to give you the best price in our online daily sale. Once your reserve has been met, the highest bid will reach out to complete the sale.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-dark mb-6">
              And you've sold a car without any hassle, thanks to Auto-Strada
            </h2>
            <div className="max-w-md mx-auto space-y-4">
              <Link to="/auth">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                >
                  Sell your car on Auto-Strada now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sellers;