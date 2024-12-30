import { ClipboardCheck, Car, Users2, Banknote } from "lucide-react";

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
              icon: Car,
              text: "Enter your registration number",
              step: "01",
              description: "Quick and easy vehicle identification"
            },
            {
              icon: ClipboardCheck,
              text: "We verify your car details",
              step: "02",
              description: "Thorough verification process"
            },
            {
              icon: Users2,
              text: "Receive offers from verified dealers",
              step: "03",
              description: "Multiple competitive offers"
            },
            {
              icon: Banknote,
              text: "Choose the best offer and sell your car",
              step: "04",
              description: "Fast and secure transaction"
            }
          ].map((item, index) => (
            <div key={index} className="group text-center">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <item.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-dark group-hover:text-primary transition-colors">
                    {item.text}
                  </h3>
                  <p className="text-subtitle text-sm group-hover:text-primary/80 transition-colors">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};