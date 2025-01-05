import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const DEALER_WEBAPP_URL = "http://localhost:8080"; // During development, point to local dealer webapp
// const DEALER_WEBAPP_URL = "https://dealers.autostrada.com"; // Production URL (commented for now)

const Dealers = () => {
  const handleDealerRedirect = () => {
    try {
      // Remove any trailing slashes and clean the URL
      const cleanUrl = DEALER_WEBAPP_URL.replace(/\/+$/, '');
      console.log('Redirecting to:', cleanUrl); // Debug log
      window.location.href = cleanUrl;
    } catch (error) {
      console.error('Error redirecting to dealer webapp:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/30">
      <Navigation />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <h1 className="text-6xl font-bold text-dark mb-6">
            Join Our Network of <span className="text-iris">Professional</span> Dealers
          </h1>
          <p className="text-xl text-subtitle mb-8 max-w-2xl mx-auto">
            Connect with verified sellers and expand your inventory with our trusted automotive marketplace
          </p>
          <Button 
            onClick={handleDealerRedirect}
            className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-xl"
          >
            Access Dealer Platform <ChevronRight className="ml-2" />
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { number: "500+", label: "Active Sellers" },
            { number: "1000+", label: "Cars Listed" },
            { number: "£2M+", label: "Total Sales" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-bold text-iris mb-2">{stat.number}</div>
              <div className="text-subtitle">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              title: "Verified Sellers",
              description: "Access a network of pre-vetted sellers with quality vehicles",
              icon: (
                <div className="h-14 w-14 bg-iris/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-7 w-7 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              ),
            },
            {
              title: "Competitive Pricing",
              description: "Get the best deals through our transparent bidding system",
              icon: (
                <div className="h-14 w-14 bg-iris/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-7 w-7 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ),
            },
            {
              title: "Dedicated Platform",
              description: "Access your exclusive dealer dashboard with specialized tools",
              icon: (
                <div className="h-14 w-14 bg-iris/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="h-7 w-7 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
              ),
            },
          ].map((benefit, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              {benefit.icon}
              <h3 className="text-xl font-bold text-dark mb-4">{benefit.title}</h3>
              <p className="text-subtitle">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-iris to-iris/90 p-12 rounded-3xl text-white text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">Access your dedicated dealer platform and start growing your business today</p>
          <Button 
            onClick={handleDealerRedirect}
            className="h-14 px-8 bg-white text-iris hover:bg-white/90 text-lg rounded-xl"
          >
            Go to Dealer Platform <ChevronRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dealers;