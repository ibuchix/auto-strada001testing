export const HowItWorks = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="/lovable-uploads/6663a294-e346-42e7-b9c4-768dcd5536a4.png"
                alt="Step 1"
                className="w-16 h-16 mx-auto mb-4"
              />
              <p className="text-sm">Enter your registration number</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png"
                alt="Step 2"
                className="w-16 h-16 mx-auto mb-4"
              />
              <p className="text-sm">We verify your car details</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png"
                alt="Step 3"
                className="w-16 h-16 mx-auto mb-4"
              />
              <p className="text-sm">Receive offers from verified dealers</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <img
                src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png"
                alt="Step 4"
                className="w-16 h-16 mx-auto mb-4"
              />
              <p className="text-sm">Choose the best offer and sell your car</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};