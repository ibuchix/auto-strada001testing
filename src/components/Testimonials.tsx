export const Testimonials = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          What our clients are saying
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-8 rounded-lg shadow-sm">
              <p className="text-subtitle mb-6">
                "I had a great experience selling my car through Auto-strada. The process was smooth and efficient."
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src={`https://images.unsplash.com/photo-${1550355291 + i}-a566597f1385`}
                  alt={`Client ${i}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">John Smith</h4>
                  <p className="text-sm text-subtitle">Sold BMW X5</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};