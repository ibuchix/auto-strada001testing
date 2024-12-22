export const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold text-center mb-20">
          How it <span className="text-primary">works</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd",
              text: "Enter your registration number",
              step: "01"
            },
            {
              image: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
              text: "We verify your car details",
              step: "02"
            },
            {
              image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
              text: "Receive offers from verified dealers",
              step: "03"
            },
            {
              image: "https://images.unsplash.com/photo-1550355291-a566597f1385",
              text: "Choose the best offer and sell your car",
              step: "04"
            }
          ].map((item, index) => (
            <div key={index} className="group text-center">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                  <img
                    src={item.image}
                    alt={`Step ${index + 1}`}
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <p className="text-subtitle font-medium group-hover:text-primary transition-colors">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};