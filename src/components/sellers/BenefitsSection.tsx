import { ShieldCheck, Banknote, Clock } from "lucide-react";

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Secure Process",
      description: "Our platform ensures a safe and transparent selling process"
    },
    {
      icon: Banknote,
      title: "Best Market Price",
      description: "Get competitive offers from verified dealers"
    },
    {
      icon: Clock,
      title: "Quick Sale",
      description: "Sell your car within days, not weeks or months"
    }
  ];

  return (
    <section className="py-16 bg-accent">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group bg-white p-6 rounded-xl shadow-sm">
              <benefit.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-subtitle group-hover:text-primary transition-colors">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};