import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";

export const Hero = () => {
  const brands = [
    { 
      name: "Porsche", 
      logo: "https://www.carlogos.org/car-logos/porsche-logo-2100x1100.png" 
    },
    { 
      name: "Mercedes", 
      logo: "https://www.carlogos.org/logo/Mercedes-Benz-logo-2011-1920x1080.png" 
    },
    { 
      name: "BMW", 
      logo: "https://www.carlogos.org/car-logos/bmw-logo-2020-gray.png" 
    },
    { 
      name: "Peugeot", 
      logo: "https://www.carlogos.org/car-logos/peugeot-logo-2010-black.png" 
    },
    { 
      name: "Jaguar", 
      logo: "https://www.carlogos.org/car-logos/jaguar-logo-2012-black.png" 
    },
    { 
      name: "Range Rover", 
      logo: "https://www.carlogos.org/car-logos/range-rover-logo-2010-black.png" 
    },
    { 
      name: "Rolls Royce", 
      logo: "https://www.carlogos.org/car-logos/rolls-royce-logo-black.png" 
    },
    { 
      name: "Audi", 
      logo: "https://www.carlogos.org/car-logos/audi-logo-2016-black.png" 
    },
    { 
      name: "Ferrari", 
      logo: "https://www.carlogos.org/car-logos/ferrari-logo-black.png" 
    },
    { 
      name: "Lamborghini", 
      logo: "https://www.carlogos.org/car-logos/lamborghini-logo-black.png" 
    }
  ];

  return (
    <div className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <BackgroundPattern />

      {/* Content */}
      <div className="container relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-primary">Sell</span> your car with 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-iris"> confidence</span>
          </h1>
          <p className="text-xl md:text-2xl text-subtitle mb-12 leading-relaxed">
            We have certified dealers who are ready to give<br className="hidden md:block" />
            you their best price
          </p>
          
          <ValuationForm />

          <div className="mt-20">
            <p className="text-sm font-medium text-secondary mb-8">TRUSTED BY LEADING BRANDS</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center max-w-4xl mx-auto">
              {brands.map((brand, index) => (
                <div key={index} className="flex items-center justify-center p-2">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 w-auto mx-auto opacity-100 hover:scale-110 transition-all duration-300 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};