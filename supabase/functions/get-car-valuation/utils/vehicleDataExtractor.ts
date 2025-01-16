interface VehicleDetails {
  make: string;
  model: string;
  year: number | null;
  valuation: number | null;
  averagePrice: number | null;
}

export function extractVehicleDetails(detailsData: any, valuationData: any): VehicleDetails {
  console.log('Extracting vehicle details from:', { detailsData, valuationData });

  // Extract make and model with fallbacks
  const make = detailsData?.make || 
               detailsData?.vehicle?.make || 
               valuationData?.make || 
               detailsData?.data?.manufacturer;

  const model = detailsData?.model || 
                detailsData?.vehicle?.model || 
                valuationData?.model || 
                detailsData?.data?.type;

  // Extract year with validation
  const yearValue = detailsData?.year || 
                   detailsData?.vehicle?.year || 
                   valuationData?.year || 
                   detailsData?.data?.year;
  const year = yearValue ? parseInt(yearValue) : null;

  // Extract price/valuation with validation
  const priceValue = valuationData?.price || 
                    valuationData?.valuation?.price || 
                    valuationData?.market_value;
  const valuation = priceValue ? parseFloat(priceValue) : null;

  // Extract average market price with validation
  const avgPriceValue = valuationData?.market_value || 
                       valuationData?.average_price || 
                       valuationData?.valuation?.average_price;
  const averagePrice = avgPriceValue ? parseFloat(avgPriceValue) : null;

  console.log('Extracted vehicle details:', {
    make,
    model,
    year,
    valuation,
    averagePrice
  });

  return {
    make: make || 'Unknown',
    model: model || 'Unknown',
    year,
    valuation,
    averagePrice
  };
}