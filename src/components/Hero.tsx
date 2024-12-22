import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const Hero = () => {
  const brands = [
    { name: "Porsche", logo: "/lovable-uploads/c321d882-4530-4724-b7c1-d0c5fbe57d04.png" },
    { name: "Mercedes", logo: "/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" },
    { name: "BMW", logo: "/lovable-uploads/6663a294-e346-42e7-b9c4-768dcd5536a4.png" },
    { name: "Peugeot", logo: "/lovable-uploads/159a3fac-5452-46dd-bc62-84ed729108f8.png" },
    { name: "Jaguar", logo: "/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" },
    { name: "Range Rover", logo: "/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" },
    { name: "Rolls Royce", logo: "/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" },
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
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-lg mx-auto"
            >
              <CarouselContent className="-ml-2">
                {brands.map((brand, index) => (
                  <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                    <div className="p-1">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-8 w-auto mx-auto opacity-75 hover:opacity-100 transition-opacity"
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
  );
};