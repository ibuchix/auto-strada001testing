export const Benefits = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-[#ea384c]">Get</span> Your Highest Price
            </h3>
            <p className="text-gray-600 mb-6">
              We have a large pool of dealers who will pay the most, with ease
            </p>
            <img
              src="/lovable-uploads/6663a294-e346-42e7-b9c4-768dcd5536a4.png"
              alt="Dashboard"
              className="w-full rounded-lg"
            />
          </div>
          
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-[#ea384c]">Save</span> Time and Effort
            </h3>
            <p className="text-gray-600 mb-6">
              With Auto-strada, you can relax while we handle the selling process, from advertising to finalizing the sale.
            </p>
            <img
              src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png"
              alt="Time Saving"
              className="w-full rounded-lg"
            />
          </div>
          
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-[#ea384c]">Access</span> To A Larger Audience
            </h3>
            <p className="text-gray-600 mb-6">
              With our wide reach and marketing capabilities, your car is promoted to a larger audience.
            </p>
            <img
              src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png"
              alt="Larger Audience"
              className="w-full rounded-lg"
            />
          </div>
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-8">
            Join 200,000+ who've successfully sold their vehicles
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Add car sale examples here */}
          </div>
        </div>
      </div>
    </section>
  );
};