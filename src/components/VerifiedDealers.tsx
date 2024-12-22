export const VerifiedDealers = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold text-center mb-20">
          Verified dealers ready to <span className="text-primary">buy</span> your car
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-75 hover:opacity-100 transition-opacity">
          <img 
            src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" 
            alt="CarStore" 
            className="h-12 hover:scale-105 transition-transform"
          />
          <img 
            src="/lovable-uploads/754c0f97-ac22-4d56-a8e8-65d603b620b0.png" 
            alt="CarVertical" 
            className="h-12 hover:scale-105 transition-transform"
          />
          <img 
            src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" 
            alt="Arnold Clark" 
            className="h-12 hover:scale-105 transition-transform"
          />
          <img 
            src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" 
            alt="HR Owen" 
            className="h-12 hover:scale-105 transition-transform"
          />
        </div>
      </div>
    </section>
  );
};