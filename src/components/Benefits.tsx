export const Benefits = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold text-center mb-20">
          Why Choose <span className="text-primary">Us</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="group p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-dark group-hover:text-primary transition-colors">
              Best Price Guaranteed
            </h3>
            <p className="text-subtitle mb-6 leading-relaxed">
              We have a large pool of dealers who will compete to offer you the best market price
            </p>
            <div className="relative h-48 overflow-hidden rounded-xl">
              <img
                src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd"
                alt="Dashboard"
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="group p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-dark group-hover:text-primary transition-colors">
              Save Time and Effort
            </h3>
            <p className="text-subtitle mb-6 leading-relaxed">
              Let us handle the entire selling process while you focus on what matters most to you
            </p>
            <div className="relative h-48 overflow-hidden rounded-xl">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a"
                alt="Time Saving"
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="group p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4 text-dark group-hover:text-primary transition-colors">
              Reach More Buyers
            </h3>
            <p className="text-subtitle mb-6 leading-relaxed">
              Access our extensive network of verified dealers for maximum exposure
            </p>
            <div className="relative h-48 overflow-hidden rounded-xl">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e"
                alt="Larger Audience"
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h3 className="text-3xl font-bold mb-12">
            Join <span className="text-primary">200,000+</span> successful sellers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="group bg-accent p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="relative h-0 pb-[75%] overflow-hidden rounded-lg mb-4">
                  <img
                    src={`https://images.unsplash.com/photo-${1550355291 + i}-a566597f1385`}
                    alt={`Success Story ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm font-medium text-subtitle">Sold to Dealer</p>
                <p className="text-lg font-bold text-primary">£8,500</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};