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
    Autoplay({ delay: 2000, stopOnInteraction: false })
  );

  const brands = [
    { 
      name: "Porsche", 
      logo: "https://images.unsplash.com/photo-1611656825455-391ab85aa676?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "Mercedes", 
      logo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "BMW", 
      logo: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "Peugeot", 
      logo: "https://images.unsplash.com/photo-1630165356623-f21145b4f667?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "Jaguar", 
      logo: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "Range Rover", 
      logo: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=200&h=100&fit=crop&auto=format" 
    },
    { 
      name: "Rolls Royce", 
      logo: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=200&h=100&fit=crop&auto=format" 
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
                className="w-full max-w-lg mx-auto rounded-full bg-accent/30 py-6"
              >
                <CarouselContent className="-ml-2">
                  {brands.map((brand, index) => (
                    <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                      <div className="p-1">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-8 w-auto mx-auto opacity-75 hover:opacity-100 transition-opacity object-contain filter grayscale hover:grayscale-0"
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