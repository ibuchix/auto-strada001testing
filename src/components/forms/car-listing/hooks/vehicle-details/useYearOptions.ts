
/**
 * Hook to generate year options for vehicle selection
 */
import { useState, useEffect } from "react";

export const useYearOptions = () => {
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  
  // Generate year options (current year down to 1970)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);
    setYearOptions(years);
  }, []);
  
  return yearOptions;
};
