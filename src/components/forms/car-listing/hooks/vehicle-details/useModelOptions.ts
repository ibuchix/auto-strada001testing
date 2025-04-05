
/**
 * Hook to handle model options based on selected make
 */
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useModelOptions = (make: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Update available models when make changes
  useEffect(() => {
    if (!make) {
      setAvailableModels([]);
      return;
    }
    
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        // This would normally fetch from an API
        // For now we'll use a mock based on make
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
        
        // Mock model data
        const mockModels: Record<string, string[]> = {
          'BMW': ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5'],
          'Audi': ['A1', 'A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
          'Mercedes': ['A Class', 'C Class', 'E Class', 'S Class', 'GLA', 'GLC', 'GLE'],
          'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'ID.3', 'ID.4'],
          'Ford': ['Fiesta', 'Focus', 'Kuga', 'Puma', 'Mondeo', 'Mustang', 'EcoSport'],
          'Toyota': ['Yaris', 'Corolla', 'RAV4', 'C-HR', 'Prius', 'Camry', 'Land Cruiser'],
          'Honda': ['Civic', 'Jazz', 'CR-V', 'HR-V', 'Accord', 'NSX', 'e'],
        };
        
        setAvailableModels(mockModels[make] || []);
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error('Failed to load models for selected make');
        setAvailableModels([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModels();
  }, [make]);
  
  return {
    isLoading,
    availableModels
  };
};
