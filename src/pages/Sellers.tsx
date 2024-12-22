import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Sellers = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent -skew-y-6 transform origin-top-left" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">How it works</h1>
            <p className="text-xl text-subtitle mb-8">
              Sell your car without having to choose between price and convenience
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {/* Value Your Car */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-accent p-8 rounded-2xl">
                <img
                  src="/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png"
                  alt="Value your car"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">Value your car</h2>
                <p className="text-subtitle text-lg">
                  Our smart valuation tool provides a free, straight-forward using the market data. All you need to do is enter your reg and tell us your car's mileage.
                </p>
              </div>
            </div>

            {/* Profile Vehicle */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold mb-4">Profile your vehicle</h2>
                <p className="text-subtitle text-lg">
                  You can easily guide us with your car specs & its features. You will be required to take or upload photos of your car.
                </p>
              </div>
              <div className="order-1 md:order-2 bg-accent p-8 rounded-2xl">
                <img
                  src="/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png"
                  alt="Profile vehicle"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Reserve Price */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-accent p-8 rounded-2xl">
                <img
                  src="/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png"
                  alt="Reserve price"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">Get a reserve price set</h2>
                <p className="text-subtitle text-lg">
                  After completing your profile, we would assess your vehicle, set a reserve price and let us know when you're available, it will then be listed for sale.
                </p>
              </div>
            </div>

            {/* Highest Bid */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold mb-4">Obtain your highest bid</h2>
                <p className="text-subtitle text-lg">
                  Our pool of dealers would compete to give you the best price in our online daily sale. Once your reserve is hit/pass, after the dealer will reach out to complete the sale.
                </p>
              </div>
              <div className="order-1 md:order-2 bg-accent p-8 rounded-2xl">
                <img
                  src="/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png"
                  alt="Highest bid"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Finalize Sale */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-accent p-8 rounded-2xl">
                <img
                  src="/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png"
                  alt="Finalize sale"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">Finalise the sale</h2>
                <p className="text-subtitle text-lg">
                  Next, the dealer makes an arrangement to collect your car for free at a convenient time. They will check your vehicle to ensure that it matches your profile and all payment is made before collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            And you've sold a car without any hassle, thanks to Auto-Strada
          </h2>
          <div className="max-w-md mx-auto space-y-4">
            <Input 
              placeholder="Enter Reg" 
              className="bg-white text-center text-lg"
            />
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white text-lg py-6"
            >
              Value your car
              <span className="ml-2">→</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sellers;