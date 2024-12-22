import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export const Hero = () => {
  const plugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

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
            <div className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white before:via-transparent before:to-white before:z-10">
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                }}
                plugins={[plugin.current]}
                className="w-full max-w-lg mx-auto py-6 bg-gradient-to-b from-white to-gray-50"
              >
                <CarouselContent className="-ml-2">
                  {brands.map((brand, index) => (
                    <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                      <div className="p-1">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-10 w-auto mx-auto opacity-70 hover:opacity-100 transition-opacity object-contain"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};