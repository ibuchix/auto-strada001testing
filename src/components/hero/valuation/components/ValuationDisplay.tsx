interface ValuationDisplayProps {
  averagePrice: number;
}

export const ValuationDisplay = ({ averagePrice }: ValuationDisplayProps) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Average Market Value</p>
      <p className="text-4xl font-bold text-primary">
        PLN {averagePrice.toLocaleString()}
      </p>
    </div>
  );
};