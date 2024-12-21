export const Benefits = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">Get</span> Your Highest Price
            </h3>
            <p className="text-subtitle mb-6">
              We have a large pool of dealers who will pay the most, with ease
            </p>
            <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd"
                alt="Dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">Save</span> Time and Effort
            </h3>
            <p className="text-subtitle mb-6">
              With Auto-strada, you can relax while we handle the selling process, from advertising to finalizing the sale.
            </p>
            <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a"
                alt="Time Saving"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">Access</span> To A Larger Audience
            </h3>
            <p className="text-subtitle mb-6">
              With our wide reach and marketing capabilities, your car is promoted to a larger audience.
            </p>
            <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e"
                alt="Larger Audience"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-8">
            Join 200,000+ who've successfully sold their vehicles
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-accent p-4 rounded-lg">
                <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-lg">
                  <img
                    src={`https://images.unsplash.com/photo-${1550355291 + i}-a566597f1385`}
                    alt={`Success Story ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-sm text-subtitle">Sold to Dealer</p>
                <p className="text-xs text-primary">£8,500</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};