import { Navigation } from "@/components/Navigation";

const Sellers = () => {
  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Sell Your Car</h1>
          <p className="text-subtitle">Get the best value for your vehicle with our trusted network of dealers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in [animation-delay:200ms]">
          {/* Benefits Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Competitive Pricing</h3>
            <p className="text-subtitle">Get the best market value for your vehicle through our competitive bidding system.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Secure Process</h3>
            <p className="text-subtitle">Our platform ensures safe and secure transactions with verified dealers.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Fast Process</h3>
            <p className="text-subtitle">Get multiple offers quickly and complete the sale on your timeline.</p>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-md animate-fade-in [animation-delay:400ms]">
          <h2 className="text-3xl font-bold text-dark mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">List Your Car</h3>
              <p className="text-subtitle">Create a detailed listing with photos and specifications.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Receive Bids</h3>
              <p className="text-subtitle">Get competitive offers from our network of verified dealers.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Complete Sale</h3>
              <p className="text-subtitle">Accept the best offer and finalize the sale securely.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sellers;