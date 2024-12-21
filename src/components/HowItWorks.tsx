export const HowItWorks = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd"
                alt="Step 1"
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
              />
              <p className="text-sm text-subtitle">Enter your registration number</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a"
                alt="Step 2"
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
              />
              <p className="text-sm text-subtitle">We verify your car details</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e"
                alt="Step 3"
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
              />
              <p className="text-sm text-subtitle">Receive offers from verified dealers</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1550355291-a566597f1385"
                alt="Step 4"
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
              />
              <p className="text-sm text-subtitle">Choose the best offer and sell your car</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};