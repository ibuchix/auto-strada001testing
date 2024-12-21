export const BackgroundPattern = () => {
  return (
    <div className="absolute inset-0 bg-[#f3f3f3]">
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} className="border border-secondary/20" />
        ))}
      </div>
    </div>
  );
};