import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const DealerSignup = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Join Auto-Strada as a Dealer
          </h1>
          <p className="text-xl text-subtitle mb-12">
            Get access to quality used cars and grow your business with Auto-Strada
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: "Quality Inventory",
                description: "Access to verified private seller vehicles"
              },
              {
                title: "Competitive Edge",
                description: "Real-time bidding system for fair market prices"
              },
              {
                title: "Efficient Process",
                description: "Streamlined purchasing and documentation"
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-subtitle">{benefit.description}</p>
              </div>
            ))}
          </div>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Register as a Dealer
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DealerSignup;