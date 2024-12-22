import { Navigation } from "@/components/Navigation";

const Dealers = () => {
  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Find Trusted Dealers</h1>
          <p className="text-subtitle">Connect with verified automotive dealers in your area.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in [animation-delay:200ms]">
          {/* Benefits Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Verified Dealers</h3>
            <p className="text-subtitle">All dealers on our platform are thoroughly vetted and licensed.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Competitive Pricing</h3>
            <p className="text-subtitle">Get the best deals through our network of trusted dealers.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-iris-light rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">Quick Response</h3>
            <p className="text-subtitle">Get responses from multiple dealers within hours.</p>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-md animate-fade-in [animation-delay:400ms]">
          <h2 className="text-3xl font-bold text-dark mb-6">Why Choose Our Dealers?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Verified Quality</h3>
              <p className="text-subtitle">All dealers undergo thorough verification process.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Fair Pricing</h3>
              <p className="text-subtitle">Transparent pricing and competitive offers.</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Expert Service</h3>
              <p className="text-subtitle">Professional and knowledgeable dealer network.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dealers;